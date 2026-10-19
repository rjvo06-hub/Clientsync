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
    // Coordenadas centrales de Ottobrunn para la vista inicial
    const ottobrunnCenter = { lat: 48.0686, lng: 11.6289 };

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
        map = new google.maps.Map(mapElement, {
            zoom: 13, // Zoom enfocado en Ottobrunn
            center: ottobrunnCenter,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        window.map = map;
        infoWindow = new google.maps.InfoWindow({
            maxWidth: 220
        });

        // 1. Cargar todos los clientes inicialmente (conservando el enfoque inicial en Ottobrunn)
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

// Función para mostrar el globito flotante ultra compacto y minimalista
function showClientDetailsInfoWindow(client, markerInstance) {
    const hasAppointment = Boolean(client.appointment_date);
    let appointmentSection = '';

    if (hasAppointment) {
        const d = new Date(client.appointment_date);
        const hoursInfo = client.estimated_hours ? ` (${client.estimated_hours}h est.)` : '';
        const formattedDate = `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}`;
        
        appointmentSection = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                <span style="color: #94a3b8; display: block; margin-bottom: 2px;">Cita programada:</span>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                    <strong style="color: #93c5fd;">${formattedDate}</strong>
                    <button type="button" id="infowindow-reschedule-${client.id}" style="background: #2563eb; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: bold; cursor: pointer; white-space: nowrap;">
                        Reprogramar
                    </button>
                </div>
            </div>
        `;
    } else {
        appointmentSection = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                <span style="color: #94a3b8; display: block; margin-bottom: 3px;">Cita programada: <strong style="color: #f87171;">No programada</strong></span>
            </div>
        `;
    }

    let phoneActionHtml = '';
    if (client.phone && client.phone.trim() !== '' && client.phone !== 'N/A') {
        phoneActionHtml = `<a href="tel:${client.phone}" title="Llamar a ${client.phone}" style="text-decoration: none; font-size: 0.75rem; margin-left: 4px;">📞</a>`;
    }

    const contentHtml = `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 0px; width: 195px; background: #0f172a; color: #f8fafc; border-radius: 6px; text-align: left;">
            
            <!-- Nombre centrado y pegado arriba -->
            <div style="border-bottom: 1px solid #1e293b; padding-bottom: 4px; margin-bottom: 5px; text-align: center;">
                <h3 style="margin: 0; font-size: 0.82rem; color: ${hasAppointment ? '#60a5fa' : '#f87171'}; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                </h3>
            </div>

            <!-- Dirección y teléfono -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <p style="margin: 0; font-size: 0.68rem; color: #cbd5e1; line-height: 1.3; text-align: left; flex: 1;">
                    <strong>📍</strong> ${client.address || 'Sin dirección'}, ${client.postal_code || ''}
                </p>
                ${phoneActionHtml}
            </div>

            <!-- Sección de Cita -->
            ${appointmentSection}

            <!-- Botón permanente para Programar nueva cita -->
            <div style="margin-top: 6px;">
                <button type="button" id="infowindow-new-${client.id}" style="background: #0d9488; color: white; border: none; padding: 5px; width: 100%; border-radius: 4px; font-size: 0.68rem; font-weight: bold; cursor: pointer;">
                    📅 Programar nueva cita
                </button>
            </div>

        </div>
    `;

    infoWindow.setContent(contentHtml);
    infoWindow.open(map, markerInstance);

    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const iwContainer = document.querySelector('.gm-style-iw-c');
        if (iwContainer) {
            iwContainer.style.background = '#0f172a';
            iwContainer.style.padding = '2px 6px 6px 6px';
            iwContainer.style.borderRadius = '8px';
            iwContainer.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
        }

        const iwOuter = document.querySelector('.gm-style-iw-d');
        if (iwOuter) {
            iwOuter.style.overflow = 'hidden';
            iwOuter.style.padding = '0';
            iwOuter.style.maxHeight = 'none';
        }

        const closeBtn = document.querySelector('.gm-ui-hover-effect');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }

        let styleTag = document.getElementById('custom-infowindow-dark-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-infowindow-dark-style';
            styleTag.innerHTML = `
                .gm-style-iw-t::after {
                    background: #0f172a !important;
                    box-shadow: none !important;
                }
                .gm-style-iw-tc::after {
                    background: #0f172a !important;
                }
            `;
            document.head.appendChild(styleTag);
        }

        const rescheduleBtn = document.getElementById(`infowindow-reschedule-${client.id}`);
        if (rescheduleBtn) {
            rescheduleBtn.addEventListener('click', () => {
                window.location.href = `./appointment-builder.html?client_id=${client.id}`;
            });
        }

        const newAppointmentBtn = document.getElementById(`infowindow-new-${client.id}`);
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                window.location.href = `./appointment-builder.html?client_id=${client.id}`;
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

        // Solo aplicamos fitBounds si el usuario filtra por un código postal/sector específico
        if (postalFilter && matchedAny && !bounds.isEmpty()) {
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
