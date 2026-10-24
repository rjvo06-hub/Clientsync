<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ClientSync | Gestión de Citas</title>
    <link rel="stylesheet" href="./css/main.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 6px; }
        .container { max-width: 650px; margin: 8px auto 40px auto; background: white; padding: 14px; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding-bottom: 80px; width: 100%; border: 1px solid #e2e8f0; }
        select, input, button { font-size: 14px; padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 8px; background: #ffffff; transition: border-color 0.2s, box-shadow 0.2s; outline: none; width: 100%; }
        select:focus, input:focus { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.15); }
        
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; margin-bottom: 12px; font-size: 0.82rem; color: #4a5568; display: none; }
        .suggestion-box { background: #f0f4f8; border: 1px solid #cbd5e0; padding: 12px; border-radius: 10px; margin-bottom: 12px; font-size: 0.82rem; display: none; }
        
        .form-row-group {
            margin-bottom: 12px;
            width: 100%;
        }

        .datetime-four-grid {
            display: grid;
            grid-template-columns: 1fr 24px 110px 24px;
            align-items: end;
            gap: 4px;
            width: 100%;
        }
        .datetime-col {
            min-width: 0;
        }
        .datetime-col input {
            width: 100%;
        }

        .transparent-helper-field {
            width: 24px !important;
            min-width: 24px !important;
            background: transparent !important;
            border: 1px solid transparent !important;
            box-shadow: none !important;
            pointer-events: none;
            color: transparent;
            padding: 10px 0 !important;
            text-align: center;
        }

        input[type="date"] {
            background: #ffffff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%23a0aec0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') no-repeat right 10px center;
            background-size: 14px;
        }
        input[type="time"] {
            background: #ffffff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%23a0aec0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>') no-repeat right 8px center;
            background-size: 14px;
            padding-right: 24px;
        }

        .appointment-selection-card {
            background: #fff;
            border: 1px solid #cbd5e0;
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        }
        .appointment-selection-card.selected {
            background-color: #ebf8ff;
            border: 2px solid #2b6cb0;
        }

        .suggestion-item-btn {
            width: 100%;
            padding: 10px 12px;
            margin-top: 6px;
            border-radius: 8px;
            font-weight: normal;
            font-size: 0.82rem;
            text-align: left;
            cursor: pointer;
            background: white !important;
            border: 1px solid #cbd5e0 !important;
            color: #2d3748 !important;
            transition: all 0.2s;
        }
        
        .suggestion-item-btn.selected-suggestion {
            background-color: #ebf8ff !important;
            border: 2px solid #2b6cb0 !important;
            box-shadow: 0 0 0 2px rgba(43, 108, 176, 0.2);
        }

        .suggestion-item-btn.reschedule-highlight {
            border: 2px dashed #3182ce !important;
            background-color: #f7fafc !important;
        }

        .client-search-container {
            position: relative;
            margin-bottom: 12px;
            width: 100%;
        }
        .client-results-dropdown, .service-results-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #cbd5e0;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: none;
        }
        .client-result-item, .service-result-item {
            padding: 10px 12px;
            cursor: pointer;
            border-bottom: 1px solid #edf2f7;
            font-size: 0.82rem;
        }
        .client-result-item:hover, .service-result-item:hover {
            background: #ebf8ff;
            color: #2b6cb0;
        }

        #map-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .map-modal-content {
            background: white;
            width: 95%;
            max-width: 700px;
            height: 80vh;
            padding: 14px;
            border-radius: 14px;
            display: flex;
            flex-direction: column;
        }
        #interactive-map {
            width: 100%;
            flex-grow: 1;
            border-radius: 10px;
            border: 1px solid #cbd5e0;
            margin-top: 8px;
        }

        details summary {
            cursor: pointer;
            font-weight: bold;
            color: #2d3748;
            padding: 4px 0;
            user-select: none;
            font-size: 0.82rem;
        }
        details summary:hover {
            color: #2b6cb0;
        }
    </style>
</head>
<body>

    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h1 id="page-title" style="margin: 0; font-size: 1.1rem; color: #1a202c; font-weight: 700;">📅 Gestión de Citas</h1>
            <a href="./index.html" style="padding: 6px 12px; background: #e2e8f0; color: #4a5568; text-decoration: none; border-radius: 8px; font-size: 0.78rem; font-weight: 600; width: auto;">← Mapa</a>
        </div>

        <p id="page-subtitle" style="color: #64748b; font-size: 0.8rem; margin-bottom: 12px; line-height: 1.4;">
            Gestiona las citas y optimiza tus rutas según las distancias.
        </p>

        <form id="appointment-form">
            <div class="client-search-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-weight: 600; color: #2d3748; font-size: 0.82rem;">1. Buscar Cliente (nombre o calle):</label>
                    <button type="button" id="btn-open-map-selector" style="width: auto; padding: 3px 6px; font-size: 0.7rem; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🗺️ Mapa</button>
                </div>
                <input type="text" id="client-search-input" placeholder="Escribe parte del nombre o la calle..." autocomplete="off" required>
                <input type="hidden" id="client-select" required>
                <div id="client-results-dropdown" class="client-results-dropdown"></div>
            </div>

            <div id="client-details" class="info-card">
                <strong>Cliente Seleccionado:</strong> <span id="det-name" style="color: #2b6cb0; font-weight: bold;">-</span><br>
                <strong>Dirección:</strong> <span id="det-address">-</span><br>
                <strong>Coordenadas:</strong> <span id="det-coords" style="color: #2b6cb0;">-</span><br>
                
                <div id="appointments-selection-container" style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e0; display: none;">
                    <details>
                        <summary id="appointments-box-title">📅 Citas actuales del cliente:</summary>
                        <div id="client-appointments-list" style="margin-top: 6px;"></div>
                    </details>
                </div>
            </div>

            <div id="date-section" style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 15px; display: none;">
                <label id="section-step-label" style="font-size: 0.82rem; font-weight: 700; color: #2d3748; display: block; margin-bottom: 6px;">2. Fecha, Hora y Detalles:</label>
                
                <div id="route-suggestions" class="suggestion-box" style="margin-bottom: 10px;">
                    <details>
                        <summary style="color: #2b6cb0;">💡 Citas agendadas y distancias (recomendadas)</summary>
                        <div id="suggestions-list" style="margin-top: 6px;"></div>
                    </details>
                </div>

                <div class="form-row-group">
                    <div class="datetime-four-grid" style="margin-bottom: 3px;">
                        <div class="datetime-col">
                            <label style="font-size: 0.72rem; font-weight: 600; color: #4a5568; display: block;">📅 Fecha:</label>
                        </div>
                        <div class="datetime-col"></div>
                        <div class="datetime-col">
                            <label style="font-size: 0.72rem; font-weight: 600; color: #4a5568; display: block;">⏰ Hora:</label>
                        </div>
                        <div class="datetime-col"></div>
                    </div>

                    <div class="datetime-four-grid">
                        <div class="datetime-col">
                            <input type="date" id="free-date-input" required>
                        </div>
                        <div class="datetime-col">
                            <input type="text" class="transparent-helper-field" value="" readonly tabindex="-1">
                        </div>
                        <div class="datetime-col">
                            <input type="time" id="appointment-time" required>
                        </div>
                        <div class="datetime-col">
                            <input type="text" class="transparent-helper-field" value="" readonly tabindex="-1">
                        </div>
                    </div>
                </div>

                <div class="form-row-group">
                    <label style="font-size: 0.72rem; font-weight: 600; color: #4a5568; display: block; margin-bottom: 3px;">Horas estimadas (Opcional):</label>
                    <!-- Cambiado a type="text" con inputmode="decimal" para permitir escribir números libremente con el teclado -->
                    <input type="text" id="estimated-hours" inputmode="decimal" placeholder="Ej. 4 o 1.5">
                </div>

                <div class="client-search-container" style="margin-top: 8px; margin-bottom: 0;">
                    <label style="font-size: 0.72rem; font-weight: 600; color: #4a5568; display: block; margin-bottom: 3px;">Trabajo a realizar / Solicitud:</label>
                    <input type="text" id="service-search-input" placeholder="Ej. Corte de árbol, Poda..." autocomplete="off">
                    <div id="service-results-dropdown" class="service-results-dropdown"></div>
                </div>
            </div>

            <input type="hidden" id="selected-appointment-date" required>

            <button type="submit" id="save-btn" style="background: #38a169; color: white; border: none; font-weight: bold; cursor: pointer; padding: 12px; font-size: 0.9rem; opacity: 0.6; margin-bottom: 20px; width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(56, 161, 105, 0.2);" disabled>
                Confirmar y Agendar Cita
            </button>
        </form>
    </div>

    <div id="map-modal">
        <div class="map-modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 0.9rem; color: #2d3748;">🗺️ Selecciona un cliente en el mapa</h3>
                <button type="button" id="close-map-modal" style="width: auto; padding: 4px 8px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">✕ Cerrar</button>
            </div>
            <p style="font-size: 0.72rem; color: #666; margin: 4px 0 0 0;">Haz clic en cualquier pin del mapa para seleccionar al cliente.</p>
            <div id="interactive-map"></div>
        </div>
    </div>

    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC4uaDGEnYaYHBqxhcCGyKA2uTAyJmwRZQ" async defer></script>

    <script type="module">
        import { supabase } from './js/supabaseClient.js';
        import { initInteractiveMapModal } from './js/interactive-map-modal.js';

        let activeClient = null;
        window.activeClient = null;
        let allClients = [];
        let allAppointments = [];
        let allServices = [];
        let clientAppointments = [];
        let selectedAppointmentId = null;
        let selectedDateOnly = '';
        const todayStrSystem = new Date().toISOString().split('T')[0];

        const urlParams = new URLSearchParams(window.location.search);
        let actionType = urlParams.get('action') === 'reschedule' ? 'reschedule' : 'new';

        function updateUIModeText() {
            if (actionType === 'new') {
                document.getElementById('page-title').textContent = '➕ Programar Nueva Cita';
                document.getElementById('page-subtitle').textContent = 'Agrega una nueva visita o selecciona una fecha recomendada.';
                document.getElementById('save-btn').textContent = 'Confirmar y Crear Nueva Cita';
            } else {
                document.getElementById('page-title').textContent = '🔄 Reprogramar Cita';
                document.getElementById('page-subtitle').textContent = 'Modificando la fecha de la cita seleccionada.';
                document.getElementById('save-btn').textContent = 'Confirmar y Actualizar Cita';
            }
        }
        updateUIModeText();

        const freeDateInput = document.getElementById('free-date-input');
        if (freeDateInput) {
            freeDateInput.setAttribute('min', todayStrSystem);
        }

        function calculateDistanceKm(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        function formatDateToDDMMYYYY(dateStr) {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        }

        function formatLocalDateTime(dateStr, timeStr) {
            if (!dateStr) return '';
            const cleanDate = dateStr.split('T')[0];
            const dateParts = cleanDate.split('-');
            const timePart = timeStr ? timeStr.substring(0, 5) : '00:00';
            
            if (dateParts.length === 3) {
                const [year, month, day] = dateParts;
                const localDate = new Date(year, month - 1, day);
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const dateReadable = localDate.toLocaleDateString('es-ES', options);
                return `${dateReadable}, ${timePart} hrs`;
            }
            return `${cleanDate} ${timePart}`;
        }

        function suggestNextTimeForDate(dateStr) {
            const apptsOnDate = allAppointments.filter(a => a.scheduled_date && a.scheduled_date.startsWith(dateStr));
            if (apptsOnDate.length === 0) {
                if (dateStr === todayStrSystem) {
                    const now = new Date();
                    const currentH = now.getHours();
                    const currentM = now.getMinutes();
                    const formattedH = String(currentH).padStart(2, '0');
                    const formattedM = currentM > 0 ? String(Math.min(currentM + 15, 59)).padStart(2, '0') : '00';
                    return `${formattedH}:${formattedM}`;
                }
                return "09:00";
            }

            let latestHour = 9;
            let latestMinute = 0;

            apptsOnDate.forEach(a => {
                const timeStr = a.time_slot || '09:00';
                const timeParts = timeStr.split(':');
                const h = parseInt(timeParts[0], 10);
                const m = parseInt(timeParts[1], 10);
                const totalMins = h * 60 + m;
                
                const durationMins = a.estimated_hours ? (Number(a.estimated_hours) * 60) : 60;
                const endMins = totalMins + durationMins;

                const currentLatestMins = latestHour * 60 + latestMinute;
                if (endMins > currentLatestMins) {
                    latestHour = Math.floor(endMins / 60);
                    latestMinute = endMins % 60;
                }
            });

            if (latestHour > 20) latestHour = 20;

            const formattedH = String(latestHour).padStart(2, '0');
            const formattedM = String(latestMinute).padStart(2, '0');
            return `${formattedH}:${formattedM}`;
        }

        async function initForm() {
            try {
                const [{ data: clientData }, { data: apptData }, { data: serviceData }] = await Promise.all([
                    supabase.from('clients').select('*').order('name', { ascending: true }),
                    supabase.from('appointments').select('*'),
                    supabase.from('services').select('*').order('name', { ascending: true })
                ]);

                allClients = clientData || [];
                allAppointments = apptData || [];
                allServices = serviceData || [];

                const targetClientId = urlParams.get('client_id');
                if (targetClientId) {
                    const found = allClients.find(c => c.id === targetClientId);
                    if (found) {
                        selectClient(found);
                    }
                }

                initInteractiveMapModal(
                    'map-modal',
                    'interactive-map',
                    'btn-open-map-selector',
                    'close-map-modal',
                    () => allClients,
                    (selectedClient) => {
                        selectClient(selectedClient);
                    }
                );

            } catch (err) {
                console.error('Error al inicializar:', err);
                alert('Hubo un error al cargar la información.');
            }
        }

        const searchInput = document.getElementById('client-search-input');
        const dropdown = document.getElementById('client-results-dropdown');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            const startsWithMatches = allClients.filter(c => {
                const name = (c.name || '').toLowerCase();
                const address = (c.address || '').toLowerCase();
                const postal = (c.postal_code || '').toLowerCase();
                return name.startsWith(query) || address.startsWith(query) || postal.startsWith(query);
            });

            const containsMatches = allClients.filter(c => {
                const name = (c.name || '').toLowerCase();
                const address = (c.address || '').toLowerCase();
                const postal = (c.postal_code || '').toLowerCase();
                
                const hasMatch = name.includes(query) || address.includes(query) || postal.includes(query);
                const alreadyAdded = startsWithMatches.includes(c);

                return hasMatch && !alreadyAdded;
            });

            const filtered = [...startsWithMatches, ...containsMatches];

            dropdown.innerHTML = '';
            if (filtered.length > 0) {
                filtered.forEach(client => {
                    const item = document.createElement('div');
                    item.className = 'client-result-item';
                    item.innerHTML = `<strong>${client.name}</strong><br><span style="font-size:0.75rem; color:#666;">${client.address || 'Sin dirección'}, CP: ${client.postal_code || 'N/A'}</span>`;
                    item.addEventListener('click', () => {
                        selectClient(client);
                        dropdown.style.display = 'none';
                    });
                    dropdown.appendChild(item);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.innerHTML = `<div style="padding: 10px; font-size: 0.8rem; color: #718096;">No se encontraron clientes</div>`;
                dropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const serviceSearchInput = document.getElementById('service-search-input');
        const serviceDropdown = document.getElementById('service-results-dropdown');

        serviceSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length === 0) {
                serviceDropdown.style.display = 'none';
                return;
            }

            const startsWithMatches = allServices.filter(s => (s.name || '').toLowerCase().startsWith(query));
            const containsMatches = allServices.filter(s => {
                const name = (s.name || '').toLowerCase();
                return name.includes(query) && !startsWithMatches.includes(s);
            });

            const filtered = [...startsWithMatches, ...containsMatches];

            serviceDropdown.innerHTML = '';
            if (filtered.length > 0) {
                filtered.forEach(srv => {
                    const item = document.createElement('div');
                    item.className = 'service-result-item';
                    item.textContent = srv.name;
                    item.addEventListener('click', () => {
                        serviceSearchInput.value = srv.name;
                        serviceDropdown.style.display = 'none';
                    });
                    serviceDropdown.appendChild(item);
                });
                serviceDropdown.style.display = 'block';
            } else {
                serviceDropdown.innerHTML = `<div style="padding: 10px; font-size: 0.8rem; color: #718096;">Se guardará como un nuevo servicio</div>`;
                serviceDropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!serviceSearchInput.contains(e.target) && !serviceDropdown.contains(e.target)) {
                serviceDropdown.style.display = 'none';
            }
        });

        // Función para limpiar el formulario y refrescar los datos del mapa automáticamente
        async function resetFormAndReloadMap() {
            activeClient = null;
            window.activeClient = null;
            selectedAppointmentId = null;
            actionType = 'new';
            selectedDateOnly = '';

            searchInput.value = '';
            document.getElementById('client-select').value = '';
            document.getElementById('selected-appointment-date').value = '';
            document.getElementById('free-date-input').value = '';
            document.getElementById('appointment-time').value = '';
            document.getElementById('estimated-hours').value = '';
            serviceSearchInput.value = '';

            document.getElementById('client-details').style.display = 'none';
            document.getElementById('date-section').style.display = 'none';

            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';

            updateUIModeText();

            // Recargamos los datos desde Supabase para actualizar los pines del mapa al instante
            try {
                const [{ data: clientData }, { data: apptData }, { data: serviceData }] = await Promise.all([
                    supabase.from('clients').select('*').order('name', { ascending: true }),
                    supabase.from('appointments').select('*'),
                    supabase.from('services').select('*').order('name', { ascending: true })
                ]);

                allClients = clientData || [];
                allAppointments = apptData || [];
                allServices = serviceData || [];

                // Reinicializamos el modal del mapa para que dibuje los nuevos colores (azul/rojo)
                initInteractiveMapModal(
                    'map-modal',
                    'interactive-map',
                    'btn-open-map-selector',
                    'close-map-modal',
                    () => allClients,
                    (selectedClient) => {
                        selectClient(selectedClient);
                    }
                );
            } catch (err) {
                console.error('Error al actualizar datos tras guardar:', err);
            }
        }

        function selectClient(client) {
            activeClient = client;
            window.activeClient = client;
            searchInput.value = `${client.name} - ${client.address || 'Sin dirección'}`;
            document.getElementById('client-select').value = client.id;

            actionType = 'new';
            selectedAppointmentId = null;
            updateUIModeText();

            if (client.service_requested) {
                serviceSearchInput.value = client.service_requested;
            }

            const detailsCard = document.getElementById('client-details');
            const dateSection = document.getElementById('date-section');
            const suggestionBox = document.getElementById('route-suggestions');
            const suggestionsList = document.getElementById('suggestions-list');
            const saveBtn = document.getElementById('save-btn');
            
            selectedDateOnly = '';
            document.getElementById('selected-appointment-date').value = '';
            document.getElementById('free-date-input').value = '';
            document.getElementById('appointment-time').value = '';
            document.getElementById('estimated-hours').value = '';
            
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';

            if (!client.latitude || !client.longitude) {
                alert('Este cliente no tiene coordenadas geográficas registradas.');
                return;
            }

            document.getElementById('det-name').textContent = client.name;
            document.getElementById('det-address').textContent = `${client.address || 'Sin calle'}, CP: ${client.postal_code || 'N/A'}`;
            document.getElementById('det-coords').textContent = `${client.latitude}, ${client.longitude}`;

            clientAppointments = allAppointments.filter(a => a.client_id === client.id);
            const appointmentsContainer = document.getElementById('appointments-selection-container');
            const appointmentsBoxTitle = document.getElementById('appointments-box-title');
            const appointmentsListDiv = document.getElementById('client-appointments-list');
            appointmentsListDiv.innerHTML = '';

            if (clientAppointments.length > 0) {
                appointmentsContainer.style.display = 'block';
                appointmentsBoxTitle.textContent = `📅 Citas actuales del cliente (${clientAppointments.length}):`;

                clientAppointments.forEach((appt, index) => {
                    let formatted = 'Fecha no válida';
                    if (appt.scheduled_date) {
                        formatted = formatLocalDateTime(appt.scheduled_date, appt.time_slot);
                    }
                    
                    const card = document.createElement('div');
                    card.className = 'appointment-selection-card';
                    card.innerHTML = `
                        <div style="flex: 1;">
                            <strong style="color: #2b6cb0;">Cita #${index + 1}:</strong> ${formatted}
                            <div style="font-size: 0.72rem; color: #666;">Servicio: ${appt.service_requested || 'General'}</div>
                        </div>
                        <button type="button" class="btn-quick-reschedule" data-id="${appt.id}" style="width: auto; padding: 4px 8px; background: #3182ce; color: white; border: none; border-radius: 6px; font-size: 0.68rem; font-weight: bold; cursor: pointer; white-space: nowrap;">
                            🔄 Reprogramar
                        </button>
                    `;

                    card.querySelector('.btn-quick-reschedule').addEventListener('click', () => {
                        actionType = 'reschedule';
                        selectedAppointmentId = appt.id;
                        updateUIModeText();
                        
                        document.querySelectorAll('.appointment-selection-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        dateSection.style.display = 'block';
                        
                        if (appt.scheduled_date) {
                            const datePart = appt.scheduled_date.split('T')[0];
                            const timePart = appt.time_slot || '09:00';
                            document.getElementById('free-date-input').value = datePart;
                            document.getElementById('appointment-time').value = timePart;
                            if (appt.estimated_hours) {
                                document.getElementById('estimated-hours').value = appt.estimated_hours;
                            }
                            if (appt.service_requested) {
                                document.getElementById('service-search-input').value = appt.service_requested;
                            }
                            selectedDateOnly = datePart;
                            updateFinalTimestamp();
                            saveBtn.disabled = false;
                            saveBtn.style.opacity = '1';

                            document.querySelectorAll('.suggestion-item-btn').forEach(b => {
                                b.classList.remove('selected-suggestion', 'reschedule-highlight');
                                if (b.dataset.date === datePart) {
                                    b.classList.add('reschedule-highlight');
                                }
                            });
                        }
                    });

                    appointmentsListDiv.appendChild(card);
                });

                dateSection.style.display = 'block';
            } else {
                appointmentsContainer.style.display = 'block';
                appointmentsBoxTitle.textContent = `📅 Citas actuales del cliente (0):`;
                appointmentsListDiv.innerHTML = `<span style="color: #e53e3e; font-size: 0.78rem;">Este cliente no tiene ninguna cita programada actualmente.</span>`;
                dateSection.style.display = 'block';
            }

            detailsCard.style.display = 'block';

            suggestionsList.innerHTML = '';

            const activeDates = [...new Set(allAppointments.map(a => a.scheduled_date?.split('T')[0]))].filter(d => d >= todayStrSystem);

            activeDates.sort((dateA, dateB) => {
                const countA = allAppointments.filter(a => a.scheduled_date?.startsWith(dateA)).length;
                const countB = allAppointments.filter(a => a.scheduled_date?.startsWith(dateB)).length;
                return countA - countB;
            });

            if (activeDates.length > 0) {
                activeDates.forEach(dateStr => {
                    const apptsOnThisDate = allAppointments.filter(a => a.scheduled_date?.startsWith(dateStr));

                    let clientsDetailsHtml = '';
                    apptsOnThisDate.forEach(appt => {
                        const scheduledClient = allClients.find(c => c.id === appt.client_id);
                        if (scheduledClient && scheduledClient.latitude && scheduledClient.longitude) {
                            const timeStr = appt.time_slot ? appt.time_slot.substring(0, 5) : '09:00';
                            
                            const isCurrentClient = (scheduledClient.id === client.id);

                            if (isCurrentClient) {
                                clientsDetailsHtml += `<div style="font-size: 0.78rem; color: #2b6cb0; margin-top: 2px; font-weight: bold; background: #ebf8ff; padding: 2px 6px; border-radius: 4px;">• ${scheduledClient.name} a las ${timeStr}h (Actual)</div>`;
                            } else {
                                const dist = calculateDistanceKm(Number(client.latitude), Number(client.longitude), Number(scheduledClient.latitude), Number(scheduledClient.longitude));
                                const distFormatted = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;

                                clientsDetailsHtml += `<div style="font-size: 0.78rem; color: #4a5568; margin-top: 2px;">• <strong>${scheduledClient.name}</strong> a las ${timeStr}h <span style="color: #2b6cb0; font-weight: bold;">(a ${distFormatted})</span></div>`;
                            }
                        }
                    });

                    const totalCountOnDay = apptsOnThisDate.length;
                    let badgeText = `${totalCountOnDay} cita${totalCountOnDay > 1 ? 's' : ''}`;
                    const formattedDateDDMMYYYY = formatDateToDDMMYYYY(dateStr);

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `suggestion-item-btn`;
                    btn.dataset.date = dateStr;
                    btn.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 3px;">
                            <strong style="font-size: 0.8rem; color: #2b6cb0; text-decoration: underline;">📅 ${formattedDateDDMMYYYY}</strong>
                            <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 10px; background: #e2e8f0; color: #4a5568; font-weight: bold;">${badgeText}</span>
                        </div>
                        <div style="width: 100%; border-top: 1px solid #e2e8f0; padding-top: 2px;">
                            ${clientsDetailsHtml || '<span style="font-size: 0.72rem; color: #666;">Sin otras citas este día</span>'}
                        </div>
                    `;

                    btn.addEventListener('click', () => {
                        actionType = 'new';
                        selectedAppointmentId = null;
                        updateUIModeText();
                        document.querySelectorAll('.appointment-selection-card').forEach(c => c.classList.remove('selected'));

                        selectedDateOnly = dateStr;
                        document.getElementById('free-date-input').value = dateStr;
                        
                        const suggestedTime = suggestNextTimeForDate(dateStr);
                        document.getElementById('appointment-time').value = suggestedTime;

                        updateFinalTimestamp();

                        document.querySelectorAll('.suggestion-item-btn').forEach(b => b.classList.remove('selected-suggestion', 'reschedule-highlight'));
                        btn.classList.add('selected-suggestion');

                        saveBtn.disabled = false;
                        saveBtn.style.opacity = '1';
                    });

                    suggestionsList.appendChild(btn);
                });

                suggestionBox.style.display = 'block';
            } else {
                suggestionsList.innerHTML = `<p style="font-size: 0.78rem; color: #718096; margin: 2px 0;">No hay citas registradas. Selecciona la fecha en el calendario.</p>`;
                suggestionBox.style.display = 'block';
            }
        }

        document.getElementById('free-date-input').addEventListener('change', (e) => {
            const chosenDate = e.target.value;
            if (!chosenDate) return;

            if (chosenDate < todayStrSystem) {
                alert('No se pueden programar citas en fechas pasadas.');
                e.target.value = '';
                return;
            }

            selectedDateOnly = chosenDate;
            
            const suggestedTime = suggestNextTimeForDate(chosenDate);
            document.getElementById('appointment-time').value = suggestedTime;

            updateFinalTimestamp();

            document.querySelectorAll('.suggestion-item-btn').forEach(b => b.classList.remove('selected-suggestion', 'reschedule-highlight'));

            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        });

        document.getElementById('appointment-time').addEventListener('change', () => {
            if (selectedDateOnly) {
                updateFinalTimestamp();
            }
        });

        function updateFinalTimestamp() {
            const timeVal = document.getElementById('appointment-time').value || '09:00';
            if (selectedDateOnly) {
                document.getElementById('selected-appointment-date').value = selectedDateOnly;
            }
        }

        document.getElementById('appointment-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const clientId = document.getElementById('client-select').value;
            updateFinalTimestamp();
            const dateVal = document.getElementById('selected-appointment-date').value;
            const timeVal = document.getElementById('appointment-time').value || '09:00';
            const rawHours = document.getElementById('estimated-hours').value.trim();
            const serviceVal = document.getElementById('service-search-input').value.trim();

            if (!clientId || !dateVal) {
                alert('Selecciona un cliente y una fecha/hora válida.');
                return;
            }

            if (actionType === 'reschedule' && !selectedAppointmentId) {
                alert('Por favor, haz clic en el botón "🔄 Reprogramar" al lado de la cita que deseas modificar.');
                return;
            }

            if (dateVal < todayStrSystem) {
                alert('No se pueden programar citas en fechas pasadas.');
                return;
            }

            if (dateVal === todayStrSystem) {
                const now = new Date();
                const currentHours = String(now.getHours()).padStart(2, '0');
                const currentMinutes = String(now.getMinutes()).padStart(2, '0');
                const currentTimeStr = `${currentHours}:${currentMinutes}`;

                if (timeVal < currentTimeStr) {
                    alert('No puedes programar una cita a una hora que ya ha transcurrido el día de hoy.');
                    return;
                }
            }

            const btn = document.getElementById('save-btn');
            const originalBtnText = btn.textContent;
            btn.textContent = 'Guardando...';
            btn.disabled = true;

            if (serviceVal) {
                const exists = allServices.some(s => s.name.toLowerCase() === serviceVal.toLowerCase());
                if (!exists) {
                    const { data: newSrv } = await supabase.from('services').insert([{ name: serviceVal }]).select();
                    if (newSrv) allServices.push(newSrv[0]);
                }
            }

            const parsedHours = rawHours !== '' ? parseFloat(rawHours.replace(',', '.')) : null;

            const payload = {
                client_id: clientId,
                scheduled_date: dateVal,
                time_slot: timeVal,
                estimated_hours: !isNaN(parsedHours) ? parsedHours : null,
                service_requested: serviceVal || null
            };

            let errorResult = null;

            if (actionType === 'new') {
                const { error } = await supabase.from('appointments').insert([payload]);
                errorResult = error;
            } else {
                const { error } = await supabase.from('appointments').update(payload).eq('id', selectedAppointmentId);
                errorResult = error;
            }

            if (errorResult) {
                alert('Error al guardar la cita: ' + errorResult.message);
                btn.textContent = originalBtnText;
                btn.disabled = false;
            } else {
                const actionMsg = actionType === 'new' ? '¡Nueva cita registrada con éxito!' : '¡Cita reprogramada con éxito!';
                const formattedDateReadable = formatLocalDateTime(dateVal, timeVal);
                
                alert(`${actionMsg}\n\n📅 Cita Confirmada\nFecha: ${formattedDateReadable}\n👤 Cliente: ${activeClient ? activeClient.name : 'Cliente'}`);

                // Limpiamos el formulario y actualizamos automáticamente el mapa
                await resetFormAndReloadMap();

                btn.textContent = originalBtnText;
                btn.disabled = false;
            }
        });

        initForm();
    </script>
</body>
</html>
