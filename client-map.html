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

        // Exponer la instancia globalmente para controles externos (buscador inteligente)
        window.map = map;

        // Crear el contenedor flotante pequeño y elegante en el DOM
        createMobileBottomSheetContainer();

        // 1. Cargar todos los clientes inicialmente
        await loadAndRenderClients(map);

        // 2. Escuchar el evento cuando el usuario selecciona un sector en el modal de index.html
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            console.log("🎯 Sector recibido para zoom por zona:", targetPostal);
            await zoomToZoneOrPostal(targetPostal);
        });

        // 3. Escuchar el evento del buscador inteligente en client-map.html para hacer zoom y abrir la tarjeta correcta
        window.addEventListener('centerOnClient', (e) => {
            const client = e.detail;
            if (map && client.latitude && client.longitude) {
                const lat = Number(client.latitude);
                const lng = Number(client.longitude);
                
                map.setCenter({ lat, lng });
                map.setZoom(17); // Zoom de acercamiento perfecto

                // Abrir directamente la tarjeta flotante compacta con los datos de ESTE cliente exacto
                showClientDetailsBottomSheet(client);
            }
        });

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Inyectar el contenedor flotante pequeño en el DOM (no cubre toda la pantalla)
function createMobileBottomSheetContainer() {
    if (document.getElementById('client-bottom-sheet')) return;

    const sheet = document.createElement('div');
    sheet.id = 'client-bottom-sheet';
    sheet.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 420px;
        max-height: 75vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        transition: all 0.3s ease-in-out;
        box-sizing: border-box;
        padding: 16px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: none;
    `;
    document.body.appendChild(sheet);
}

function openMobileBottomSheet(htmlContent) {
    const sheet = document.getElementById('client-bottom-sheet');
    if (sheet) {
        sheet.innerHTML = htmlContent;
        sheet.style.display = 'block';
    }
}

function closeMobileBottomSheet() {
    const sheet = document.getElementById('client-bottom-sheet');
    if (sheet) {
        sheet.style.display = 'none';
    }
}

// Función centralizada para mostrar la tarjeta flotante compacta de un cliente
function showClientDetailsBottomSheet(client) {
    const hasAppointment = Boolean(client.appointment_date);
    let currentAppointmentInfo = 'No programada';
    if (client.appointment_date) {
        const d = new Date(client.appointment_date);
        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
        currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
    }

    const sheetContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 1.05rem; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'};">
                ${hasAppointment ? '🔵' : '🔴'} ${client.name}
            </h2>
            <button type="button" id="close-sheet-btn" style="background: #e2e8f0; border: none; font-size: 1rem; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-weight: bold;">✕</button>
        </div>

        <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #4a5568;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
        <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #4a5568;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
        <p style="margin: 0 0 14px 0; font-size: 0.85rem; color: #2b6cb0;"><strong>📅 Cita actual:</strong> ${currentAppointmentInfo}</p>
        
        <button type="button" id="btn-goto-appointment-${client.id}" style="background: #319795; color: white; border: none; padding: 10px; width: 100%; border-radius: 8px; font-size: 0.9rem; font-weight: bold; cursor: pointer; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            📅 Programar / Gestionar Cita
        </button>

        <div style="padding-top: 8px; border-top: 2px dashed #e2e8f0; text-align: center;">
            <button type="button" id="sheet-delete-client-${client.id}" style="background: #e53e3e; color: white; border: none; padding: 8px; width: 100%; border-radius: 8px; font-size: 0.85rem; font-weight: bold; cursor: pointer;">
                🗑️ Eliminar este Cliente Incorrecto
            </button>
        </div>
    `;

    openMobileBottomSheet(sheetContent);

    // Evento cerrar panel flotante
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
                    await loadAndRenderClients(map, null);
                }
            }
        });
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

                    marker.addListener('click', () => {
                        showClientDetailsBottomSheet(client);
                    });

                    markers.push(marker);
                }
            }
        });

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
