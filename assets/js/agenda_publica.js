document.addEventListener('DOMContentLoaded', () => {
    const filterNombre = document.getElementById('filter-nombre');
    const filterEspecialidad = document.getElementById('filter-especialidad');
    const filterCobertura = document.getElementById('filter-cobertura');
    const resultsContainer = document.getElementById('results-container');
    
    // Cargar Especialidades
    fetch('backend/api/get_especialidades.php')
        .then(response => response.json())
        .then(data => {
            data.forEach(esp => {
                const option = document.createElement('option');
                option.value = esp.id;
                option.textContent = esp.nombre;
                filterEspecialidad.appendChild(option);
            });
        });

    // Cargar Coberturas (Obras Sociales)
    fetch('backend/api/crud_obras_sociales.php')
        .then(response => response.json())
        .then(data => {
            data.forEach(os => {
                const option = document.createElement('option');
                option.value = os.id;
                option.textContent = os.nombre;
                filterCobertura.appendChild(option);
            });
        });

    // Función para renderizar los médicos
    const loadAgenda = () => {
        resultsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mt-2">Buscando profesionales...</div>
            </div>`;

        const params = new URLSearchParams();
        if (filterNombre.value) params.append('nombre', filterNombre.value);
        if (filterEspecialidad.value) params.append('especialidad_id', filterEspecialidad.value);
        if (filterCobertura.value) params.append('obra_social_id', filterCobertura.value);

        fetch(`backend/api/get_public_agenda.php?${params.toString()}`)
            .then(response => response.json())
            .then(medicos => {
                resultsContainer.innerHTML = '';
                
                if (!medicos || medicos.length === 0) {
                    resultsContainer.innerHTML = `<div class="alert alert-info text-center mt-4">No se encontraron profesionales con esos criterios.</div>`;
                    return;
                }

                medicos.forEach(medico => {
                    const card = document.createElement('div');
                    card.className = 'doctor-card';
                    
                    // Especialidades
                    const especialidadesText = medico.especialidades.map(e => e.nombre).join(', ') || 'Medicina General';
                    
                    // Coberturas
                    const coberturasText = medico.obras_sociales.length > 0 
                        ? 'Atiende: ' + medico.obras_sociales.map(o => o.nombre).join(', ') 
                        : 'Particular / Sin coberturas asignadas';
                    
                    // Horarios
                    let horariosHtml = '';
                    if (medico.horarios && medico.horarios.length > 0) {
                        medico.horarios.forEach(h => {
                            // Formatear H:i:s a H:i
                            const inicio = h.hora_inicio.substring(0, 5);
                            const fin = h.hora_fin.substring(0, 5);
                            horariosHtml += `
                                <div class="schedule-row">
                                    <span>${h.dia_semana}</span>
                                    <span>${inicio} hs a ${fin} hs</span>
                                </div>`;
                        });
                    } else {
                        horariosHtml = `<div class="text-muted small">Sin horarios cargados</div>`;
                    }

                    // Foto por defecto
                    const fotoUrl = medico.foto_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(medico.nombre + ' ' + medico.apellido) + '&background=e9ecef&color=6c757d';

                    card.innerHTML = `
                        <div class="doctor-avatar-col">
                            <img src="${fotoUrl}" alt="Dr. ${medico.apellido}">
                        </div>
                        <div class="doctor-info-col">
                            <div class="doctor-name">${medico.nombre} ${medico.apellido}</div>
                            <div class="doctor-specialty">${especialidadesText}</div>
                            <div class="doctor-coberturas">${coberturasText}</div>
                        </div>
                        <div class="doctor-schedule-col">
                            <div>
                                ${horariosHtml}
                            </div>
                            <button class="btn-agendar" onclick="agendarTurno(${medico.id})">AGENDAR TURNO</button>
                        </div>
                    `;
                    resultsContainer.appendChild(card);
                });
            })
            .catch(error => {
                resultsContainer.innerHTML = `<div class="alert alert-danger text-center mt-4">Ocurrió un error al cargar la agenda. Intenta nuevamente más tarde.</div>`;
                console.error(error);
            });
    };

    // Listeners
    filterNombre.addEventListener('input', debounce(loadAgenda, 500));
    filterEspecialidad.addEventListener('change', loadAgenda);
    filterCobertura.addEventListener('change', loadAgenda);

    // Carga Inicial
    loadAgenda();
});

// Función para el botón Agendar
window.agendarTurno = function(medicoId) {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        // Redirigir a login si no hay sesión
        window.location.href = 'login.php?redirect=agendar&medico_id=' + medicoId;
    } else {
        // Redirigir al dashboard
        window.location.href = 'dashboard.php?agendar_medico_id=' + medicoId;
    }
};

// Utils: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
