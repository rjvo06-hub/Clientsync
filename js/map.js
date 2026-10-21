import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let markerMap = {}; 
let infoWindow = null;

function initMapWhenReady() {
    if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.Map === 'function') {
        startMap();
    } else {
        setTimeout(initMapWhenReady, 100);
    }
}

async function startMap() {
    console.log("🗺️ Inicializando mapa de Google Maps...");
    const ottobrunnCenter = { lat: 48.0664, lng: 11.6611 };

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
        map = new google.maps.Map(mapElement, {
            zoom: 14,
            center: ottobrunnCenter,
            gestureHandling: 'greedy',
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

        // 1. Cargar clientes y sus citas asociadas desde appointments
        await loadAndRenderClients(map);

        // 2. Escuchar el evento cuando el usuario selecciona un sector
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            await zoomToZoneOrPostal(targetPostal);
        });

        // 3. Escuchar el evento del buscador inteligente
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

// Función para mostrar el globito flotante con todas las citas listadas
async function showClientDetailsInfoWindow(client, markerInstance) {
    let appointments = [];
    try {
        const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_id', client.id)
            .order('scheduled_date', { ascending: true });
        appointments = data || [];
    } catch (err) {
        console.error("Error al consultar citas del cliente:", err);
    }

    const hasAppointment = appointments.length > 0;
    let appointmentSection = '';

    if (hasAppointment) {
        let apptsHtml = '';
        appointments.forEach((appt, index) => {
            const d = new Date(appt.scheduled_date);
            const hoursInfo = appt.estimated_hours ? ` (${appt.estimated_hours}h)` : '';
            const formattedDate = !isNaN(d) ? `${d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}${hoursInfo}` : 'Fecha pendiente';
            
            apptsHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #1e293b;">
                    <div>
                        <strong style="color: #93c5fd; font-size: 0.62rem; display: block;">Cita #${index + 1}:</strong>
                        <span style="color: #f8fafc; font-size: 0.60rem;">${formattedDate}</span>
                    </div>
                    <button type="button" class="btn-infowindow-reschedule" data-client-id="${client.id}" style="background: #2563eb; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-size: 0.58rem; font-weight: bold; cursor: pointer; white-space: nowrap;">
                        Reprogramar
                    </button>
                </div>
            `;
        });

        appointmentSection = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                <span style="color: #94a3b8; display: block; margin-bottom: 3px;">Citas programadas (${appointments.length}):</span>
                <div style="max-height: 110px; overflow-y: auto;">
                    ${apptsHtml}
                </div>
            </div>
        `;
    } else {
        appointmentSection = `
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                <span style="color: #94a3b8; display: block; margin-bottom: 2px;">Cita programada: <strong style="color: #f87171;">No programada</strong></span>
            </div>
        `;
    }

    const clientPhone = client.phone || client.telefono || client.phone_number || client.celular || '';
    let phoneActionHtml = '';
    if (clientPhone && String(clientPhone).trim() !== '' && String(clientPhone) !== 'N/A') {
        phoneActionHtml = `<a href="tel:${clientPhone}" title="Llamar a ${clientPhone}" style="text-decoration: none; font-size: 0.8rem; margin-left: 6px; display: inline-flex; align-items: center;">📞</a>`;
    }

    const contentHtml = `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 0px; width: 190px; max-width: 100%; background: #0f172a; color: #f8fafc; border-radius: 6px; text-align: left; box-sizing: border-box;">
            
            <div style="border-bottom: 1px solid #1e293b; padding-bottom: 3px; margin-bottom: 4px; text-align: center;">
                <h3 style="margin: 0; font-size: 0.78rem; color: ${hasAppointment ? '#60a5fa' : '#f87171'}; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                </h3>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <p style="margin: 0; font-size: 0.65rem; color: #cbd5e1; line-height: 1.2; text-align: left; flex: 1; word-break: break-word;">
                    <strong>📍</strong> ${client.address || 'Sin dirección'}, ${client.postal_code || ''}
                </p>
                ${phoneActionHtml}
            </div>

            ${appointmentSection}

            <div style="margin-top: 5px; display: flex; gap: 4px;">
                <button type="button" id="infowindow-new-${client.id}" style="background: #0d9488; color: white; border: none; padding: 5px; width: 100%; border-radius: 4px; font-size: 0.62rem; font-weight: bold; cursor: pointer;">
                    📅 Nueva Cita
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
            iwContainer.style.padding = '2px 4px 4px 4px';
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
        if (closeBtn) closeBtn.style.display = 'none';

        let styleTag = document.getElementById('custom-infowindow-dark-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-infowindow-dark-style';
            styleTag.innerHTML = `
                .gm-style-iw-t::after { background: #0f172a !important; box-shadow: none !important; }
                .gm-style-iw-tc::after { background: #0f172a !important; }
            `;
            document.head.appendChild(styleTag);
        }

        // Asignar evento a los botones de reprogramar de cada cita en la lista
        const rescheduleBtns = document.querySelectorAll('.btn-infowindow-reschedule');
        rescheduleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `./appointment-builder.html?client_id=${client.id}&action=reschedule`;
            });
        });

        const newAppointmentBtn = document.getElementById(`infowindow-new-${client.id}`);
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                window.location.href = `./appointment-builder.html?client_id=${client.id}&action=new`;
            });
        }
    });
}

// Cargar clientes y verificar en appointments quiénes tienen cita para marcarlos en azul
async function loadAndRenderClients(mapInstance, postalFilter = null) {
    try {
        const [{ data: clients, error: clientErr }, { data: appointments, error: apptErr }] = await Promise.all([
            supabase.from('clients').select('*'),
            supabase.from('appointments').select('client_id')
        ]);

        if (clientErr || !clients) return;

        const clientIdsWithAppointment = new Set((appointments || []).map(a => a.client_id));

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

                    const hasAppointment = clientIdsWithAppointment.has(client.id);
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
                        window._isClickingMarker = true;
                        showClientDetailsInfoWindow(client, marker);
                        setTimeout(() => { window._isClickingMarker = false; }, 200);
                    });

                    markers.push(marker);
                }
            }
        });

        if (postalFilter && matchedAny && !bounds.isEmpty()) {
            mapInstance.fitBounds(bounds);
        }
    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}

document.addEventListener('click', (e) => {
    if (infoWindow && !window._isClickingMarker) {
        const target = e.target;
        const isInsideMap = target.closest('#map');
        const isInsideInfoWindow = target.closest('.gm-style-iw-c');
        const isMarker = target.closest('img[src*="mapfiles"]');

        if (isInsideMap && !isInsideInfoWindow && !isMarker) {
            infoWindow.close();
        }
    }
});

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
    } catch (err) {
        console.error("Error al aplicar zoom por zona:", err);
        await loadAndRenderClients(map, postalCode);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
