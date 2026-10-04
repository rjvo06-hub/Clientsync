import { supabase } from './supabaseClient.js';

let map;

// Función que inicializa el mapa de Google Maps
export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Coordenadas centrales (Múnich / Ottobrunn)
    const centerLocation = { lat: 48.0686, lng: 11.6289 };

    map = new google.maps.Map(mapContainer, {
        center: centerLocation,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false
    });

    await loadMapMarkers();
}

async function loadMapMarkers() {
    const { data, error } = await supabase.from('zones').select('*');
    
    if (error) {
        console.error('Error al cargar zonas en el mapa:', error.message);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(zone => {
            console.log('Zona cargada:', zone.name);
        });
    }
}

// Inicializar automáticamente cuando el DOM y el script estén listos
document.addEventListener('DOMContentLoaded', () => {
    // Asegurarnos de que la API de Google Maps ya cargó
    if (window.google && window.google.maps) {
        initMap();
    } else {
        window.initMap = initMap; // Por si acaso la API lo llama después
    }
});
