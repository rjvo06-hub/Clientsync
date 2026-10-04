import { supabase } from './supabaseClient.js';

let map;
let markers = [];

// Función principal que inicializa el mapa de Google Maps
export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Coordenadas centrales por defecto (Ottobrunn / Múnich)
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    map = new google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Cargar y resaltar las zonas desde Supabase
    await loadMapZones();
}

async function loadMapZones() {
    const { data, error } = await supabase.from('zones').select('*');
    
    if (error) {
        console.error('Error al cargar zonas en el mapa:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        let hasValidCoords = false;

        data.forEach(zone => {
            // Buscamos campos comunes de coordenadas (lat/lng o latitude/longitude)
            const lat = zone.lat || zone.latitude;
            const lng = zone.lng || zone.longitude;

            if (lat && lng) {
                const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
                
                // Crear un marcador para la zona
                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: zone.name || 'Zona de trabajo'
                });

                // Crear un círculo translúcido para resaltar el radio de la zona en el mapa
                const circle = new google.maps.Circle({
                    strokeColor: '#0055ff',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#0055ff',
                    fillOpacity: 0.2,
                    map: map,
                    center: position,
                    radius: 3000 // Radio de 3 km (ajustable según tus necesidades)
                });

                markers.push(marker);
                bounds.extend(position);
                hasValidCoords = true;
            }
        });

        // Ajustar el zoom y centrar automáticamente el mapa en base a las zonas cargadas
        if (hasValidCoords) {
            map.fitBounds(bounds);
        }
    } else {
        console.log('No se encontraron zonas en la tabla "zones" de Supabase.');
    }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.google && window.google.maps) {
        initMap();
    } else {
        window.initMap = initMap;
    }
});
