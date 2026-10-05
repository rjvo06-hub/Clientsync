import { supabase } from './supabaseClient.js';

let map;

function initMapWhenReady() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        startMap();
    } else {
        setTimeout(initMapWhenReady, 100);
    }
}

async function startMap() {
    console.log("🗺️ Inicializando mapa de Google Maps...");
    const defaultCenter = { lat: 48.0686, lng: 11.6289 }; // Centro por defecto (Múnich / Ottobrunn)

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("❌ No se encontró el contenedor #map en el DOM.");
        return;
    }

    try {
        // Inicializamos el mapa con un zoom abierto inicial de referencia
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
        console.log("✅ Mapa creado con éxito.");

        // Creamos un objeto global de límites (bounds) para abarcar zonas y clientes de forma automática
        const bounds = new google.maps.LatLngBounds();

        // 1. Cargar y renderizar Zonas
        await loadAndRenderZones(map, bounds);

        // 2. Cargar y renderizar Clientes
        await loadAndRenderClients(map, bounds);

        // 🌟 Ajuste automático del mapa para que encuadre perfectamente todo el contenido sin estar muy cerrado
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            
            // Limitador opcional para evitar que el zoom sea exageradamente cercano si hay pocos puntos
            const listener = google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 13) {
                    map.setZoom(13);
                }
                google.maps.event.removeListener(listener);
            });
        }

    } catch (e) {
        console.error("❌ Error crítico al instanciar el mapa:", e);
    }
}

// Renderizar Zonas Poligonales
async function loadAndRenderZones(mapInstance, bounds) {
    try {
        const { data: zones, error } = await supabase
            .from('zones')
            .select('*')
            .not('polygon_coords', 'is', null);

        if (error) {
            console.error('❌ Error al cargar zonas:', error.message);
            return;
        }

        if (!zones || zones.length === 0) return;

        zones.forEach((zone) => {
            const coords = zone.polygon_coords;

            if (Array.isArray(coords) && coords.length >= 3) {
                const formattedCoords = coords.map(pt => {
                    const latLng = { lat: Number(pt.lat), lng: Number(pt.lng) };
                    bounds.extend(latLng); // Añadir cada vértice al cálculo de límites del mapa
                    return latLng;
                });

                const zoneColor = zone.color || '#3182ce';

                const zonePolygon = new google.maps.Polygon({
                    paths: formattedCoords,
                    strokeColor: zoneColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: zoneColor,
                    fillOpacity: 0.35,
                    map: mapInstance
                });

                const infoWindow = new google.maps.InfoWindow();
                zonePolygon.addListener('click', (event) => {
                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: ${zoneColor}; font-size: 1.1rem;">${zone.name}</h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #4a5568;"><strong>CP:</strong> ${zone.postal_code || 'N/A'}</p>
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

// Renderizar Marcadores de Clientes
async function loadAndRenderClients(mapInstance, bounds) {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*');

        if (error) {
            console.error('❌ Error al cargar clientes:', error.message);
            return;
        }

        if (!clients || clients.length === 0) {
            console.warn('⚠️ No hay clientes registrados.');
            return;
        }

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                const clientLatLng = { lat: Number(client.latitude), lng: Number(client.longitude) };
                
                bounds.extend(clientLatLng); // Añadir la ubicación del cliente al cálculo global de límites

                const marker = new google.maps.Marker({
                    position: clientLatLng,
                    map: mapInstance,
                    title: client.name,
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }
                });

                const infoWindow = new google.maps.InfoWindow();
                marker.addListener('click', () => {
                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: #e53e3e; font-size: 1.1rem;">🏢 ${client.name}</h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #4a5568;"><strong>Dirección:</strong> ${client.address || 'N/A'}, ${client.postal_code || ''}</p>
                            <p style="margin: 3px 0 0 0; font-size: 0.9rem; color: #4a5568;"><strong>Teléfono:</strong> ${client.phone || 'N/A'}</p>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.open(mapInstance, marker);
                });
            }
        });

    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMapWhenReady();
});
