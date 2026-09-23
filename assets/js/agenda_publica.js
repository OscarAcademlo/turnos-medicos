let medicosGlobal = [];
window.medicosGlobal = medicosGlobal;

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
                medicosGlobal = medicos || [];
                window.medicosGlobal = medicosGlobal;
                
                if (!medicos || medicos.length === 0) {
                    resultsContainer.innerHTML = `<div class="alert alert-info text-center mt-4">No se encontraron profesionales con esos criterios.</div>`;
                    return;
                }

                medicos.forEach(medico => {
                    const col = document.createElement('div');
                    col.className = 'col-12 col-md-6 col-lg-4 col-xl-3 d-flex';
                    
                    // Especialidades
                    const especialidadesText = medico.especialidades.map(e => e.nombre).join(', ') || 'Medicina General';
                    
                    // Botón Coberturas
                    const cantCoberturas = medico.obras_sociales ? medico.obras_sociales.length : 0;
                    const coberturasBtnHtml = `
                        <button type="button" class="btn btn-outline-primary btn-sm rounded-pill w-100 mb-3 fw-medium" onclick="abrirModalCoberturasPaciente(${medico.id})">
                            <i class="bi bi-shield-check me-1"></i> Ver Coberturas ${cantCoberturas > 0 ? '(' + cantCoberturas + ')' : ''}
                        </button>
                    `;
                    
                    // Horarios (formato 24 hs estricto con Centro de Atención / Sede)
                    let horariosHtml = '';
                    if (medico.horarios && medico.horarios.length > 0) {
                        medico.horarios.forEach(h => {
                            const inicio = h.hora_inicio ? h.hora_inicio.substring(0, 5) : '';
                            const fin = h.hora_fin ? h.hora_fin.substring(0, 5) : '';
                            const sedeTxt = h.unidad_nombre 
                                ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1" style="font-size:0.72rem; font-weight:600;"><i class="bi bi-geo-alt-fill me-1"></i>${h.unidad_nombre}</span>` 
                                : '';
                            horariosHtml += `
                                <div class="small mb-1 d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle">
                                    <span><i class="bi bi-clock me-1 text-primary"></i> <strong>${h.dia_semana}:</strong> ${inicio} a ${fin} hs</span>
                                    ${sedeTxt}
                                </div>`;
                        });
                    } else {
                        horariosHtml = `<div class="text-muted small py-1"><i class="bi bi-calendar-x me-1"></i> Sin horarios cargados</div>`;
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
                                ${coberturasBtnHtml}
                                <div class="bg-light rounded-3 p-2 mb-3 text-start" style="max-height: 140px; overflow-y: auto;">
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
    window.location.href = 'agendar.php?medico_id=' + medicoId;
};

function renderizarListaCoberturasModal(med, listContainer) {
    if (med.obras_sociales && med.obras_sociales.length > 0) {
        let itemsHtml = '<h6 class="fw-bold text-muted small text-uppercase mb-2">Coberturas y Obras Sociales Aceptadas:</h6>';
        itemsHtml += '<div class="list-group list-group-flush border rounded-3 p-2 bg-light" style="max-height: 280px; overflow-y: auto;">';
        med.obras_sociales.forEach(os => {
            itemsHtml += `
                <div class="list-group-item bg-transparent d-flex align-items-center py-2 border-0">
                    <i class="bi bi-shield-check text-success fs-5 me-2"></i>
                    <span class="fw-medium text-dark">${os.nombre}</span>
                </div>
            `;
        });
        itemsHtml += '</div>';
        itemsHtml += '<p class="text-muted small mt-2 mb-0"><i class="bi bi-info-circle me-1"></i> Puedes seleccionar tu cobertura al agendar el turno.</p>';
        listContainer.innerHTML = itemsHtml;
    } else {
        listContainer.innerHTML = `
            <div class="alert alert-info border-0 rounded-3 mb-0">
                <div class="d-flex align-items-start">
                    <i class="bi bi-info-circle-fill fs-4 me-2 text-primary"></i>
                    <div>
                        <strong class="text-dark">Atención Particular</strong>
                        <p class="small text-muted mb-0">Este profesional actualmente no tiene convenios de obras sociales directos cargados o atiende de forma particular. Puedes solicitar factura para reintegro.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Modal de Coberturas para el Paciente
window.abrirModalCoberturasPaciente = function(medicoId) {
    const listContainer = document.getElementById('modal-coberturas-paciente-list');
    const infoContainer = document.getElementById('modal-coberturas-paciente-medico-info');
    const btnAgendar = document.getElementById('modal-coberturas-paciente-btn-agendar');

    let med = (window.medicosGlobal || []).find(m => m.id == medicoId);

    // Si ya tenemos los datos en memoria, mostramos inmediatamente
    if (med) {
        const avatarDefault = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(med.nombre + ' ' + med.apellido) + '&background=e9ecef&color=6c757d&size=200';
        const foto = (med.foto_perfil && med.foto_perfil.trim() !== '') ? med.foto_perfil : (med.foto_url || avatarDefault);

        infoContainer.innerHTML = `
            <img src="${foto}" class="rounded-circle shadow-sm mb-2" style="width: 80px; height: 80px; object-fit: cover;" onerror="this.onerror=null; this.src='${avatarDefault}';">
            <h5 class="fw-bold mb-0">${med.nombre} ${med.apellido}</h5>
            <small class="text-primary fw-semibold">${(med.especialidades || []).map(e => e.nombre).join(', ') || 'Medicina General'}</small>
        `;
        renderizarListaCoberturasModal(med, listContainer);
        btnAgendar.onclick = function() {
            window.location.href = 'agendar.php?medico_id=' + med.id;
        };
    } else {
        listContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                <div class="small text-muted mt-2">Cargando coberturas...</div>
            </div>
        `;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCoberturasPaciente'));
    modal.show();

    // Actualización dinámica en tiempo real desde el servidor
    fetch(`backend/api/get_public_agenda.php?medico_id=${medicoId}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                const medActualizado = data[0];
                if (!window.medicosGlobal) window.medicosGlobal = [];
                const idx = window.medicosGlobal.findIndex(m => m.id == medicoId);
                if (idx !== -1) {
                    window.medicosGlobal[idx] = medActualizado;
                } else {
                    window.medicosGlobal.push(medActualizado);
                }

                const avatarDefault = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(medActualizado.nombre + ' ' + medActualizado.apellido) + '&background=e9ecef&color=6c757d&size=200';
                const foto = (medActualizado.foto_perfil && medActualizado.foto_perfil.trim() !== '') ? medActualizado.foto_perfil : (medActualizado.foto_url || avatarDefault);

                infoContainer.innerHTML = `
                    <img src="${foto}" class="rounded-circle shadow-sm mb-2" style="width: 80px; height: 80px; object-fit: cover;" onerror="this.onerror=null; this.src='${avatarDefault}';">
                    <h5 class="fw-bold mb-0">${medActualizado.nombre} ${medActualizado.apellido}</h5>
                    <small class="text-primary fw-semibold">${(medActualizado.especialidades || []).map(e => e.nombre).join(', ') || 'Medicina General'}</small>
                `;

                renderizarListaCoberturasModal(medActualizado, listContainer);

                btnAgendar.onclick = function() {
                    window.location.href = 'agendar.php?medico_id=' + medActualizado.id;
                };
            }
        })
        .catch(err => {
            console.error('Error al actualizar coberturas dinámicamente:', err);
        });
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
