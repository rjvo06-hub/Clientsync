import { supabase } from './supabaseClient.js';

let map;
let markers = [];

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

        // Crear el contenedor inferior flotante para móviles (Bottom Sheet) si no existe
        createMobileBottomSheetContainer();

        // 1. Cargar todos los clientes inicialmente
        await loadAndRenderClients(map);

        // 2. Escuchar el evento cuando el usuario selecciona un sector en el modal de index.html
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            console.log("🎯 Sector recibido para zoom por zona:", targetPostal);
            await zoomToZoneOrPostal(targetPostal);
        });

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Inyectar el contenedor flotante inferior en el DOM para la vista móvil
function createMobileBottomSheetContainer() {
    if (document.getElementById('client-bottom-sheet')) return;

    const sheet = document.createElement('div');
    sheet.id = 'client-bottom-sheet';
    sheet.style.cssText = `
        position: fixed;
        bottom: -100%;
        left: 0;
        width: 100%;
        max-height: 85vh;
        background: white;
        border-top-left-radius: 20px;
        border-top-right-radius: 20px;
        box-shadow: 0 -5px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        transition: bottom 0.3s ease-in-out;
        box-sizing: border-box;
        padding: 20px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    document.body.appendChild(sheet);
}

function openMobileBottomSheet(htmlContent) {
    const sheet = document.getElementById('client-bottom-sheet');
    if (sheet) {
        sheet.innerHTML = htmlContent;
        sheet.style.bottom = '0';
    }
}

function closeMobileBottomSheet() {
    const sheet = document.getElementById('client-bottom-sheet');
    if (sheet) {
        sheet.style.bottom = '-100%';
    }
}

async function loadAndRenderClients(mapInstance, postalFilter = null) {
    try {
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error || !clients) return;

        // Limpiar marcadores previos
        markers.forEach(m => m.setMap(null));
        markers = [];

        const bounds = new google.maps.LatLngBounds();
        let matchedAny = false;

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                const matchesPostal = !postalFilter || (client.postal_code && client.postal_code.trim() === postalFilter);

                if (matchesPostal) {
                    const clientLatLng = { lat: Number(client.latitude), lng: Number(client.longitude) };
                    bounds.extend(clientLatLng);
                    matchedAny = true;

                    // Icono azul si tiene cita, rojo si no tiene
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

                    // Evento al hacer clic en el pin del cliente
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
                                    details += `<div style="font-size: 0.85rem; color: #4a5568; margin-top: 2px;">• ${dc.name} a las ${dcTime}h${dcHrs}</div>`;
                                });

                                suggestionsHtml += `
                                    <div style="background: #f0f4f8; padding: 10px; border-radius: 8px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e0;">
                                        <div>
                                            <strong style="font-size: 0.9rem; color: #2b6cb0;">📅 Ruta el ${dateStr}</strong>
                                            ${details}
                                        </div>
                                        <button type="button" class="sheet-pick-date" data-client-id="${client.id}" data-date="${dateStr}" style="background: #38a169; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; cursor: pointer;">Usar</button>
                                    </div>
                                `;
                            });
                        } else {
                            suggestionsHtml = `<p style="font-size: 0.85rem; color: #718096; margin: 8px 0;">No hay citas a menos de 1 km. Selecciona una fecha libre abajo:</p>`;
                        }

                        const sheetContent = `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px;">
                                <h2 style="margin: 0; font-size: 1.2rem; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'};">
                                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                                </h2>
                                <button type="button" id="close-sheet-btn" style="background: #e2e8f0; border: none; font-size: 1.2rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: bold;">✕</button>
                            </div>

                            <p style="margin: 0 0 6px 0; font-size: 0.9rem; color: #4a5568;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                            <p style="margin: 0 0 6px 0; font-size: 0.9rem; color: #4a5568;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
                            <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: #2b6cb0;"><strong>📅 Cita actual:</strong> ${currentAppointmentInfo}</p>
                            
                            <div style="background: #f7fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                <div style="margin-bottom: 12px;">
                                    <label style="font-size: 0.85rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 4px;">⏰ Hora de atención:</label>
                                    <input type="time" id="sheet-time-${client.id}" value="09:00" style="width: 100%; padding: 10px; font-size: 1rem; border: 1px solid #cbd5e0; border-radius: 8px; box-sizing: border-box; background: white;">
                                </div>
                                
                                <div style="margin-bottom: 12px;">
                                    <label style="font-size: 0.85rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 4px;">⏳ Horas estimadas (opcional):</label>
                                    <input type="number" id="sheet-hours-${client.id}" step="0.5" min="0.5" placeholder="Ej. 1.5" style="width: 100%; padding: 10px; font-size: 1rem; border: 1px solid #cbd5e0; border-radius: 8px; box-sizing: border-box; background: white;">
                                </div>

                                <div style="font-size: 0.9rem; font-weight: bold; color: #2d3748; margin-top: 15px; margin-bottom: 5px;">💡 Sugerencias por Proximidad (1 km):</div>
                                ${suggestionsHtml}

                                <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #cbd5e0;">
                                    <label style="font-size: 0.85rem; font-weight: bold; color: #2d3748; display: block; margin-bottom: 4px;">O elige una fecha libre:</label>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="date" id="sheet-free-date-${client.id}" style="flex: 1; padding: 10px; font-size: 0.9rem; border: 1px solid #cbd5e0; border-radius: 8px; background: white;">
                                        <button type="button" id="sheet-save-free-${client.id}" style="background: #2b6cb0; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: bold; cursor: pointer;">Guardar</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Botón para eliminar cliente erróneo -->
                            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #e2e8f0; text-align: center;">
                                <button type="button" id="sheet-delete-client-${client.id}" style="background: #e53e3e; color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer;">
                                    🗑️ Eliminar este Cliente Incorrecto
                                </button>
                            </div>
                        `;

                        openMobileBottomSheet(sheetContent);

                        // Evento cerrar panel inferior
                        document.getElementById('close-sheet-btn').addEventListener('click', closeMobileBottomSheet);

                        // Botón eliminar cliente
                        const deleteBtn = document.getElementById(`sheet-delete-client-${client.id}`);
                        if (deleteBtn) {
                            deleteBtn.addEventListener('click', async () => {
                                if (confirm(`¿Estás seguro de eliminar a "${client.name}" de la base de datos y del mapa?`)) {
                                    deleteBtn.textContent = 'Eliminando...';
                                    const { error: delErr } = await supabase
                                        .from('clients')
                                        .delete()
                                        .eq('id', client.id);

                                    if (delErr) {
                                        alert('Error al eliminar: ' + delErr.message);
                                        deleteBtn.textContent = '🗑️ Eliminar este Cliente Incorrecto';
                                    } else {
                                        alert('¡Cliente eliminado correctamente!');
                                        closeMobileBottomSheet();
                                        await loadAndRenderClients(mapInstance, postalFilter);
                                    }
                                }
                            });
                        }

                        // Botones de sugerencia rápida ("Usar")
                        const pickButtons = document.querySelectorAll(`.sheet-pick-date[data-client-id="${client.id}"]`);
                        pickButtons.forEach(btn => {
                            btn.addEventListener('click', async () => {
                                const dateStr = btn.getAttribute('data-date');
                                const timeVal = document.getElementById(`sheet-time-${client.id}`).value || '09:00';
                                const hoursVal = document.getElementById(`sheet-hours-${client.id}`).value;
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
                                    closeMobileBottomSheet();
                                    await loadAndRenderClients(mapInstance, postalFilter);
                                }
                            });
                        });

                        // Botón para guardar fecha libre
                        const saveFreeBtn = document.getElementById(`sheet-save-free-${client.id}`);
                        if (saveFreeBtn) {
                            saveFreeBtn.addEventListener('click', async () => {
                                const freeDate = document.getElementById(`sheet-free-date-${client.id}`).value;
                                if (!freeDate) {
                                    alert('Selecciona una fecha libre en el calendario.');
                                    return;
                                }
                                const timeVal = document.getElementById(`sheet-time-${client.id}`).value || '09:00';
                                const hoursVal = document.getElementById(`sheet-hours-${client.id}`).value;
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
                                    closeMobileBottomSheet();
                                    await loadAndRenderClients(mapInstance, postalFilter);
                                }
                            });
                        }
                    });

                    markers.push(marker);
                }
            }
        });

        // Si no hay filtro de sector específico, ajustamos bounds generales de los clientes
        if (!postalFilter && matchedAny && !bounds.isEmpty()) {
            mapInstance.fitBounds(bounds);
        }
    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}

async function zoomToZoneOrPostal(postalCode) {
    if (!map) return;

    try {
        const { data: zoneData, error: zoneError } = await supabase
            .from('zones')
            .select('*')
            .eq('postal_code', postalCode)
            .maybeSingle();

        let zoomed = false;

        if (!zoneError && zoneData && zoneData.polygon_coords && Array.isArray(zoneData.polygon_coords) && zoneData.polygon_coords.length >= 3) {
            const zoneBounds = new google.maps.LatLngBounds();
            zoneData.polygon_coords.forEach(pt => {
                zoneBounds.extend({ lat: Number(pt.lat), lng: Number(pt.lng) });
            });

            if (!zoneBounds.isEmpty()) {
                map.fitBounds(zoneBounds);
                zoomed = true;
            }
        }

        await loadAndRenderClients(map, postalCode);

        if (!zoomed) {
            console.log("📍 Zoom ajustado mediante los puntos de los clientes del sector.");
        }

    } catch (err) {
        console.error("Error al aplicar zoom por zona:", err);
        await loadAndRenderClients(map, postalCode);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
