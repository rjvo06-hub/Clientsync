import { supabase } from './supabaseClient.js';

let map;

// Función global que inicializa el mapa (llamada por el script de la API en el HTML)
window.initMap = async function() {
    // Coordenadas iniciales centradas en Ottobrunn / Múnich
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    // 1. Crear la instancia del mapa
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultCenter,
        styles: [
            // Estilo limpio opcional para mejor visualización de zonas
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // 2. Cargar y renderizar las zonas geográficas desde Supabase
    await loadAndRenderZones(map);
};

/**
 * Consulta la tabla zones en Supabase y dibuja los polígonos (polygon_coords) en el mapa
 */
async function loadAndRenderZones(mapInstance) {
    try {
        const { data: zones, error } = await supabase
            .from('zones')
            .select('*')
            .not('polygon_coords', 'is', null);

        if (error) {
            console.error('Error al cargar las zonas desde Supabase:', error.message);
            return;
        }

        if (!zones || zones.length === 0) {
            console.log('No hay zonas con polígonos registrados todavía.');
            return;
        }

        zones.forEach(zone => {
            const coords = zone.polygon_coords; // Arreglo de objetos [{lat, lng}, ...]

            // Validar que sea un arreglo con al menos 3 puntos para formar un polígono
            if (Array.isArray(coords) && coords.length >= 3) {
                // Crear el polígono en Google Maps
                const zonePolygon = new google.maps.Polygon({
                    paths: coords,
                    strokeColor: '#2b6cb0',   // Color del borde
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#3182ce',     // Color de relleno
                    fillOpacity: 0.35,        // Transparencia del relleno
                    map: mapInstance
                });

                // Ventana de información (InfoWIndow) al hacer clic en el polígono
                const infoWindow = new google.maps.InfoWindow();

                zonePolygon.addListener('click', (event) => {
                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: #2b6cb0; font-size: 1.1rem;">${zone.name}</h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #4a5568;"><strong>Código Postal:</strong> ${zone.postal_code || 'N/A'}</p>
                            <p style="margin: 3px 0 0 0; font-size: 0.9rem; color: #4a5568;"><strong>Vértices:</strong> ${coords.length} puntos</p>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.setPosition(event.latLng);
                    infoWindow.open(mapInstance);
                });
            }
        });

        console.log(`¡Se cargaron y dibujaron ${zones.length} zonas correctamente en el mapa!`);

    } catch (err) {
        console.error('Excepción al renderizar las zonas:', err);
    }
}
