import { supabase } from './supabaseClient.js';

let map;

function initMapWhenReady() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        startMap();
    } else {
        setTimeout(initMapWhenReady, 100);
    }
}

async function startMap() {
    console.log("🗺️ Inicializando mapa de Google Maps...");
    const defaultCenter = { lat: 48.0686, lng: 11.6289 }; // Ottobrunn / Múnich

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("❌ No se encontró el contenedor #map en el DOM.");
        return;
    }

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
        console.log("✅ Mapa creado con éxito.");

        const bounds = new google.maps.LatLngBounds();

        // 1. Cargar y renderizar Zonas
        await loadAndRenderZones(map, bounds);

        // 2. Cargar y renderizar Clientes con gestión interactiva de citas
        await loadAndRenderClients(map, bounds);

        // Ajuste automático del mapa
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            
            const listener = google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 13) {
                    map.setZoom(13);
                }
                google.maps.event.removeListener(listener);
            });
        }

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Renderizar Zonas Poligonales
async function loadAndRenderZones(mapInstance, bounds) {
    try {
        const { data: zones, error } = await supabase
            .from('zones')
            .select('*')
            .not('polygon_coords', 'is', null);

        if (error) {
            console.error('❌ Error al cargar zonas:', error.message);
            return;
        }

        if (!zones || zones.length === 0) return;

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

// Renderizar Marcadores de Clientes con Citas Interactivas desde el Mapa
async function loadAndRenderClients(mapInstance, bounds) {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*');

        if (error) {
            console.error('❌ Error al cargar clientes:', error.message);
            return;
        }

        if (!clients || clients.length === 0) {
            console.warn('⚠️ No hay clientes registrados.');
            return;
        }

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
                    let formattedDefaultVal = '';
                    if (client.appointment_date) {
                        const d = new Date(client.appointment_date);
                        const pad = (n) => String(n).padStart(2, '0');
                        formattedDefaultVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    }

                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 220px;">
                            <h3 style="margin: 0 0 5px 0; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'}; font-size: 1.1rem;">
                                ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                            </h3>
                            <p style="margin: 0 0 3px 0; font-size: 0.85rem; color: #4a5568;"><strong>Dir:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                            <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #4a5568;"><strong>Tel:</strong> ${client.phone || 'N/A'}</p>
                            
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 5px;">
                                <label style="font-size: 0.8rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 3px;">📅 Agendar / Editar Cita:</label>
                                <input type="datetime-local" id="map-appt-${client.id}" value="${formattedDefaultVal}" style="width: 100%; padding: 6px; font-size: 0.8rem; border: 1px solid #cbd5e0; border-radius: 4px; box-sizing: border-box; margin-bottom: 6px;">
                                <button id="save-appt-btn-${client.id}" style="width: 100%; background: #38a169; color: white; border: none; padding: 7px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; cursor: pointer;">Guardar Cita</button>
                            </div>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.open(mapInstance, marker);
                });

                // Habilitar la interactividad del botón una vez que la ventana de información se renderiza en el DOM
                google.maps.event.addListener(infoWindow, 'domready', () => {
                    const saveBtn = document.getElementById(`save-appt-btn-${client.id}`);
                    if (saveBtn) {
                        saveBtn.addEventListener('click', async () => {
                            const inputVal = document.getElementById(`map-appt-${client.id}`).value;
                            const newDate = inputVal ? new Date(inputVal).toISOString() : null;

                            saveBtn.textContent = 'Guardando...';
                            saveBtn.disabled = true;

                            const { error: updateError } = await supabase
                                .from('clients')
                                .update({ appointment_date: newDate })
                                .eq('id', client.id);

                            if (updateError) {
                                alert('Error al guardar la cita: ' + updateError.message);
                                saveBtn.textContent = 'Guardar Cita';
                                saveBtn.disabled = false;
                            } else {
                                alert('¡Cita actualizada con éxito!');
                                infoWindow.close();
                                startMap(); // Recarga el mapa para reflejar el cambio de icono (rojo a azul)
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
