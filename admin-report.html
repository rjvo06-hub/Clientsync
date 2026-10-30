/**
 * js/pdfGenerator.js
 * Módulo independiente para la generación e impresión del reporte en PDF.
 */

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

export function generateEmployeePDF(logsData, employeeName = 'Mitarbeiter') {
    if (!logsData || logsData.length === 0) {
        alert('Keine Daten zum Exportieren vorhanden.');
        return;
    }

    let totalHours = 0;
    let workDaysCount = 0;
    let totalVacationDays = 0;

    let tableRowsHtml = '';

    // Ordenar los registros por fecha ascendente para el reporte
    const sortedLogs = [...logsData].sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

    sortedLogs.forEach(log => {
        const dateFormatted = formatDateGerman(log.work_date);
        let timeText = '';
        let durationText = '';

        if (log.status === 'vacation' || log.is_vacation) {
            timeText = '<strong>Urlaub</strong>';
            durationText = '7';
            totalVacationDays++;
        } else if (log.status === 'off' || !log.clock_in_time) {
            timeText = 'frei';
            durationText = '';
        } else {
            const in1 = formatFlatTime(log.clock_in_time);
            const out1 = formatFlatTime(log.lunch_start_time || log.clock_out_time);
            let shift1 = `${in1}- ${out1}`;
            let shift2 = '';
            
            let totalMins = getHoursDifference(log.clock_in_time, log.clock_out_time);

            if (log.lunch_start_time && log.lunch_end_time) {
                const in2 = formatFlatTime(log.lunch_end_time);
                const out2 = formatFlatTime(log.clock_out_time);
                shift2 = `/ ${in2}- ${out2}`;
                
                const pauseMins = getHoursDifference(log.lunch_start_time, log.lunch_end_time);
                totalMins -= pauseMins;
            }

            timeText = `${shift1} ${shift2}`;
            durationText = totalMins > 0 ? totalMins.toString().replace('.', ',') : '';
            
            if (totalMins > 0) {
                totalHours += totalMins;
                workDaysCount++;
            }
        }

        tableRowsHtml += `
            <tr>
                <td style="padding: 4px 0; width: 25%;">${dateFormatted}</td>
                <td style="padding: 4px 0; width: 50%;">${timeText}</td>
                <td style="padding: 4px 0; width: 25%; text-align: right; padding-right: 30px;">${durationText}</td>
            </tr>
        `;
    });

    // Crear contenedor temporal con el diseño exacto de la imagen
    const templateContainer = document.createElement('div');
    templateContainer.style.padding = '40px 30px';
    templateContainer.style.fontFamily = 'Arial, sans-serif';
    templateContainer.style.fontSize = '13px';
    templateContainer.style.color = '#000000';
    templateContainer.style.backgroundColor = '#ffffff';

    templateContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
                <tr>
                    <th style="text-align: left; font-weight: normal; width: 25%; padding-bottom: 15px;">Datum</th>
                    <th style="text-align: left; font-weight: normal; width: 50%; padding-bottom: 15px;">Arbeitszeiten</th>
                    <th style="text-align: right; font-weight: normal; width: 25%; padding-bottom: 15px; padding-right: 30px;">Arbeitsdauer</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>

        <div style="float: right; width: 220px; margin-top: 20px; font-size: 13px; line-height: 1.6; color: #000000;">
            <div>Abgerechnet</div>
            <div style="margin-bottom: 14px;">${totalHours.toString().replace('.', ',')} h, ${workDaysCount} Tage</div>
            <div>Urlaub,</div>
            <div style="margin-bottom: 14px;">verbleiben 77,5</div>
            <div>Überstunden</div>
        </div>
        <div style="clear: both;"></div>
    `;

    const options = {
        margin:       [10, 10, 10, 10],
        filename:     `Arbeitszeit_${employeeName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(templateContainer).save();
}
