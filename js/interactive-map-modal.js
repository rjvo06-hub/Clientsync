// interactive-map-modal.js

export function initInteractiveMapModal(modalId, mapElementId, openBtnId, closeBtnId, getClientsCallback, onClientSelectedCallback) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const mapDiv = document.getElementById(mapElementId);

    let map = null;
    let markers = [];
    let infoWindow = null;
    let selectedPointData = null;

    if (!modal || !openBtn || !closeBtn || !mapDiv) {
        console.error('Elementos del modal de mapa no encontrados en el DOM.');
        return;
    }

    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        initMap();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    function initMap() {
        if (map) {
            google.maps.event.trigger(map, 'resize');
            updateMarkers();
            return;
        }

        const defaultCenter = { lat: 48.1351, lng: 11.5820 };

        map = new google.maps.Map(mapDiv, {
            center: defaultCenter,
            zoom: 17,
            mapTypeId: 'roadmap',
            streetViewControl: false,
            fullscreenControl: false
        });

        infoWindow = new google.maps.InfoWindow();

        // Clic en cualquier punto del mapa para capturar datos y crear cliente en campo
        map.addListener('click', (event) => {
            const clickedLat = event.latLng.lat();
            const clickedLng = event.latLng.lng();

            selectedPointData = {
                latitude: clickedLat,
                longitude: clickedLng,
                address: '',
                postal_code: ''
            };

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addressComponents = results[0].address_components;
                    let route = '';
                    let streetNumber = '';
                    let postalCode = '';

                    addressComponents.forEach(component => {
                        if (component.types.includes('route')) route = component.long_name;
                        if (component.types.includes('street_number')) streetNumber = component.long_name;
                        if (component.types.includes('postal_code')) postalCode = component.long_name;
                    });

                    selectedPointData.address = `${route} ${streetNumber}`.trim() || results[0].formatted_address;
                    selectedPointData.postal_code = postalCode;
                }

                showCreationInfoWindow(event.latLng);
            });
        });

        // Conectar el botón de "Mi Ubicación" existente en tu HTML si lo tienes con ID o clase
        const myLocationBtn = document.getElementById('btn-my-location') || document.querySelector('[id*="location"]');
        if (myLocationBtn) {
            myLocationBtn.addEventListener('click', () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const pos = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            };
                            map.setCenter(pos);
                            map.setZoom(19);

                            google.maps.event.trigger(map, 'click', {
                                latLng: new google.maps.LatLng(pos.lat, pos.lng)
                            });
                        },
                        () => {
                            alert('Error al obtener tu ubicación actual.');
                        }
                    );
                } else {
                    alert('Tu navegador no soporta geolocalización.');
                }
            });
        }

        updateMarkers();
    }

    function showCreationInfoWindow(latLng) {
        const contentString = `
            <div style="padding: 6px; max-width: 200px; font-family: sans-serif;">
                <strong style="font-size: 0.85rem; color: #2b6cb0;">Ubicación Seleccionada</strong>
                <p style="font-size: 0.75rem; color: #4a5568; margin: 4px 0;">${selectedPointData.address || 'Sin dirección exacta'}</p>
                <button id="btn-create-client-popup" style="width: 100%; background: #38a169; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer; margin-top: 4px;">
                    ➕ Crear cliente aquí
                </button>
            </div>
        `;

        infoWindow.setPosition(latLng);
        infoWindow.setContent(contentString);
        infoWindow.open(map);

        setTimeout(() => {
            const createBtn = document.getElementById('btn-create-client-popup');
            if (createBtn) {
                createBtn.onclick = () => {
                    sessionStorage.setItem('pending_client_data', JSON.stringify(selectedPointData));
                    modal.style.display = 'none';
                    window.location.href = `./client-builder.html?lat=${selectedPointData.latitude}&lng=${selectedPointData.longitude}&address=${encodeURIComponent(selectedPointData.address)}&postal=${encodeURIComponent(selectedPointData.postal_code)}`;
                };
            }
        }, 100);
    }

    function updateMarkers() {
        if (!map) return;

        markers.forEach(m => m.setMap(null));
        markers = [];

        const clients = getClientsCallback ? getClientsCallback() : [];
        let bounds = new google.maps.LatLngBounds();
        let hasValidCoords = false;

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                const lat = Number(client.latitude);
                const lng = Number(client.longitude);
                const pos = { lat, lng };

                const marker = new google.maps.marker ? 
                    new google.maps.marker.AdvancedMarkerElement({
                        map: map,
                        position: pos,
                        title: client.name
                    }) :
                    new google.maps.Marker({
                        map: map,
                        position: pos,
                        title: client.name
                    });

                google.maps.event.addListener(marker, 'click', () => {
                    modal.style.display = 'none';
                    if (onClientSelectedCallback) {
                        onClientSelectedCallback(client);
                    }
                });

                markers.push(marker);
                bounds.extend(pos);
                hasValidCoords = true;
            }
        });

        if (hasValidCoords && clients.length > 0) {
            map.fitBounds(bounds);
        }
    }
}
