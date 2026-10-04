import { supabase } from './supabaseClient.js';

let map;

// Función que verifica y arranca el mapa de forma segura
function initMapWhenReady() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        startMap();
    } else {
        // Si Google Maps aún se está cargando, espera un momento y vuelve a intentar
        setTimeout(initMapWhenReady, 100);
    }
}

async function startMap() {
    console.log("🗺️ Inicializando mapa de Google Maps...");
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("❌ No se encontró el contenedor #map en el DOM.");
        return;
    }

    try {
        map = new google.maps.Map(mapElement, {
            zoom: 13,
            center: defaultCenter,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });
        console.log("✅ Mapa creado con éxito.");

        // Cargar y pintar las zonas desde Supabase
        await loadAndRenderZones(map);

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

async function loadAndRenderZones(mapInstance) {
    try {
        console.log("🔄 Consultando zonas en Supabase...");
        const { data: zones, error } = await supabase
            .from('zones')
            .select('*')
            .not('polygon_coords', 'is', null);

        if (error) {
            console.error('❌ Error en Supabase:', error.message);
            return;
        }

        console.log(`📦 Zonas obtenidas:`, zones);

        if (!zones || zones.length === 0) {
            console.warn('⚠️ No hay zonas con polígonos guardados.');
            return;
        }

        zones.forEach((zone, index) => {
            const coords = zone.polygon_coords;

            if (Array.isArray(coords) && coords.length >= 3) {
                const formattedCoords = coords.map(pt => ({
                    lat: Number(pt.lat),
                    lng: Number(pt.lng)
                }));

                console.log(`✨ Dibujando polígono para "${zone.name}" con ${formattedCoords.length} puntos.`);

                const zonePolygon = new google.maps.Polygon({
                    paths: formattedCoords,
                    strokeColor: '#2b6cb0',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#3182ce',
                    fillOpacity: 0.35,
                    map: mapInstance
                });

                // Centrar la vista en la primera zona cargada
                if (index === 0 && formattedCoords.length > 0) {
                    mapInstance.setCenter(formattedCoords[0]);
                    mapInstance.setZoom(14);
                }

                const infoWindow = new google.maps.InfoWindow();

                zonePolygon.addListener('click', (event) => {
                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: #2b6cb0; font-size: 1.1rem;">${zone.name}</h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #4a5568;"><strong>Código Postal:</strong> ${zone.postal_code || 'N/A'}</p>
                            <p style="margin: 3px 0 0 0; font-size: 0.9rem; color: #4a5568;"><strong>Vértices:</strong> ${formattedCoords.length} puntos</p>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.setPosition(event.latLng);
                    infoWindow.open(mapInstance);
                });
            }
        });

    } catch (err) {
        console.error('❌ Excepción al renderizar zonas:', err);
    }
}

// Iniciar proceso de escucha cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
