import { loadEmployees } from './employees.js';

// Punto de entrada principal cuando carga ClientSync
document.addEventListener('DOMContentLoaded', () => {
    console.log('ClientSync inicializado correctamente.');
    
    // Cargar los empleados al iniciar
    loadEmployees();

    // Verificación y activación del enlace Admin PDF para el superusuario (acceso === 1)
    verificarAdminPdf();
});

function verificarAdminPdf() {
    const acceso = localStorage.getItem('usuario_acceso');
    const esAdmin = Number(acceso) === 1;

    if (esAdmin) {
        const linkPdf = document.getElementById('linkAdminPdf');
        const sepPdf = document.getElementById('sepAdminPdf');
        
        if (linkPdf) linkPdf.style.display = 'inline';
        if (sepPdf) sepPdf.style.display = 'inline';
    }
}
