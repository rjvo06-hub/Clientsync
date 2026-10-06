/**
 * Evalúa el número de clientes y devuelve la clase y el mensaje del semáforo.
 * Umbrales:
 * 🟢 Verde: 0 o 1 cliente
 * 🟡 Amarillo: 2 o 3 clientes
 * 🔴 Rojo: 4 o más clientes
 */
function obtenerEstadoSemaforo(numClientes) {
    if (numClientes <= 1) {
        return { 
            clase: 'semaforo-green', 
            texto: '🟢 Disponible (Puedes incluir más clientes)' 
        };
    } else if (numClientes <= 3) {
        return { 
            clase: 'semaforo-yellow', 
            texto: '🟡 Carga Moderada (2-3 clientes)' 
        };
    } else {
        return { 
            clase: 'semaforo-red', 
            texto: '🔴 Día Saturado (4 o más clientes)' 
        };
    }
}

/**
 * Actualiza el componente visual del semáforo en tu interfaz
 * @param {Array} registrosDelDia - Lista de registros o clientes del día seleccionado
 */
function actualizarSemaforoDia(registrosDelDia) {
    // Contar clientes únicos del día (evita duplicados si un cliente tiene varias entradas el mismo día)
    const clientesUnicos = [...new Set(registrosDelDia.map(r => r.cliente || r.client_name))];
    const totalClientes = clientesUnicos.length;

    // Obtener estado según la regla del semáforo
    const estado = obtenerEstadoSemaforo(totalClientes);

    // Seleccionar el contenedor del semáforo en tu HTML (asegúrate de tener un elemento con este ID o clase)
    const contenedorSemaforo = document.getElementById('indicador-semaforo');
    
    if (contenedorSemaforo) {
        contenedorSemaforo.className = `semaforo-card ${estado.clase}`;
        contenedorSemaforo.innerHTML = `
            <span class="semaforo-texto">${estado.texto}</span>
            <span class="semaforo-detalle">Total de clientes únicos: ${totalClientes}</span>
        `;
    }
}
