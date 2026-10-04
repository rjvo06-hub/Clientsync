import { supabase } from './supabaseClient.js';

let map;

// Usamos un nombre completamente nuevo para evitar la caché del navegador
window.initClientSyncMap = async function() {
    console.log("🗺️ Inicializando Google Maps (ClientSync)...");
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    try {
        map = new google.maps.Map(document.getElementById('map'), {
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
        console.log("✅ Mapa de Google creado correctamente.");
    } catch (e) {
        console.error("❌ Error al crear la instancia del mapa:", e);
        return;
    }

    // Cargar y pintar las zonas guardadas en Supabase
    await loadAndRenderZones(map);
};

async function loadAndRenderZones(mapInstance) {
    try {
        console.log("🔄 Consultando zonas en Supabase...");
        const { data: zones, error } = await supabase
            .from('zones')
            .select('*')
            .not('polygon_coords', 'is', null);

        if (error) {
            console.error('❌ Error al consultar Supabase:', error.message);
            return;
        }

        console.log(`📦 Zonas encontradas en Supabase con polígonos:`, zones);

        if (!zones || zones.length === 0) {
            console.warn('⚠️ No hay zonas con polígonos registrados en la base de datos.');
            return;
        }

        zones.forEach((zone, index) => {
            const coords = zone.polygon_coords;
            console.log(`📍 Analizando Zona [${index + 1}] - Nombre: "${zone.name}"`, coords);

            if (Array.isArray(coords) && coords.length >= 3) {
                // Asegurar formato numérico correcto para lat/lng
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

                // Centrar automáticamente la vista en la primera zona cargada
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
            } else {
                console.warn(`⚠️ La zona "${zone.name}" tiene menos de 3 puntos o un formato inválido.`);
            }
        });

    } catch (err) {
        console.error('❌ Excepción crítica al renderizar las zonas:', err);
    }
}
