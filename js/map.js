import { supabase } from './supabaseClient.js';

let map;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function initMapWhenReady() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        startMap();
    } else {
        setTimeout(initMapWhenReady, 100);
    }
}

async function startMap() {
    console.log("🗺️ Inicializando mapa de Google Maps...");
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
        map = new google.maps.Map(mapElement, {
            zoom: 11,
            center: defaultCenter,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        const bounds = new google.maps.LatLngBounds();
        await loadAndRenderZones(map, bounds);
        await loadAndRenderClients(map, bounds);

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            const listener = google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 13) map.setZoom(13);
                google.maps.event.removeListener(listener);
            });
        }
    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

async function loadAndRenderZones(mapInstance, bounds) {
    try {
        const { data: zones, error } = await supabase.from('zones').select('*').not('polygon_coords', 'is', null);
        if (error || !zones) return;

        zones.forEach((zone) => {
            const coords = zone.polygon_coords;
            if (Array.isArray(coords) && coords.length >= 3) {
                const formattedCoords = coords.map(pt => {
                    const latLng = { lat: Number(pt.lat), lng: Number(pt.lng) };
                    bounds.extend(latLng);
                    return latLng;
                });

                const zoneColor = zone.color || '#3182ce';
                const zonePolygon = new google.maps.Polygon({
                    paths: formattedCoords,
                    strokeColor: zoneColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: zoneColor,
                    fillOpacity: 0.35,
                    map: mapInstance
                });

                const infoWindow = new google.maps.InfoWindow();
                zonePolygon.addListener('click', (event) => {
                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: ${zoneColor}; font-size: 1.1rem;">${zone.name}</h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #4a5568;"><strong>CP:</strong> ${zone.postal_code || 'N/A'}</p>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.setPosition(event.latLng);
                    infoWindow.open(mapInstance);
                });
            }
        });
    } catch (err) {
        console.error('❌ Excepción al renderizar zonas:', err);
    }
}

async function loadAndRenderClients(mapInstance, bounds) {
    try {
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error || !clients) return;

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                const clientLatLng = { lat: Number(client.latitude), lng: Number(client.longitude) };
                bounds.extend(clientLatLng);

                const hasAppointment = Boolean(client.appointment_date);
                const markerIcon = hasAppointment 
                    ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                    : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

                const marker = new google.maps.Marker({
                    position: clientLatLng,
                    map: mapInstance,
                    title: client.name,
                    icon: { url: markerIcon }
                });

                const infoWindow = new google.maps.InfoWindow();

                marker.addListener('click', () => {
                    let currentAppointmentInfo = 'No programada';
                    if (client.appointment_date) {
                        const d = new Date(client.appointment_date);
                        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
                        currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
                    }

                    const nearbyClients = clients.filter(c => {
                        if (!c.appointment_date || c.id === client.id || !c.latitude || !c.longitude) return false;
                        const dist = calculateDistanceKm(Number(client.latitude), Number(client.longitude), Number(c.latitude), Number(c.longitude));
                        return dist <= 1.0;
                    });

                    let suggestionsHtml = '';
                    if (nearbyClients.length > 0) {
                        const activeDates = [...new Set(nearbyClients.map(c => c.appointment_date.split('T')[0]))];
                        activeDates.forEach(dateStr => {
                            const dateClients = nearbyClients.filter(c => c.appointment_date.startsWith(dateStr));
                            let details = '';
                            dateClients.forEach(dc => {
                                const dcTime = new Date(dc.appointment_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                const dcHrs = dc.estimated_hours ? ` [${dc.estimated_hours}h]` : '';
                                details += `<div style="font-size: 0.75rem; color: #4a5568;">• ${dc.name} a las ${dcTime}h${dcHrs}</div>`;
                            });

                            suggestionsHtml += `
                                <div style="background: #f0f4f8; padding: 6px; border-radius: 4px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="font-size: 0.8rem; color: #2b6cb0;">📅 Ruta el ${dateStr}</strong>
                                        ${details}
                                    </div>
                                    <button type="button" class="map-pick-date" data-client-id="${client.id}" data-date="${dateStr}" style="background: #38a169; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Usar</button>
                                </div>
                            `;
                        });
                    } else {
                        suggestionsHtml = `<p style="font-size: 0.75rem; color: #718096; margin: 4px 0;">No hay citas a menos de 1 km. Asigna una fecha libre:</p>`;
                    }

                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 230px; max-width: 280px;">
                            <h3 style="margin: 0 0 4px 0; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'}; font-size: 1rem;">
                                ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                            </h3>
                            <p style="margin: 0 0 2px 0; font-size: 0.8rem; color: #4a5568;"><strong>Dir:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                            <p style="margin: 0 0 2px 0; font-size: 0.8rem; color: #4a5568;"><strong>Tel:</strong> ${client.phone || 'N/A'}</p>
                            <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #2b6cb0;"><strong>Cita actual:</strong> ${currentAppointmentInfo}</p>
                            
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 4px;">
                                <label style="font-size: 0.75rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 2px;">⏰ Hora de atención:</label>
                                <input type="time" id="map-time-${client.id}" value="09:00" style="width: 100%; padding: 4px; font-size: 0.8rem; border: 1px solid #cbd5e0; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px;">
                                
                                <label style="font-size: 0.75rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 2px;">⏳ Horas estimadas:</label>
                                <input type="number" id="map-hours-${client.id}" step="0.5" min="0.5" placeholder="Ej. 1.5" style="width: 100%; padding: 4px; font-size: 0.8rem; border: 1px solid #cbd5e0; border-radius: 4px; box-sizing: border-box; margin-bottom: 6px;">

                                <div style="font-size: 0.8rem; font-weight: bold; color: #2d3748; margin-bottom: 2px;">Sugerencias por Proximidad (1 km):</div>
                                ${suggestionsHtml}

                                <div style="margin-top: 6px; display: flex; gap: 4px;">
                                    <input type="date" id="map-free-date-${client.id}" style="flex: 1; padding: 4px; font-size: 0.75rem; border: 1px solid #cbd5e0; border-radius: 4px;">
                                    <button type="button" id="map-save-free-${client.id}" style="background: #2b6cb0; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Guardar Libre</button>
                                </div>
                            </div>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.open(mapInstance, marker);
                });

                google.maps.event.addListener(infoWindow, 'domready', () => {
                    const pickButtons = document.querySelectorAll(`.map-pick-date[data-client-id="${client.id}"]`);
                    pickButtons.forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const dateStr = btn.getAttribute('data-date');
                            const timeVal = document.getElementById(`map-time-${client.id}`).value || '09:00';
                            const hoursVal = document.getElementById(`map-hours-${client.id}`).value;
                            const finalTimestamp = `${dateStr}T${timeVal}:00.000Z`;

                            btn.textContent = 'Guardando...';
                            const { error: updErr } = await supabase
                                .from('clients')
                                .update({
                                    appointment_date: finalTimestamp,
                                    estimated_hours: hoursVal ? parseFloat(hoursVal) : null
                                })
                                .eq('id', client.id);

                            if (updErr) {
                                alert('Error al actualizar: ' + updErr.message);
                            } else {
                                alert('¡Cita agendada con éxito!');
                                infoWindow.close();
                                startMap();
                            }
                        });
                    });

                    const saveFreeBtn = document.getElementById(`map-save-free-${client.id}`);
                    if (saveFreeBtn) {
                        saveFreeBtn.addEventListener('click', async () => {
                            const freeDate = document.getElementById(`map-free-date-${client.id}`).value;
                            if (!freeDate) {
                                alert('Selecciona una fecha libre.');
                                return;
                            }
                            const timeVal = document.getElementById(`map-time-${client.id}`).value || '09:00';
                            const hoursVal = document.getElementById(`map-hours-${client.id}`).value;
                            const finalTimestamp = `${freeDate}T${timeVal}:00.000Z`;

                            saveFreeBtn.textContent = '...';
                            const { error: updErr } = await supabase
                                .from('clients')
                                .update({
                                    appointment_date: finalTimestamp,
                                    estimated_hours: hoursVal ? parseFloat(hoursVal) : null
                                })
                                .eq('id', client.id);

                            if (updErr) {
                                alert('Error al actualizar: ' + updErr.message);
                            } else {
                                alert('¡Cita agendada con éxito!');
                                infoWindow.close();
                                startMap();
                            }
                        });
                    }
                });
            }
        });
    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
