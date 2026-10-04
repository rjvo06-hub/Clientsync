import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let circles = [];

// Función principal que inicializa el mapa de Google Maps
export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Coordenadas centrales por defecto (Ottobrunn)
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    map = new google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Cargar las zonas directamente desde Supabase usando lat y lng
    await loadZonesFromSupabase();
}

async function loadZonesFromSupabase() {
    const { data, error } = await supabase.from('zones').select('*');
    
    if (error) {
        console.error('Error al cargar zonas en el mapa:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        let hasValidCoords = false;

        data.forEach(zone => {
            const lat = zone.lat;
            const lng = zone.lng;

            if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
                const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
                
                // Crear un marcador para la zona
                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: `${zone.name} (${zone.postal_code || ''})`
                });

                // Crear un círculo translúcido para resaltar el área de cobertura
                const circle = new google.maps.Circle({
                    strokeColor: '#0055ff',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#0055ff',
                    fillOpacity: 0.25,
                    map: map,
                    center: position,
                    radius: 2500 // Radio de 2.5 km por zona
                });

                markers.push(marker);
                circles.push(circle);
                bounds.extend(position);
                hasValidCoords = true;
            }
        });

        // Ajustar el zoom automáticamente para abarcar todas las zonas
        if (hasValidCoords) {
            map.fitBounds(bounds);
        }
    } else {
        console.log('No hay zonas registradas en la base de datos.');
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
