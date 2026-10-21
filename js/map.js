import { supabase } from './supabaseClient.js';

let map;
let markers = [];
let infoWindows = [];

async function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
        // Coordenadas por defecto (Ottobrunn / centro de clientes)
        const defaultCenter = { lat: 48.0679, lng: 11.6585 };

        // 1. Inicializar el mapa de Google Maps y exponerlo globalmente como window.activeMap
        map = new google.maps.Map(mapElement, {
            center: defaultCenter,
            zoom: 14,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true
        });

        window.activeMap = map; // <-- ¡Clave para que la geolocalización lo reconozca de inmediato!

        // 2. Cargar clientes desde Supabase para renderizar los pines
        const { data: clients, error } = await supabase.from('clients').select('*');
        if (error) throw error;

        if (clients && clients.length > 0) {
            renderMarkers(clients);
        }

        // 3. Escuchar el evento personalizado cuando buscas un cliente y quieres centrarlo en el mapa
        window.addEventListener('centerOnClient', (e) => {
            const client = e.detail;
            if (client && client.latitude && client.longitude) {
                const pos = { lat: Number(client.latitude), lng: Number(client.longitude) };
                map.setCenter(pos);
                map.setZoom(16);

                // Buscar el marcador correspondiente y abrir su información si existe
                const foundMarker = markers.find(m => m.clientId === client.id);
                if (foundMarker && foundMarker.infoWindow) {
                    closeAllInfoWindows();
                    foundMarker.infoWindow.open(map, foundMarker);
                }
            }
        });

    } catch (err) {
        console.error('Error al inicializar el mapa de clientes:', err);
    }
}

function renderMarkers(clients) {
    clearMarkers();

    clients.forEach(client => {
        if (!client.latitude || !client.longitude) return;

        const pos = { lat: Number(client.latitude), lng: Number(client.longitude) };

        // Diferenciar color de pin si tiene citas o empleado asignado (puedes ajustarlo a tu gusto)
        const pinColor = client.assigned_employee && client.assigned_employee !== 'General' ? 'green' : 'red';
        const iconUrl = `http://maps.google.com/mapfiles/ms/icons/${pinColor}-dot.png`;

        const marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: client.name,
            icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(35, 35)
            },
            animation: google.maps.Animation.DROP
        });

        marker.clientId = client.id;

        const contentString = `
            <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
                <strong style="font-size: 0.95rem; color: #2563eb;">${client.name}</strong><br>
                <span style="font-size: 0.8rem; color: #475569;">📍 ${client.address || 'Sin dirección'}</span><br>
                <span style="font-size: 0.8rem; color: #059669; font-weight: bold;">👤 Técnico: ${client.assigned_employee || 'Sin asignar'}</span><br>
                <a href="./appointment-builder.html?client_id=${client.id}&action=reschedule" style="display: inline-block; margin-top: 6px; font-size: 0.75rem; background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-weight: bold;">Gestionar Cita</a>
            </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: contentString
        });

        marker.infoWindow = infoWindow;
        infoWindows.push(infoWindow);

        marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

function closeAllInfoWindows() {
    infoWindows.forEach(iw => iw.close());
}

function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    infoWindows = [];
}

// Inicializar el mapa al cargar la página
window.addEventListener('DOMContentLoaded', initMap);
