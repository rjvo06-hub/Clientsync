import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';

// 1. Configura tus credenciales (puedes sacarlas de tu js/config.js o js/supabaseClient.js)
const SUPABASE_URL = 'TU_SUPABASE_URL'; // Reemplaza con tu URL de Supabase
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY'; // Reemplaza con tu Key (service_role o anon)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para obtener latitud y longitud usando la dirección y el código postal
async function getCoordinates(address, postalCode) {
    const query = `${address}, ${postalCode} Germany`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'ArbeitsTimeApp/1.0' } });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error(`Error geocodificando ${query}:`, error.message);
    }
    return { latitude: null, longitude: null };
}

async function importarClientesMasivo() {
    const fileStream = fs.createReadStream('clientes_tres_columnas_v2.csv');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let contador = 1;
    for await (const line of rl) {
        if (!line.trim()) continue;
        const [name, address, postal] = line.split(',');

        console.log(`[${contador}/73] Procesando: ${name.trim()} - ${address.trim()}, ${postal.trim()}`);
        
        // Obtener coordenadas automáticamente
        const coords = await getCoordinates(address, postal);

        // Insertar en Supabase (asegúrate de que los nombres de columnas coincidan con tu tabla)
        const { error } = await supabase
            .from('clients') // Cambia 'clients' si tu tabla se llama distinto en Supabase
            .insert([{
                name: name.trim(),
                address: address.trim(),
                postal_code: postal.trim(),
                latitude: coords.latitude,
                longitude: coords.longitude
            }]);

        if (error) {
            console.error(`  ❌ Error al guardar en Supabase:`, error.message);
        } else {
            console.log(`  ✅ Guardado con éxito (Lat: ${coords.latitude}, Lon: ${coords.longitude})`);
        }

        contador++;
        // Pausa de 1 segundo obligatorio para respetar las políticas de la API de mapas
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("¡Importación masiva finalizada con éxito!");
}

importarClientesMasivo();
