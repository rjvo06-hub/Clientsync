// Módulo reutilizable para el modal del mapa interactivo con pines de colores (Azul con cita / Rojo sin cita)
export function initInteractiveMapModal(modalId, mapContainerId, btnOpenId, btnCloseId, allClientsGetter, onClientSelectedCallback) {
    const modal = document.getElementById(modalId);
    const btnOpen = document.getElementById(btnOpenId);
    const btnClose = document.getElementById(btnCloseId);

    if (!modal || !btnOpen || !btnClose) return;

    let interactiveMap = null;
    let mapMarkers = [];
    let activeInfoWindow = null;

    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';

        const clients = allClientsGetter();
        const activeClient = window.activeClient || null;

        let targetLat = 48.0688;
        let targetLng = 11.6145;
        let targetZoom = 12;

        if (activeClient && activeClient.latitude && activeClient.longitude) {
            targetLat = Number(activeClient.latitude);
            targetLng = Number(activeClient.longitude);
            targetZoom = 16;
        } else if (clients.length > 0 && clients[0].latitude && clients[0].longitude) {
            targetLat = Number(clients[0].latitude);
            targetLng = Number(clients[0].longitude);
        }

        if (!interactiveMap) {
            interactiveMap = new google.maps.Map(document.getElementById(mapContainerId), {
                center: { lat: targetLat, lng: targetLng },
                zoom: targetZoom,
            });
            activeInfoWindow = new google.maps.InfoWindow();
        } else {
            google.maps.event.trigger(interactiveMap, 'resize');
            interactiveMap.setCenter({ lat: targetLat, lng: targetLng });
            interactiveMap.setZoom(targetZoom);
        }

        // Limpiar marcadores anteriores
        mapMarkers.forEach(m => m.setMap(null));
        mapMarkers = [];

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                // Verificar si el cliente tiene cita asignada para cambiar el color del pin
                const hasAppointment = Boolean(client.appointment_date && client.appointment_date.trim() !== '');
                const markerIcon = hasAppointment 
                    ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"  // 🔵 Azul si tiene cita
                    : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";   // 🔴 Rojo si no tiene cita

                const marker = new google.maps.Marker({
                    position: { lat: Number(client.latitude), lng: Number(client.longitude) },
                    map: interactiveMap,
                    title: client.name,
                    icon: { url: markerIcon }
                });

                const contentString = `
                    <div style="padding: 4px;">
                        <strong>${client.name}</strong><br>
                        ${client.address || ''}<br>
                        <span style="font-size: 0.8rem; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'}; font-weight: bold;">
                            ${hasAppointment ? '🔵 Con cita asignada' : '🔴 Sin cita'}
                        </span><br>
                        <button type="button" id="map-select-btn-${client.id}" style="margin-top:6px; background:#3182ce; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
                            Seleccionar este cliente
                        </button>
                    </div>
                `;

                marker.addListener('click', () => {
                    if (activeInfoWindow) {
                        activeInfoWindow.close();
                    }
                    activeInfoWindow.setContent(contentString);
                    activeInfoWindow.open(interactiveMap, marker);

                    setTimeout(() => {
                        const selectBtn = document.getElementById(`map-select-btn-${client.id}`);
                        if (selectBtn) {
                            selectBtn.onclick = () => {
                                modal.style.display = 'none';
                                if (onClientSelectedCallback) {
                                    onClientSelectedCallback(client);
                                }
                            };
                        }
                    }, 100);
                });

                if (activeClient && client.id === activeClient.id) {
                    activeInfoWindow.setContent(contentString);
                    activeInfoWindow.open(interactiveMap, marker);
                }

                mapMarkers.push(marker);
            }
        });
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
