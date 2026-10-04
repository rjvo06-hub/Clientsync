import { supabase } from './supabaseClient.js';

let map;

// Función que inicializa el mapa de Google Maps
export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Coordenadas centrales (por ejemplo, zona de Múnich / Ottobrunn)
    const centerLocation = { lat: 48.0686, lng: 11.6289 };

    map = new google.maps.Map(mapContainer, {
        center: centerLocation,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Cargar las zonas y marcadores desde Supabase
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
            // Ejemplo básico: si tus zonas tienen latitud y longitud, puedes crear marcadores aquí
            console.log('Zona cargada:', zone.name);
        });
    }
}

// Exponer la función globalmente para que la API de Google Maps la invoque al cargar
window.initMap = initMap;
