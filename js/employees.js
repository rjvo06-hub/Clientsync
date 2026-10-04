import { supabase } from './supabaseClient.js';

// Elementos del DOM
const employeeForm = document.getElementById('employee-form');
const employeesList = document.getElementById('employees-list');
const employeeFilterSelect = document.getElementById('filter-employee');

// 1. Cargar y listar empleados (tanto en la lista como en el filtro superior)
export async function loadEmployees() {
    if (!employeesList) return;

    employeesList.innerHTML = '<li>Cargando empleados...</li>';
    
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar empleados:', error.message);
        employeesList.innerHTML = '<li>Error al cargar los datos.</li>';
        return;
    }

    if (data.length === 0) {
        employeesList.innerHTML = '<li>No hay empleados registrados todavía.</li>';
        if (employeeFilterSelect) {
            employeeFilterSelect.innerHTML = '<option value="all">Todo el equipo</option>';
        }
        return;
    }

    // Limpiar y pintar la lista lateral
    employeesList.innerHTML = '';
    // Actualizar también el select de filtros superior
    if (employeeFilterSelect) {
        employeeFilterSelect.innerHTML = '<option value="all">Todo el equipo</option>';
    }

    data.forEach(emp => {
        // Elemento en la lista del panel
        const li = document.createElement('li');
        li.className = 'employee-item';
        li.innerHTML = `
            <div>
                <strong>${emp.name}</strong> (${emp.role})<br>
                <small>${emp.email}</small>
            </div>
        `;
        employeesList.appendChild(li);

        // Opción en el selector superior
        if (employeeFilterSelect) {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            employeeFilterSelect.appendChild(option);
        }
    });
}

// 2. Registrar un nuevo empleado desde el formulario
async function handleEmployeeSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('emp-name').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const role = document.getElementById('emp-role').value;

    const { error } = await supabase
        .from('employees')
        .insert([{ name, email, role }]);

    if (error) {
        alert('Error al registrar empleado: ' + error.message);
        console.error(error);
    } else {
        alert('¡Empleado registrado con éxito!');
        employeeForm.reset();
        loadEmployees(); // Recargar la lista automáticamente
    }
}

// Inicializar el evento de envío del formulario
if (employeeForm) {
    employeeForm.addEventListener('submit', handleEmployeeSubmit);
}