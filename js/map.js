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

        // Cargar todos los clientes inicialmente o pintar según se requiera
        await loadAndRenderClients(map);

        // Escuchar el evento cuando el usuario selecciona un sector en el modal de index.html
        document.addEventListener('sectorSelected', async (e) => {
            const targetPostal = e.detail.postalCode;
            console.log("🎯 Sector recibido para zoom:", targetPostal);
            await filterAndZoomByPostal(targetPostal);
        });

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

async function loadAndRenderClients(mapInstance, postalFilter = null) {
    try {
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error || !clients) return;

        // Limpiar marcadores previos si los hay
        markers.forEach(m => m.setMap(null));
        markers = [];

        const bounds = new google.maps.LatLngBounds();
        let matchedAny = false;

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                // Si hay un filtro de código postal, evaluamos si coincide
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

                    markers.push(marker);
                }
            }
        });

        // Ajustar el zoom del mapa exactamente al área de los clientes filtrados
        if (matchedAny && !bounds.isEmpty()) {
            mapInstance.fitBounds(bounds);
            const listener = google.maps.event.addListener(mapInstance, "idle", () => {
                if (mapInstance.getZoom() > 15) mapInstance.setZoom(15);
                google.maps.event.removeListener(listener);
            });
        }
    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}

async function filterAndZoomByPostal(postalCode) {
    if (!map) return;
    await loadAndRenderClients(map, postalCode);
}

document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
