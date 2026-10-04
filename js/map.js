import { supabase } from './supabaseClient.js';

async function loadAndRenderZones(map) {
    // 1. Consultar todas las zonas guardadas en Supabase que tengan coordenadas de polígono
    const { data: zones, error } = await supabase
        .from('zones')
        .select('*')
        .not('polygon_coords', 'is', null);

    if (error) {
        console.error('Error al cargar las zonas:', error.message);
        return;
    }

    // 2. Recorrer cada zona y dibujarla en el mapa
    zones.forEach(zone => {
        const coords = zone.polygon_coords; // Arreglo de {lat, lng} guardado desde el builder

        if (Array.isArray(coords) && coords.length >= 3) {
            const polygon = new google.maps.Polygon({
                paths: coords,
                strokeColor: '#3182ce',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#3182ce',
                fillOpacity: 0.35,
                map: map
            });

            // Opcional: Agregar una ventanita informativa (InfoWIndow) al hacer clic en el polígono
            const infoWindow = new google.maps.InfoWindow({
                content: `<strong>Zona:</strong> ${zone.name} <br><strong>CP:</strong> ${zone.postal_code || 'N/A'}`
            });

            polygon.addListener('click', (event) => {
                infoWindow.setPosition(event.latLng);
                infoWindow.open(map);
            });
        }
    });
}

// Asegúrate de llamar a esta función una vez que tu mapa de Google Maps esté inicializado:
// loadAndRenderZones(mapInstance);
