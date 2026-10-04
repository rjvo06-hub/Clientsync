import { supabase } from './supabaseClient.js';

let map;
let markers = [];

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

    // Cargar las zonas directamente desde Supabase
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
                
                // Crear un marcador personalizado para la zona
                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: `${zone.name} - CP: ${zone.postal_code || 'N/A'}`
                });

                // Ventana de información (InfoBox) al hacer clic en el marcador
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="padding: 5px;">
                        <strong>${zone.name}</strong><br>
                        <span>Código Postal: ${zone.postal_code || 'N/A'}</span><br>
                        <span>Capacidad semanal: ${zone.max_weekly_capacity || 'N/A'}</span>
                    </div>`
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                // Círculo de cobertura más discreto y elegante centrado exactamente en el código postal
                const circle = new google.maps.Circle({
                    strokeColor: '#2b6cb0',
                    strokeOpacity: 0.8,
                    strokeWeight: 1.5,
                    fillColor: '#3182ce',
                    fillOpacity: 0.15,
                    map: map,
                    center: position,
                    radius: 1800 // Radio ajustado para evitar solapamientos excesivos
                });

                markers.push(marker);
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
