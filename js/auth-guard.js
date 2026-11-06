import { supabase } from './supabaseClient.js';

export function verificarSesion() {
    const savedUser = localStorage.getItem('clientSync_saved_employee');

    if (!savedUser) {
        alert('Acceso no autorizado. Por favor inicie sesión.');
        // Redirige al index (si estás en una subcarpeta, ajústalo a '../index.html')
        window.location.href = '../index.html'; 
    }
}
