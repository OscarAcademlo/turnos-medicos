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
                    const col = document.createElement('div');
                    col.className = 'col-12 col-md-6 col-lg-4 col-xl-3 d-flex';
                    
                    // Especialidades
                    const especialidadesText = medico.especialidades.map(e => e.nombre).join(', ') || 'Medicina General';
                    
                    // Coberturas
                    let coberturasText = medico.obras_sociales.length > 0 
                        ? 'Atiende: ' + medico.obras_sociales.map(o => o.nombre).join(', ') 
                        : 'Particular / Consultar coberturas';
                        
                    // Limitar el texto de coberturas si es muy largo
                    if (coberturasText.length > 60) {
                        coberturasText = coberturasText.substring(0, 60) + '...';
                    }
                    
                    // Horarios
                    let horariosHtml = '';
                    if (medico.horarios && medico.horarios.length > 0) {
                        medico.horarios.slice(0, 3).forEach(h => {
                            const inicio = h.hora_inicio.substring(0, 5);
                            const fin = h.hora_fin.substring(0, 5);
                            horariosHtml += `<div class="small"><i class="bi bi-clock me-1"></i> ${h.dia_semana}: ${inicio} - ${fin}</div>`;
                        });
                        if(medico.horarios.length > 3) {
                            horariosHtml += `<div class="small text-primary mt-1">+${medico.horarios.length - 3} horarios más</div>`;
                        }
                    } else {
                        horariosHtml = `<div class="text-muted small">Sin horarios cargados</div>`;
                    }

                    // Foto del médico o fallback de iniciales
                    const avatarDefault = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(medico.nombre + ' ' + medico.apellido) + '&background=e9ecef&color=6c757d&size=200';
                    const fotoUrl = (medico.foto_perfil && medico.foto_perfil.trim() !== '') 
                        ? medico.foto_perfil 
                        : ((medico.foto_url && medico.foto_url.trim() !== '') ? medico.foto_url : avatarDefault);

                    col.innerHTML = `
                        <div class="card w-100 border-0 shadow-sm glass-card hover-lift" style="border-radius: 1rem; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease;">
                            <div class="text-center pt-4 pb-2" style="background: rgba(248,249,250,0.5);">
                                <img src="${fotoUrl}" alt="Dr. ${medico.apellido}" class="rounded-circle shadow-sm border border-3 border-white" style="width: 120px; height: 120px; object-fit: cover;" onerror="this.onerror=null; this.src='${avatarDefault}';">
                            </div>
                            <div class="card-body d-flex flex-column text-center">
                                <h5 class="card-title fw-bold mb-1">${medico.nombre} ${medico.apellido}</h5>
                                <h6 class="card-subtitle mb-3 text-primary fw-semibold">${especialidadesText}</h6>
                                <p class="card-text text-muted small mb-3 flex-grow-1" style="min-height: 40px;">${coberturasText}</p>
                                <div class="bg-light rounded p-2 mb-3 text-start">
                                    ${horariosHtml}
                                </div>
                                <button class="btn btn-primary rounded-pill w-100 mt-auto fw-semibold py-2" onclick="agendarTurno(${medico.id})">
                                    Agendar Turno
                                </button>
                            </div>
                        </div>
                    `;
                    resultsContainer.appendChild(col);
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
    // Redirigir al Asistente Público
    window.location.href = 'agendar.php?medico_id=' + medicoId;
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
