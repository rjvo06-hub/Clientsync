import { loadEmployees } from './employees.js';

// Punto de entrada principal cuando carga ClientSync
document.addEventListener('DOMContentLoaded', () => {
    console.log('ClientSync inicializado correctamente.');
    
    // Cargar los empleados al iniciar
    loadEmployees();
});