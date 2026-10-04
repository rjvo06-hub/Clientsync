import { supabase } from './supabaseClient.js';

let map;
let polygons = [];

// Función principal que inicializa el mapa de Google Maps
export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Coordenadas centrales por defecto (Ottobrunn / Unterhaching)
    const defaultCenter = { lat: 48.0686, lng: 11.6289 };

    map = new google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Cargar las zonas y sus formas personalizadas
    await loadCustomZonePolygons();
}

async function loadCustomZonePolygons() {
    // Nota: En un caso real, podrías tener una columna JSON en Supabase con los vértices,
    // o consultar tus zonas y asignarles los puntos predefinidos según su ID o nombre.
    const { data, error } = await supabase.from('zones').select('*');
    
    if (error) {
        console.error('Error al cargar zonas:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const bounds = new google.maps.LatLngBounds();

        data.forEach(zone => {
            let zoneCoords = [];
            let fillColor = '#3182ce'; // Color por defecto

            // Definimos formas geométricas personalizadas (ej. polígonos irregulares o triángulos)
            // según el nombre o código postal de la zona que viene de Supabase:
            if (zone.postal_code === '82008') {
                // Ejemplo: Forma para Unterhaching (un polígono de 4 esquinas/vértices)
                zoneCoords = [
                    { lat: 48.0750, lng: 11.6050 }, // Esquina Noroeste
                    { lat: 48.0750, lng: 11.6200 }, // Esquina Noreste
                    { lat: 48.0550, lng: 11.6200 }, // Esquina Sureste
                    { lat: 48.0550, lng: 11.6050 }  // Esquina Suroeste
                ];
                fillColor = '#3182ce'; // Azul
            } else if (zone.postal_code === '85521') {
                // Ejemplo: Forma para Ottobrunn (un triángulo o polígono diferente)
                zoneCoords = [
                    { lat: 48.0800, lng: 11.6220 }, // Vértice Norte
                    { lat: 48.0800, lng: 11.6400 }, // Vértice Este
                    { lat: 48.0600, lng: 11.6300 }, // Vértice Sur
                    { lat: 48.0600, lng: 11.6200 }  // Vértice Oeste
                ];
                fillColor = '#38a169'; // Verde
            } else {
                // Forma genérica por defecto para otras zonas
                zoneCoords = [
                    { lat: 48.0900, lng: 11.6400 },
                    { lat: 48.0900, lng: 11.6600 },
                    { lat: 48.0700, lng: 11.6500 }
                ];
                fillColor = '#d69e2e'; // Amarillo/Naranja
            }

            // Crear el polígono personalizado en el mapa
            const customPolygon = new google.maps.Polygon({
                paths: zoneCoords,
                strokeColor: fillColor,
                strokeOpacity: 0.9,
                strokeWeight: 2,
                fillColor: fillColor,
                fillOpacity: 0.35,
                map: map
            });

            // Ventana de información al hacer clic en el polígono
            const infoWindow = new google.maps.InfoWindow();
            
            customPolygon.addListener('click', (event) => {
                infoWindow.setContent(`
                    <div style="padding: 5px;">
                        <strong>${zone.name}</strong><br>
                        <span>CP: ${zone.postal_code || 'N/A'}</span><br>
                        <span>Capacidad: ${zone.max_weekly_capacity || 'N/A'}</span>
                    </div>
                `);
                // Posicionar la ventana donde se hizo clic
                infoWindow.setPosition(event.latLng);
                infoWindow.open(map);
            });

            polygons.push(customPolygon);

            // Extender los límites del mapa para que abarque todos los puntos
            zoneCoords.forEach(coord => bounds.extend(coord));
        });

        // Ajustar el zoom automáticamente
        map.fitBounds(bounds);
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
