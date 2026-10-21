import { supabase } from './supabaseClient.js';

export function initInteractiveMapModal(modalId, mapContainerId, openBtnId, closeBtnId, getClientsCallback, onClientSelectedCallback) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const mapElement = document.getElementById(mapContainerId);

    if (!modal || !openBtn || !mapElement) return;

    let modalMap = null;
    let modalMarkers = [];
    let modalInfoWindow = null;
    let userLocationMarker = null; // Referencia para tu marcador de ubicación

    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            if (modalMap) {
                google.maps.event.trigger(modalMap, 'resize');
                const activeClient = window.activeClient;
                if (activeClient && activeClient.latitude && activeClient.longitude) {
                    modalMap.setCenter({ lat: Number(activeClient.latitude), lng: Number(activeClient.longitude) });
                    modalMap.setZoom(17);
                } else {
                    // Si no hay cliente activo, centrar en Ottobrunn
                    modalMap.setCenter({ lat: 48.0664, lng: 11.6611 });
                    modalMap.setZoom(14);
                }
            } else {
                initModalMap();
            }
        }, 150);
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (modalInfoWindow) modalInfoWindow.close();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (modalInfoWindow) modalInfoWindow.close();
        }
    });

    async function initModalMap() {
        const ottobrunnCenter = { lat: 48.0664, lng: 11.6611 };
        
        modalMap = new google.maps.Map(mapElement, {
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

        modalInfoWindow = new google.maps.InfoWindow({
            maxWidth: 195
        });

        // Cerrar la ventana del cliente al hacer clic en cualquier parte vacía del mapa
        modalMap.addListener('click', () => {
            if (modalInfoWindow) {
                modalInfoWindow.close();
            }
        });

        // CREAR UN BOTÓN FLOTANTE EN EL MAPA PARA OBTENER TU UBICACIÓN
        createGeolocationControl();

        await loadAndRenderModalClients();
    }

    // Función para crear el botón flotante de geolocalización dentro del contenedor del mapa
    function createGeolocationControl() {
        const controlDiv = document.createElement('div');
        controlDiv.style.margin = '10px';
        controlDiv.style.zIndex = '5';

        const controlButton = document.createElement('button');
        controlButton.style.backgroundColor = '#ffffff';
        controlButton.style.border = '2px solid rgba(0,0,0,0.2)';
        controlButton.style.borderRadius = '6px';
        controlButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        controlButton.style.cursor = 'pointer';
        controlButton.style.fontFamily = 'Roboto, Arial, sans-serif';
        controlButton.style.fontSize = '12px';
        controlButton.style.fontWeight = 'bold';
        controlButton.style.padding = '8px 12px';
        controlButton.style.textAlign = 'center';
        controlButton.style.color = '#2d3748';
        controlButton.innerHTML = '📍 Mi Ubicación';
        
        controlButton.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Tu navegador no soporta geolocalización.');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    // Si ya existe el marcador de ubicación anterior, lo removemos
                    if (userLocationMarker) {
                        userLocationMarker.setMap(null);
                    }

                    // Crear un icono sumamente distinto (Un pin verde grande o estilo distintivo con URL de Google Icons)
                    userLocationMarker = new google.maps.Marker({
                        position: pos,
                        map: modalMap,
                        title: '📍 ¡Aquí estás tú!',
                        icon: {
                            // Usamos un pin verde claro/distinto o un icono de estrella/persona para diferenciarlo de rojo/azul de clientes
                            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        zIndex: 9999 // Asegura que esté siempre por encima de todo
                    });

                    const userWindow = new google.maps.InfoWindow({
                        content: `<div style="font-family: sans-serif; background: #064e3b; color: #ecfdf5; padding: 6px; border-radius: 6px; font-size: 0.7rem; text-align: center;"><strong>📍 ¡Estás aquí!</strong><br>Ubicación actual</div>`
                    });

                    userLocationMarker.addListener('click', () => {
                        userWindow.open(modalMap, userLocationMarker);
                    });

                    // Centrar el mapa en tu ubicación y hacer zoom de acercamiento
                    modalMap.setCenter(pos);
                    modalMap.setZoom(16);
                    userWindow.open(modalMap, userLocationMarker);
                },
                (error) => {
                    alert('Error al obtener la ubicación: ' + error.message);
                },
                { enableHighAccuracy: true }
            );
        });

        controlDiv.appendChild(controlButton);
        modalMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    }

    async function loadAndRenderModalClients() {
        const clients = getClientsCallback();
        if (!clients || clients.length === 0) return;

        try {
            const { data: appointments } = await supabase.from('appointments').select('client_id');
            const clientIdsWithAppointment = new Set((appointments || []).map(a => a.client_id));

            modalMarkers.forEach(m => m.setMap(null));
            modalMarkers = [];

            const activeClient = window.activeClient;

            clients.forEach(client => {
                if (client.latitude && client.longitude) {
                    const clientLatLng = { lat: Number(client.latitude), lng: Number(client.longitude) };

                    const hasAppointment = clientIdsWithAppointment.has(client.id);
                    const markerIcon = hasAppointment 
                        ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                        : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

                    const marker = new google.maps.Marker({
                        position: clientLatLng,
                        map: modalMap,
                        title: `${client.name} (${client.address || 'Sin dirección'})`,
                        icon: { url: markerIcon }
                    });

                    marker.addListener('click', async () => {
                        await showModalClientInfoWindow(client, marker);
                    });

                    modalMarkers.push(marker);

                    if (activeClient && activeClient.id === client.id) {
                        modalMap.setCenter(clientLatLng);
                        modalMap.setZoom(17);
                        showModalClientInfoWindow(client, marker);
                    }
                }
            });

            // Si no hay un cliente activo seleccionado, fijar el centro explícitamente en Ottobrunn
            if (!activeClient) {
                modalMap.setCenter({ lat: 48.0664, lng: 11.6611 });
                modalMap.setZoom(14);
            }
        } catch (err) {
            console.error('Error al renderizar mapa modal:', err);
        }
    }

    async function showModalClientInfoWindow(client, markerInstance) {
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
                    </div>
                `;
            });

            appointmentSection = `
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                    <span style="color: #94a3b8; display: block; margin-bottom: 3px;">Citas programadas (${appointments.length}):</span>
                    <div style="max-height: 90px; overflow-y: auto;">
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
            phoneActionHtml = `<a href="tel:${clientPhone}" title="Llamar" style="text-decoration: none; font-size: 0.8rem; margin-left: 6px;">📞</a>`;
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

                <div style="margin-top: 6px;">
                    <button type="button" id="modal-select-client-btn" style="background: #2563eb; color: white; border: none; padding: 6px; width: 100%; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: pointer;">
                        ✔ Seleccionar este cliente
                    </button>
                </div>

            </div>
        `;

        modalInfoWindow.setContent(contentHtml);
        modalInfoWindow.open(modalMap, markerInstance);

        google.maps.event.addListenerOnce(modalInfoWindow, 'domready', () => {
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

            let styleTag = document.getElementById('custom-infowindow-dark-style-modal');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-infowindow-dark-style-modal';
                styleTag.innerHTML = `
                    .gm-style-iw-t::after { background: #0f172a !important; box-shadow: none !important; }
                    .gm-style-iw-tc::after { background: #0f172a !important; }
                `;
                document.head.appendChild(styleTag);
            }

            const selectBtn = document.getElementById('modal-select-client-btn');
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    onClientSelectedCallback(client);
                    modal.style.display = 'none';
                    modalInfoWindow.close();
                });
            }
        });
    }
}
