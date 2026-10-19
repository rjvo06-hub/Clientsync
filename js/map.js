import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let markerMap = {}; 
let infoWindow = null;

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
        // Creamos la InfoWindow configurando un maxWidth para que se adapte limpiamente
        infoWindow = new google.maps.InfoWindow({
            maxWidth: 320
        });

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

// Función para mostrar el globito flotante con diseño limpio y sin el cuadro blanco ni la X
function showClientDetailsInfoWindow(client, markerInstance) {
    const hasAppointment = Boolean(client.appointment_date);
    let currentAppointmentInfo = 'No programada';
    if (client.appointment_date) {
        const d = new Date(client.appointment_date);
        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
        currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
    }

    const contentHtml = `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 2px; width: 250px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 0.95rem; color: ${hasAppointment ? '#60a5fa' : '#f87171'}; font-weight: 700;">
                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                </h3>
            </div>
            <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #cbd5e1;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}</p>
            <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #cbd5e1;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
            <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #93c5fd;"><strong>📅 Cita:</strong> ${currentAppointmentInfo}</p>
            
            <button type="button" id="infowindow-goto-${client.id}" style="background: #0d9488; color: white; border: none; padding: 8px; width: 100%; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                📅 Gestionar Cita
            </button>
            <button type="button" id="infowindow-delete-${client.id}" style="background: #dc2626; color: white; border: none; padding: 6px; width: 100%; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                🗑️ Eliminar Cliente
            </button>
        </div>
    `;

    infoWindow.setContent(contentHtml);
    infoWindow.open(map, markerInstance);

    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        // Inyectar CSS dinámico para ocultar la "X" y los bordes blancos por defecto de Google Maps InfoWindow
        const gmStyleWander = document.querySelector('.gm-style-iw');
        if (gmStyleWander) {
            const parentElement = gmStyleWander.closest('.gm-style-iw-c');
            if (parentElement) {
                parentElement.style.background = '#0f172a';
                parentElement.style.padding = '12px';
                parentElement.style.borderRadius = '12px';
                parentElement.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
            }
            // Ocultar el botón de cierre nativo (la X)
            const closeBtn = gmStyleWander.querySelector('.gm-ui-hover-effect');
            if (closeBtn) {
                closeBtn.style.display = 'none';
            }
        }

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
                        title: `${client.name} (${client.address || 'Sin dirección'})`,
                        icon: { url: markerIcon }
                    });

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
