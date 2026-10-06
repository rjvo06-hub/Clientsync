import { supabase } from './supabaseClient.js';

let map;
let markers = [];

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

                    // Evento al hacer clic en el pin del cliente (Muestra información básica y botón de redirección)
                    marker.addListener('click', () => {
                        let currentAppointmentInfo = 'No programada';
                        if (client.appointment_date) {
                            const d = new Date(client.appointment_date);
                            const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
                            currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
                        }

                        const sheetContent = `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px;">
                                <h2 style="margin: 0; font-size: 1.2rem; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'};">
                                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                                </h2>
                                <button type="button" id="close-sheet-btn" style="background: #e2e8f0; border: none; font-size: 1.2rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: bold;">✕</button>
                            </div>

                            <p style="margin: 0 0 8px 0; font-size: 0.95rem; color: #4a5568;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                            <p style="margin: 0 0 8px 0; font-size: 0.95rem; color: #4a5568;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
                            <p style="margin: 0 0 20px 0; font-size: 0.95rem; color: #2b6cb0;"><strong>📅 Cita actual:</strong> ${currentAppointmentInfo}</p>
                            
                            <!-- Botón para ir al programa unificado de agendamiento -->
                            <button type="button" id="btn-goto-appointment-${client.id}" style="background: #319795; color: white; border: none; padding: 14px; width: 100%; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                📅 Programar / Gestionar Cita
                            </button>

                            <!-- Botón para eliminar cliente erróneo -->
                            <div style="padding-top: 10px; border-top: 2px dashed #e2e8f0; text-align: center;">
                                <button type="button" id="sheet-delete-client-${client.id}" style="background: #e53e3e; color: white; border: none; padding: 10px; width: 100%; border-radius: 8px; font-size: 0.9rem; font-weight: bold; cursor: pointer;">
                                    🗑️ Eliminar este Cliente Incorrecto
                                </button>
                            </div>
                        `;

                        openMobileBottomSheet(sheetContent);

                        // Evento cerrar panel inferior
                        document.getElementById('close-sheet-btn').addEventListener('click', closeMobileBottomSheet);

                        // Evento para redirigir a appointment-builder.html pasando el ID del cliente
                        document.getElementById(`btn-goto-appointment-${client.id}`).addEventListener('click', () => {
                            window.location.href = `./appointment-builder.html?client_id=${client.id}`;
                        });

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
