import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let markerMap = {}; 

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

        // Crear el contenedor de la tarjeta flotante personalizada sobre el mapa si no existe
        createCustomMapCardContainer();

        // 1. Cargar todos los clientes inicialmente
        await loadAndRenderClients(map);

        // 2. Escuchar el evento cuando el usuario selecciona un sector en el modal de index.html
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            console.log("🎯 Sector recibido para zoom por zona:", targetPostal);
            await zoomToZoneOrPostal(targetPostal);
        });

        // 3. Escuchar el evento del buscador inteligente en client-map.html para hacer zoom y abrir la tarjeta
        window.addEventListener('centerOnClient', (e) => {
            const client = e.detail;
            if (map && client.latitude && client.longitude) {
                const lat = Number(client.latitude);
                const lng = Number(client.longitude);
                
                map.setCenter({ lat, lng });
                map.setZoom(17);

                showCustomMapCard(client);
            }
        });

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Inyectar el contenedor flotante personalizado dentro de la sección del mapa
function createCustomMapCardContainer() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || document.getElementById('custom-map-card')) return;

    // Asegurar que el contenedor del mapa tenga posicionamiento relativo
    mapContainer.style.position = 'relative';

    const card = document.createElement('div');
    card.id = 'custom-map-card';
    card.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        width: 300px;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 1000;
        padding: 16px;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        box-sizing: border-box;
        display: none;
        border: 1px solid #334155;
    `;
    mapContainer.appendChild(card);
}

function showCustomMapCard(client) {
    const card = document.getElementById('custom-map-card');
    if (!card) return;

    const hasAppointment = Boolean(client.appointment_date);
    let currentAppointmentInfo = 'No programada';
    if (client.appointment_date) {
        const d = new Date(client.appointment_date);
        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
        currentAppointmentInfo = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
    }

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 0.95rem; color: ${hasAppointment ? '#60a5fa' : '#f87171'}; font-weight: 700;">
                ${hasAppointment ? '🔵' : '🔴'} ${client.name}
            </h3>
            <button type="button" id="close-custom-card" style="background: #1e293b; color: #94a3b8; border: none; font-size: 0.9rem; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #cbd5e1;"><strong>📍 Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
        <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #cbd5e1;"><strong>📞 Teléfono:</strong> ${client.phone || 'N/A'}</p>
        <p style="margin: 0 0 12px 0; font-size: 0.8rem; color: #93c5fd;"><strong>📅 Cita:</strong> ${currentAppointmentInfo}</p>
        
        <button type="button" id="card-goto-${client.id}" style="background: #0d9488; color: white; border: none; padding: 8px; width: 100%; border-radius: 8px; font-size: 0.8rem; font-weight: bold; cursor: pointer; margin-bottom: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            📅 Gestionar Cita
        </button>
        <button type="button" id="card-delete-${client.id}" style="background: #dc2626; color: white; border: none; padding: 6px; width: 100%; border-radius: 8px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
            🗑️ Eliminar Cliente
        </button>
    `;

    card.style.display = 'block';

    // Evento para cerrar la tarjeta
    document.getElementById('close-custom-card').addEventListener('click', () => {
        card.style.display = 'none';
    });

    // Evento para gestionar cita
    document.getElementById(`card-goto-${client.id}`).addEventListener('click', () => {
        window.location.href = `./appointment-builder.html?client_id=${client.id}`;
    });

    // Evento para eliminar cliente
    document.getElementById(`card-delete-${client.id}`).addEventListener('click', async () => {
        if (confirm(`¿Estás seguro de eliminar a "${client.name}" de la base de datos y del mapa?`)) {
            const deleteBtn = document.getElementById(`card-delete-${client.id}`);
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
                card.style.display = 'none';
                await loadAndRenderClients(map, null);
            }
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
                        title: client.name,
                        icon: { url: markerIcon }
                    });

                    markerMap[client.id] = marker;

                    marker.addListener('click', () => {
                        showCustomMapCard(client);
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
