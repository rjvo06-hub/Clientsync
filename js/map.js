async function loadAndRenderClients(mapInstance, bounds) {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*');

        if (error) {
            console.error('❌ Error al cargar clientes:', error.message);
            return;
        }

        if (!clients || clients.length === 0) return;

        clients.forEach(client => {
            if (client.latitude && client.longitude) {
                const clientLatLng = { lat: Number(client.latitude), lng: Number(client.longitude) };
                bounds.extend(clientLatLng);

                // 🌟 Lógica de iconos: Azul si tiene cita programada, Rojo si no tiene
                const hasAppointment = Boolean(client.appointment_date);
                const markerIcon = hasAppointment 
                    ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"  // Azul = Con cita
                    : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";   // Rojo = Sin cita

                const marker = new google.maps.Marker({
                    position: clientLatLng,
                    map: mapInstance,
                    title: client.name,
                    icon: { url: markerIcon }
                });

                const infoWindow = new google.maps.InfoWindow();
                marker.addListener('click', () => {
                    let appointmentText = 'No programada';
                    if (client.appointment_date) {
                        const dateObj = new Date(client.appointment_date);
                        appointmentText = dateObj.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                    }

                    const contentString = `
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 5px 0; color: ${hasAppointment ? '#2b6cb0' : '#e53e3e'}; font-size: 1.1rem;">
                                ${hasAppointment ? '🔵' : '🔴'} ${client.name}
                            </h3>
                            <p style="margin: 0 0 3px 0; font-size: 0.9rem; color: #4a5568;"><strong>Dirección:</strong> ${client.address}, ${client.postal_code}</p>
                            <p style="margin: 0 0 3px 0; font-size: 0.9rem; color: #4a5568;"><strong>Teléfono:</strong> ${client.phone || 'N/A'}</p>
                            <p style="margin: 3px 0 0 0; font-size: 0.9rem; color: #2b6cb0;"><strong>Cita:</strong> ${appointmentText}</p>
                        </div>
                    `;
                    infoWindow.setContent(contentString);
                    infoWindow.open(mapInstance, marker);
                });
            }
        });

    } catch (err) {
        console.error('❌ Excepción al renderizar clientes:', err);
    }
}
