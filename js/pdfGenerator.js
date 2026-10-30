/**
 * js/pdfGenerator.js
 * Módulo independiente para la generación, vista previa e impresión del reporte en PDF.
 */

// Formatear la fecha a DD.MM.YYYY
function formatDateGerman(str) {
    if (!str) return '';
    const p = str.split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : str;
}

function formatFlatTime(timestampStr) {
    if (!timestampStr) return '';
    const parts = timestampStr.split(/[\sT]/);
    const time = parts.length > 1 ? parts[1] : parts[0];
    return time.substring(0, 5);
}

function getHoursDifference(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const parseMin = (s) => {
        const parts = s.split(/[\sT]/);
        const t = parts.length > 1 ? parts[1] : parts[0];
        const [h, m] = t.split(':');
        return (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
    };
    const diff = parseMin(endStr) - parseMin(startStr);
    return diff > 0 ? (diff / 60) : 0;
}

/**
 * Aplica la regla de redondeo personalizada:
 * - Decimales entre .1 y .4 -> Redondea hacia abajo al entero anterior (.0)
 * - Decimales entre .5 y .9 -> Redondea hacia arriba al entero siguiente (1.0)
 * Retorna número con máximo 2 decimales usando coma.
 */
function applyCustomRounding(hours) {
    if (!hours || isNaN(hours) || hours <= 0) return '';
    
    const integerPart = Math.floor(hours);
    const decimalPart = hours - integerPart;
    
    const firstDecimal = Math.floor(decimalPart * 10);
    
    let roundedValue = integerPart;
    if (firstDecimal >= 1 && firstDecimal <= 4) {
        roundedValue = integerPart;
    } else if (firstDecimal >= 5 && firstDecimal <= 9) {
        roundedValue = integerPart + 1;
    }

    return roundedValue.toFixed(2).replace(/\.00$/, '').replace('.', ',');
}

export function generateEmployeePDF(logsData, employeeName = 'Mitarbeiter') {
    if (!logsData || logsData.length === 0) {
        alert('Keine Daten zum Exportieren vorhanden.');
        return;
    }

    let rawTotalHours = 0;
    let workDaysCount = 0;
    let totalVacationDays = 0;

    let tableRowsHtml = '';

    // Ordenar los registros por fecha ascendente
    const sortedLogs = [...logsData].sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

    sortedLogs.forEach(log => {
        const dateFormatted = formatDateGerman(log.work_date);
        let timeText = '';
        let durationText = '';

        if (log.status === 'vacation' || log.is_vacation) {
            timeText = '<span style="font-weight: 700; color: #0f172a;">Urlaub</span>';
            durationText = '7';
            totalVacationDays++;
        } else if (log.status === 'off' || !log.clock_in_time) {
            timeText = '<span style="color: #64748b;">frei</span>';
            durationText = '';
        } else {
            const in1 = formatFlatTime(log.clock_in_time);
            const out1 = formatFlatTime(log.lunch_start_time || log.clock_out_time);
            let shift1 = `${in1}- ${out1}`;
            let shift2 = '';
            
            let totalHours = getHoursDifference(log.clock_in_time, log.clock_out_time);

            if (log.lunch_start_time && log.lunch_end_time) {
                const in2 = formatFlatTime(log.lunch_end_time);
                const out2 = formatFlatTime(log.clock_out_time);
                shift2 = `/ ${in2}- ${out2}`;
                
                const pauseHours = getHoursDifference(log.lunch_start_time, log.lunch_end_time);
                totalHours -= pauseHours;
            }

            timeText = `${shift1} ${shift2}`;
            
            if (totalHours > 0) {
                durationText = applyCustomRounding(totalHours);
                rawTotalHours += parseFloat(durationText.replace(',', '.')) || totalHours;
                workDaysCount++;
            }
        }

        tableRowsHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 7px 4px; color: #334155; font-weight: 500;">${dateFormatted}</td>
                <td style="padding: 7px 4px; color: #1e293b;">${timeText}</td>
                <td style="padding: 7px 4px; text-align: right; padding-right: 20px; font-weight: 600; color: #0f172a;">${durationText}</td>
            </tr>
        `;
    });

    const finalTotalHoursFormatted = applyCustomRounding(rawTotalHours) || rawTotalHours.toFixed(2).replace('.', ',');

    // Plantilla HTML con diseño moderno y estilizado
    const templateContainer = document.createElement('div');
    templateContainer.style.padding = '35px 40px';
    templateContainer.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    templateContainer.style.fontSize = '12px';
    templateContainer.style.color = '#0f172a';
    templateContainer.style.backgroundColor = '#ffffff';

    templateContainer.innerHTML = `
        <!-- Encabezado Estilizado -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
                <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">ARBEITSZEIT-NACHWEIS</h2>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">Mitarbeiter: <span style="color: #0f172a;">${employeeName}</span></div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
                ClientSync Audit System
            </div>
        </div>

        <!-- Tabla de Datos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="border-bottom: 1.5px solid #cbd5e1; background-color: #f8fafc;">
                    <th style="text-align: left; font-weight: 700; width: 25%; padding: 8px 4px; color: #475569; font-size: 11px;">DATUM</th>
                    <th style="text-align: left; font-weight: 700; width: 50%; padding: 8px 4px; color: #475569; font-size: 11px;">ARBEITSZEITEN</th>
                    <th style="text-align: right; font-weight: 700; width: 25%; padding: 8px 4px; padding-right: 20px; color: #475569; font-size: 11px;">ARBEITSDAUER</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>

        <!-- Bloque de Resumen Inferior Estilizado -->
        <div style="float: right; width: 230px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; font-size: 11px; line-height: 1.6; color: #334155;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Abgerechnet</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">${finalTotalHoursFormatted} h, ${workDaysCount} Tage</div>
            
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.05em;">Urlaub,</div>
            <div style="font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 12px;">verbleiben 77,5 Tage</div>
            
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Überstunden</div>
        </div>
        <div style="clear: both;"></div>
    `;

    const fileName = `Arbeitszeit_${employeeName.replace(/\s+/g, '_')}.pdf`;

    const options = {
        margin:       [12, 12, 12, 12],
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generación del Blob para Vista Previa
    html2pdf().set(options).from(templateContainer).toPdf().output('blob').then((pdfBlob) => {
        const blobUrl = URL.createObjectURL(pdfBlob);
        openPdfPreviewModal(blobUrl, fileName);
    });
}

/**
 * Crea e inserta dinámicamente una ventana modal interactiva con el visor PDF.
 */
function openPdfPreviewModal(blobUrl, fileName) {
    const existingModal = document.getElementById('pdf-preview-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div id="pdf-preview-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; backdrop-filter: blur(4px);">
            <div style="background: #ffffff; width: 100%; max-width: 900px; height: 90vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                
                <!-- Cabecera del Modal -->
                <div style="padding: 16px 24px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                        <span>👁️ Vista Previa del Reporte PDF</span>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a id="btn-modal-download" href="${blobUrl}" download="${fileName}" style="background: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;">
                            📥 Descargar PDF
                        </a>
                        <button id="btn-modal-close" type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 6px;">✕</button>
                    </div>
                </div>

                <!-- Visor iframe -->
                <iframe src="${blobUrl}" style="width: 100%; height: 100%; border: none; background: #525659;"></iframe>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Eventos para cerrar el modal y liberar memoria del Blob
    const closeModal = () => {
        const modal = document.getElementById('pdf-preview-modal');
        if (modal) modal.remove();
        URL.revokeObjectURL(blobUrl);
    };

    document.getElementById('btn-modal-close').addEventListener('click', closeModal);
}
