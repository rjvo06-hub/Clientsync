/**
 * js/pdfGeneratorClient.js
 * Módulo independiente para la generación, vista previa e impresión del reporte de CLIENTES en PDF.
 */

function formatDateGerman(str) {
    if (!str) return '';
    const p = str.split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : str;
}

function formatFlatTime(timestampStr) {
    if (!timestampStr) return '--:--';
    const parts = timestampStr.split(/[\sT]/);
    if (parts.length > 1) return parts[1].substring(0, 5);
    return timestampStr.substring(11, 16) || '--:--';
}

function formatHoursAndMinutes(totalMinutes) {
    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0m';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function generateClientPDF(apptsData, clientsMap, employeeFilter = 'ALL') {
    if (!apptsData || apptsData.length === 0) {
        alert('Keine Kundendaten zum Exportieren vorhanden.');
        return;
    }

    // Filtrar citas según el empleado seleccionado si aplica
    const filteredAppts = apptsData.filter(a => {
        if (employeeFilter === 'ALL') return true;
        if (!a.assigned_employee) return false;
        const list = a.assigned_employee.split(',').map(e => e.trim().toLowerCase());
        return list.includes(employeeFilter.toLowerCase());
    });

    if (filteredAppts.length === 0) {
        alert('Keine Kundenbesuche für die ausgewählten Kriterien vorhanden.');
        return;
    }

    // Agrupar citas por fecha
    const apptsByDate = new Map();
    filteredAppts.forEach(a => {
        const dateStr = a.scheduled_date.split('T')[0];
        if (!apptsByDate.has(dateStr)) apptsByDate.set(dateStr, []);
        apptsByDate.get(dateStr).push(a);
    });

    const sortedDates = Array.from(apptsByDate.keys()).sort();

    let contentHtml = '';
    let totalVisits = 0;
    let totalNetLaborMinutes = 0;

    sortedDates.forEach(dateStr => {
        const dayVisits = apptsByDate.get(dateStr);
        totalVisits += dayVisits.length;

        let dayRowsHtml = '';

        dayVisits.forEach(a => {
            const client = clientsMap.get(a.client_id) || { name: 'Unbekannter Kunde', address: '' };
            const checkIn = formatFlatTime(a.check_in_time);
            const checkOut = formatFlatTime(a.check_out_time);
            const realDurationMins = a.visit_duration_minutes || 0;
            const team = a.assigned_employee || 'Unbekannt';
            
            totalNetLaborMinutes += (a.total_labor_minutes || realDurationMins);

            dayRowsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 4px; vertical-align: top;">
                        <strong style="color: #0f172a; font-size: 12px;">${client.name}</strong>
                        <div style="font-size: 10px; color: #64748b;">${client.address || 'Keine Adresse'}</div>
                    </td>
                    <td style="padding: 8px 4px; vertical-align: top; color: #334155; font-size: 11px;">
                        ${team}
                    </td>
                    <td style="padding: 8px 4px; vertical-align: top; color: #0f172a; font-size: 11px;">
                        ${checkIn} - ${checkOut}
                    </td>
                    <td style="padding: 8px 4px; vertical-align: top; text-align: right; font-weight: 700; color: #2563eb; font-size: 11px;">
                        ${formatHoursAndMinutes(realDurationMins)}
                    </td>
                </tr>
            `;
        });

        contentHtml += `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 800; color: #0f172a; background: #f8fafc; padding: 6px 8px; border-left: 3px solid #0f172a; margin-bottom: 8px;">
                    📅 Datum: ${formatDateGerman(dateStr)} (${dayVisits.length} Besuch/e)
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; font-size: 10px; color: #64748b;">
                            <th style="width: 35%; padding-bottom: 4px;">KUNDE</th>
                            <th style="width: 35%; padding-bottom: 4px;">PERSONAL</th>
                            <th style="width: 15%; padding-bottom: 4px;">ZEIT (IN/OUT)</th>
                            <th style="width: 15%; padding-bottom: 4px; text-align: right;">DAUER</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dayRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    });

    const totalHoursFormatted = (totalNetLaborMinutes / 60).toFixed(1).replace('.', ',');

    // Plantilla HTML del PDF de Clientes
    const templateContainer = document.createElement('div');
    templateContainer.style.padding = '35px 40px';
    templateContainer.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    templateContainer.style.fontSize = '12px';
    templateContainer.style.color = '#0f172a';
    templateContainer.style.backgroundColor = '#ffffff';

    templateContainer.innerHTML = `
        <!-- Encabezado -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
                <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">KUNDENBESUCHE-NACHWEIS</h2>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">Filter: <span style="color: #0f172a;">${employeeFilter === 'ALL' ? 'Alle Mitarbeiter' : employeeFilter}</span></div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
                ClientSync Audit System
            </div>
        </div>

        <!-- Contenido principal -->
        ${contentHtml}

        <!-- Resumen al final (Alineado a la derecha) -->
        <div style="float: right; text-align: right; margin-top: 15px; font-size: 12px; line-height: 1.6; color: #0f172a;">
            <div style="color: #64748b; font-weight: 500;">Gesamte Kundenzeit</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${totalHoursFormatted} h (${totalVisits} Besuche)</div>
        </div>
        <div style="clear: both;"></div>
    `;

    const fileName = `Kundenbericht_${employeeFilter.replace(/\s+/g, '_')}.pdf`;

    const options = {
        margin:       [12, 12, 12, 12],
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(templateContainer).toPdf().output('blob').then((pdfBlob) => {
        const blobUrl = URL.createObjectURL(pdfBlob);
        openPdfPreviewModal(blobUrl, fileName);
    });
}

function openPdfPreviewModal(blobUrl, fileName) {
    const existingModal = document.getElementById('pdf-preview-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div id="pdf-preview-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; backdrop-filter: blur(4px);">
            <div style="background: #ffffff; width: 100%; max-width: 900px; height: 90vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                
                <div style="padding: 16px 24px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 700; font-size: 0.95rem;">
                        <span>🏢 Vista Previa - Reporte de Clientes</span>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a id="btn-modal-download" href="${blobUrl}" download="${fileName}" style="background: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; text-decoration: none;">
                            📥 Descargar PDF
                        </a>
                        <button id="btn-modal-close" type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 4px 8px;">✕</button>
                    </div>
                </div>

                <iframe src="${blobUrl}" style="width: 100%; height: 100%; border: none; background: #525659;"></iframe>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-modal-close').addEventListener('click', () => {
        const modal = document.getElementById('pdf-preview-modal');
        if (modal) modal.remove();
        URL.revokeObjectURL(blobUrl);
    });
}
