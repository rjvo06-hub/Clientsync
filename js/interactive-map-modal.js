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
    let userLocationMarker = null;
    let clickedLocationMarker = null; // Marcador para puntos seleccionados en el mapa

    // INYECCIÓN AUTOMÁTICA DEL BOTÓN DE UBICACIÓN EN LA CABECERA
    const modalContent = mapElement.closest('.map-modal-content');
    if (modalContent && !document.getElementById('geo-btn-dynamic')) {
        const headerBar = modalContent.querySelector('div'); 
        if (headerBar) {
            headerBar.style.display = 'flex';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.alignItems = 'center';

            const geoBtn = document.createElement('button');
            geoBtn.id = 'geo-btn-dynamic';
            geoBtn.type = 'button';
            geoBtn.innerHTML = '📍 Mi Ubicación';
            geoBtn.style.background = '#3182ce';
            geoBtn.style.color = 'white';
            geoBtn.style.border = 'none';
            geoBtn.style.borderRadius = '6px';
            geoBtn.style.padding = '6px 10px';
            geoBtn.style.fontSize = '0.75rem';
            geoBtn.style.fontWeight = 'bold';
            geoBtn.style.cursor = 'pointer';
            geoBtn.style.marginLeft = 'auto';
            geoBtn.style.marginRight = '8px';

            geoBtn.addEventListener('click', () => {
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

                        if (userLocationMarker) {
                            userLocationMarker.setMap(null);
                        }

                        // Icono estilo pin moderno / palito y bolita
                        const pinSvg = {
                            path: "M 0,0 C -2,-20 -10,-22 -10,-30 a 10,10 0 1,1 20,0 c 0,8 -8,10 -10,30 z",
                            fillColor: "#4f46e5",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                            scale: 1.2,
                            anchor: new google.maps.Point(0, 0)
                        };

                        userLocationMarker = new google.maps.Marker({
                            position: pos,
                            map: modalMap,
                            title: '📍 ¡Aquí estás tú!',
                            icon: pinSvg,
                            zIndex: 9999
                        });

                        userLocationMarker.addListener('click', () => {
                            showUserLocationInfoWindow(pos, userLocationMarker);
                        });

                        if (modalMap) {
                            modalMap.setCenter(pos);
                            modalMap.setZoom(16);
                            showUserLocationInfoWindow(pos, userLocationMarker);
                        }
                    },
                    (error) => {
                        alert('Error al obtener la ubicación: ' + error.message);
                    },
                    { enableHighAccuracy: true }
                );
            });

            const closeButton = headerBar.querySelector('button');
            if (closeButton) {
                headerBar.insertBefore(geoBtn, closeButton);
            } else {
                headerBar.appendChild(geoBtn);
            }
        }
    }

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

        // Instanciar Geocoder para buscar direcciones al hacer clic en el mapa
        const geocoder = new google.maps.Geocoder();

        // Escuchar clics en cualquier punto vacío del mapa con geocodificación inversa tolerante
        modalMap.addListener('click', (event) => {
            const clickedLatLng = event.latLng;
            const lat = clickedLatLng.lat();
            const lng = clickedLatLng.lng();

            if (modalInfoWindow) modalInfoWindow.close();
            if (clickedLocationMarker) clickedLocationMarker.setMap(null);

            const pinSvgSelected = {
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 a 10,10 0 1,1 20,0 c 0,8 -8,10 -10,30 z",
                fillColor: "#38bdf8", // Celeste distintivo para nuevo punto
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 1.1,
                anchor: new google.maps.Point(0, 0)
            };

            clickedLocationMarker = new google.maps.Marker({
                position: clickedLatLng,
                map: modalMap,
                title: 'Punto seleccionado',
                icon: pinSvgSelected,
                zIndex: 9998
            });

            geocoder.geocode({ location: clickedLatLng }, (results, status) => {
                let addressText = '';
                let postalCodeText = '';

                if (status === 'OK' && results && results.length > 0) {
                    const bestResult = results.find(r => 
                        r.types.includes('street_address') || 
                        r.types.includes('premise') || 
                        r.types.includes('subpremise') ||
                        r.types.includes('postal_code')
                    ) || results[0];

                    addressText = bestResult.formatted_address;

                    for (const component of bestResult.address_components) {
                        if (component.types.includes('postal_code')) {
                            postalCodeText = component.long_name;
                            break;
                        }
                    }
                }

                if (!addressText) {
                    addressText = `Ubicación en mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                }

                const clientDraft = {
                    address: addressText,
                    postal_code: postalCodeText || '',
                    latitude: lat,
                    longitude: lng
                };

                showSelectedPointInfoWindow(clickedLatLng, clickedLocationMarker, clientDraft);
            });
        });

        await loadAndRenderModalClients();
    }

    function showUserLocationInfoWindow(pos, markerInstance) {
        const contentHtml = `
            <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 0px; width: 190px; max-width: 100%; background: #0f172a; color: #f8fafc; border-radius: 6px; text-align: left; box-sizing: border-box;">
                
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 3px; margin-bottom: 4px; text-align: center;">
                    <h3 style="margin: 0; font-size: 0.78rem; color: #38bdf8; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        📍 Mi Ubicación Actual
                    </h3>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <p style="margin: 0; font-size: 0.65rem; color: #cbd5e1; line-height: 1.2; text-align: left; flex: 1; word-break: break-word;">
                        <strong>📌 Coordenadas:</strong> ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}
                    </p>
                </div>

                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #1e293b; font-size: 0.65rem;">
                    <span style="color: #94a3b8; display: block; margin-bottom: 2px;">Estado: <strong style="color: #4ade80;">Punto de partida</strong></span>
                </div>

            </div>
        `;

        modalInfoWindow.setContent(contentHtml);
        modalInfoWindow.open(modalMap, markerInstance);
        setupInfoWindowStyles();
    }

    function showSelectedPointInfoWindow(pos, markerInstance, clientDraft) {
        const contentHtml = `
            <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 0px; width: 190px; max-width: 100%; background: #0f172a; color: #f8fafc; border-radius: 6px; text-align: left; box-sizing: border-box;">
                
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 3px; margin-bottom: 4px; text-align: center;">
                    <h3 style="margin: 0; font-size: 0.78rem; color: #38bdf8; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        📍 Nuevo Punto
                    </h3>
                </div>

                <div style="margin-bottom: 4px;">
                    <p style="margin: 0 0 3px 0; font-size: 0.65rem; color: #cbd5e1; line-height: 1.2; word-break: break-word;">
                        <strong>Dirección:</strong> ${clientDraft.address}
                    </p>
                    <p style="margin: 0; font-size: 0.65rem; color: #cbd5e1; line-height: 1.2;">
                        <strong>CP:</strong> ${clientDraft.postal_code || 'No detectado'}
                    </p>
                </div>

                <div style="margin-top: 6px; border-top: 1px dashed #1e293b; padding-top: 4px;">
                    <button type="button" id="modal-create-client-btn" style="background: #10b981; color: white; border: none; padding: 6px; width: 100%; border-radius: 4px; font-size: 0.65rem; font-weight: bold; cursor: pointer;">
                        ➕ Crear cliente aquí
                    </button>
                </div>

            </div>
        `;

        modalInfoWindow.setContent(contentHtml);
        modalInfoWindow.open(modalMap, markerInstance);

        setupInfoWindowStyles();

        google.maps.event.addListenerOnce(modalInfoWindow, 'domready', () => {
            const createBtn = document.getElementById('modal-create-client-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    if (typeof window.openClientFormWithData === 'function') {
                        window.openClientFormWithData(clientDraft);
                    } else {
                        console.log("Datos para nuevo cliente:", clientDraft);
                        alert(`Datos listos para crear cliente:\nDirección: ${clientDraft.address}\nCP: ${clientDraft.postal_code}\nLat/Lng: ${clientDraft.latitude}, ${clientDraft.longitude}`);
                    }

                    modal.style.display = 'none';
                    modalInfoWindow.close();
                });
            }
        });
    }

    function setupInfoWindowStyles() {
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
        });
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

        setupInfoWindowStyles();

        google.maps.event.addListenerOnce(modalInfoWindow, 'domready', () => {
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
