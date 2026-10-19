import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let markerMap = {}; // Mapa para asociar el ID del cliente con su marcador exacto
let infoWindow = null; // Instancia única para el globito flotante

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

        window.map = map;
        infoWindow = new google.maps.InfoWindow();

        // 1. Cargar todos los clientes inicialmente
        await loadAndRenderClients(map);

        // 2. Escuchar el evento cuando el usuario selecciona un sector en el modal de index.html
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            console.log("🎯 Sector recibido para zoom por zona:", targetPostal);
            await zoomToZoneOrPostal(targetPostal);
        });

        // 3. Escuchar el evento del buscador inteligente en client-map.html para hacer zoom y abrir el globito correcto
        window.addEventListener('centerOnClient', (e) => {
            const client = e.detail;
            if (map && client.latitude && client.longitude) {
                const lat = Number(client.latitude);
                const lng = Number(client.longitude);
                
                map.setCenter({ lat, lng });
                map.setZoom(17);

                // Abrir el globito en el marcador correspondiente de ese cliente
                const marker = markerMap[client.id];
                if (marker) {
                    showClientDetailsInfoWindow(client, marker);
                }
            }
        });

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Función para mostrar el globito (InfoWindow) con diseño contrastado y profesional
function showClientDetailsInfoWindow(client, markerInstance) {
    const hasAppointment = Boolean(client.appointment_date);
    let currentAppointmentInfo = 'No programada';
    if (client.appointment_date) {
        const d = new Date(client.appointment_date);
        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
        currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
    }

    const contentHtml = `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 0; max-width: 280px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <!-- Encabezado con contraste -->
            <div style="background: #f1f5f9; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 0.95rem; color: ${hasAppointment ? '#1d4ed8' : '#dc2626'}; font-weight: 700;">
                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                </h3>
            </div>
            <!-- Cuerpo de la tarjeta -->
            <div style="padding: 12px;">
                <p style="margin: 0 0 6px 0; font-size: 0.82rem; color: #334155;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                <p style="margin: 0 0 6px 0; font-size: 0.82rem; color: #334155;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
                <p style="margin: 0 0 12px 0; font-size: 0.82rem; color: #2563eb;"><strong>📅 Cita:</strong> ${currentAppointmentInfo}</p>
                
                <button type="button" id="infowindow-goto-${client.id}" style="background: #0d9488; color: white; border: none; padding: 9px; width: 100%; border-radius: 8px; font-size: 0.82rem; font-weight: bold; cursor: pointer; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                    📅 Gestionar Cita
                </button>
                <button type="button" id="infowindow-delete-${client.id}" style="background: #ef4444; color: white; border: none; padding: 7px; width: 100%; border-radius: 8px; font-size: 0.78rem; font-weight: bold; cursor: pointer;">
                    🗑️ Eliminar Cliente
                </button>
            </div>
        </div>
    `;

    infoWindow.setContent(contentHtml);
    infoWindow.open(map, markerInstance);

    // Asignar eventos a los botones dentro del globito cuando se rendericen en el DOM
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const gotoBtn = document.getElementById(`infowindow-goto-${client.id}`);
        if (gotoBtn) {
            gotoBtn.addEventListener('click', () => {
                window.location.href = `./appointment-builder.html?client_id=${client.id}`;
            });
        }

        const deleteBtn = document.getElementById(`infowindow-delete-${client.id}`);
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
                        deleteBtn.textContent = '🗑️ Eliminar Cliente';
                    } else {
                        alert('¡Cliente eliminado correctamente!');
                        infoWindow.close();
                        await loadAndRenderClients(map, null);
                    }
                }
            });
        }
    });
}

async function loadAndRenderClients(mapInstance, postalFilter = null) {
    try {
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error || !clients) return;

        // Limpiar marcadores previos y registro
        markers.forEach(m => m.setMap(null));
        markers = [];
        markerMap = {};

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

                    // Guardar referencia en el diccionario de marcadores
                    markerMap[client.id] = marker;

                    marker.addListener('click', () => {
                        showClientDetailsInfoWindow(client, marker);
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
