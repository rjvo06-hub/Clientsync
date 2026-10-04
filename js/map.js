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
        styles: [
            // Puedes personalizar los estilos del mapa aquí si lo deseas
        ]
    });

    // Cargar datos adicionales (como zonas o citas) desde Supabase
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
            // Aquí puedes pintar los marcadores o polígonos de las zonas
            console.log('Zona cargada:', zone.name);
        });
    }
}

// Exponer la función globalmente para que la API de Google Maps la llame
window.initMap = initMap;
