document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user');
    
    // Verificar si el usuario tiene datos básicos locales
    if(!userJson) {
        window.location.href = 'login.php';
        return;
    }

    // Variable global para usar en la vista
    let user = JSON.parse(userJson);

    // Consultar al servidor por los datos MÁS RECIENTES (incluyendo el rol actualizado)
    fetch('backend/api/me.php')
        .then(res => {
            if(!res.ok) throw new Error('Sesión inválida');
            return res.json();
        })
        .then(data => {
            user = data.user;
            // Actualizar localStorage con el nuevo rol
            localStorage.setItem('user', JSON.stringify(user));
            
            // Setear datos en la UI
            document.getElementById('user-name-display').textContent = user.nombre;

            // Revisar si hay un turno pendiente tras iniciar sesión
            const turnoPendiente = localStorage.getItem('turno_pendiente');
            if (turnoPendiente) {
                const wizardData = JSON.parse(turnoPendiente);
                
                // Realizar POST a save_turno.php
                fetch('backend/api/save_turno.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        medico_id: wizardData.medicoId,
                        especialidad_id: wizardData.especialidadId,
                        cobertura_id: wizardData.coberturaId === 'particular' ? null : wizardData.coberturaId,
                        plan_id: wizardData.planId || null,
                        fecha: wizardData.fecha,
                        hora: wizardData.hora
                    })
                })
                .then(res => res.json())
                .then(saveRes => {
                    alert(`¡Turno reservado exitosamente!\n\nMédico: ${wizardData.medicoNombre}\nEspecialidad: ${wizardData.especialidadNombre}\nFecha: ${wizardData.fecha}\nHora: ${wizardData.hora}\nCobertura: ${wizardData.coberturaNombre} ${wizardData.planNombre ? '- '+wizardData.planNombre : ''}`);
                    localStorage.removeItem('turno_pendiente');
                    setTimeout(() => document.getElementById('menu-turnos').click(), 500);
                })
                .catch(err => {
                    console.error("Error guardando turno", err);
                    alert("Ocurrió un error guardando el turno. Intenta de nuevo.");
                });
            }


            
            document.getElementById('user-role-display').textContent = user.rol.toUpperCase();

            // Mostrar menús restringidos según el rol real de la BD
            if(user.rol === 'superadmin' || user.rol === 'admin' || user.rol === 'recepcionista') {
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => el.classList.remove('d-none'));
            }
        })
        .catch(() => {
            // Si la sesión en PHP expiró, forzamos logout
            localStorage.removeItem('user');
            window.location.href = 'login.php';
        });

    const menuDashboard = document.getElementById('menu-dashboard');
    const menuUsuarios = document.getElementById('menu-usuarios');
    const menuObras = document.getElementById('menu-obras');
    const menuAgendaAdmin = document.getElementById('menu-agenda-admin');
    const menuMedicos = document.getElementById('menu-medicos');
    const menuTurnos = document.getElementById('menu-turnos');
    const menuConfiguracion = document.getElementById('menu-configuracion');
    
    const contentDashboard = document.getElementById('content-dashboard');
    const contentUsuarios = document.getElementById('content-usuarios');
    const contentObras = document.getElementById('content-obras');
    const contentAgendaAdmin = document.getElementById('content-agenda-admin');
    const contentMedicos = document.getElementById('content-medicos');
    const contentTurnos = document.getElementById('content-turnos');
    const contentConfiguracion = document.getElementById('content-configuracion');

    // Función auxiliar para cambiar vistas
    function mostrarVista(vistaActiva, menuActivo, titulo) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if(menuActivo) menuActivo.classList.add('active');
        
        contentDashboard.classList.add('d-none');
        if(contentUsuarios) contentUsuarios.classList.add('d-none');
        if(contentObras) contentObras.classList.add('d-none');
        if(contentAgendaAdmin) contentAgendaAdmin.classList.add('d-none');
        if(contentMedicos) contentMedicos.classList.add('d-none');
        if(contentTurnos) contentTurnos.classList.add('d-none');
        if(contentConfiguracion) contentConfiguracion.classList.add('d-none');
        
        if(vistaActiva) vistaActiva.classList.remove('d-none');
        document.getElementById('page-title').textContent = titulo || 'Clínica Médica';
    }

    // Lógica de Vistas (Navegación Sidebar)
    menuDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        mostrarVista(contentDashboard, menuDashboard, `Bienvenido, ${user.nombre}`);
    });

    if(menuUsuarios) {
        menuUsuarios.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentUsuarios, menuUsuarios, 'Gestión de Usuarios');
            cargarUsuarios();
            cargarEspecialidades();
        });
    }

    if(menuObras) {
        menuObras.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentObras, menuObras, 'Obras Sociales');
            cargarObrasSociales();
        });
    }

    if(menuAgendaAdmin) {
        menuAgendaAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentAgendaAdmin, menuAgendaAdmin, 'Agenda y Horarios');
        });
    }

    if(menuMedicos) {
        menuMedicos.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentMedicos, menuMedicos, 'Gestión de Médicos');
            cargarMedicosAdmin();
            cargarSedes(); // Necesario para el modal de Horarios
        });
    }

    if(menuConfiguracion) {
        menuConfiguracion.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentConfiguracion, menuConfiguracion, 'Configuración del Sistema');
            cargarConfiguracion();
            cargarSedes();
        });
    }

    if(menuTurnos) {
        menuTurnos.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVista(contentTurnos, menuTurnos, 'Mis Turnos');
            cargarMisTurnos();
        });
    }

    // Lógica Cerrar Sesión
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        try {
            fetch('backend/api/logout.php').catch(() => {});
        } catch(err) {}

        localStorage.removeItem('user');
        localStorage.removeItem('turno_pendiente');

        if (typeof auth !== 'undefined' && auth && auth.signOut) {
            auth.signOut().then(() => {
                window.location.href = 'index.php';
            }).catch(() => {
                window.location.href = 'index.php';
            });
        } else {
            window.location.href = 'index.php';
        }
    });

    // Carga inicial del contador y datos de apoyo
    cargarMisTurnos();
    cargarSedes();
});

function cargarMisTurnos() {
    const container = document.getElementById('mis-turnos-container');
    container.innerHTML = `
        <div class="text-center text-muted py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando tus turnos...</p>
        </div>
    `;

    fetch('backend/api/get_mis_turnos.php')
        .then(res => res.json())
        .then(data => {
            const contadorEl = document.getElementById('contador-proximos-turnos');
            if (contadorEl) {
                const cant = (data && Array.isArray(data)) ? data.filter(t => t.estado !== 'cancelado').length : 0;
                contadorEl.textContent = cant;
            }

            if(!data || data.length === 0 || data.message) {
                container.innerHTML = `
                    <div class="alert alert-info rounded-4 shadow-sm border-0 d-flex align-items-center" role="alert">
                        <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                        <div>Todavía no hay turnos programados. Haz clic en "Solicitar Turno" para agendar uno.</div>
                    </div>
                `;
                return;
            }

            let html = '<div class="row g-4">';
            data.forEach(turno => {
                // Formatear fecha (YYYY-MM-DD a DD/MM/YYYY)
                const partes = turno.fecha.split('-');
                const fechaFormat = `${partes[2]}/${partes[1]}/${partes[0]}`;
                
                // Formatear hora (HH:MM:SS a HH:MM)
                const horaFormat = turno.hora_inicio.substring(0, 5);

                let badgeColor = 'bg-warning';
                if(turno.estado === 'confirmado') badgeColor = 'bg-success';
                if(turno.estado === 'cancelado') badgeColor = 'bg-danger';

                let coberturaText = 'Particular';
                if(turno.obra_social_nombre) {
                    coberturaText = turno.obra_social_nombre;
                    if(turno.plan_nombre) coberturaText += ' - ' + turno.plan_nombre;
                }

                const pacienteInfo = turno.paciente_nombre ? `
                    <div class="mb-2 text-primary small">
                        <i class="bi bi-person-fill me-1"></i> Paciente: <strong>${turno.paciente_nombre} ${turno.paciente_apellido || ''}</strong>
                    </div>
                ` : '';

                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h5 class="fw-bold mb-0 text-primary">
                                        <i class="bi bi-calendar-check me-2"></i>${fechaFormat}
                                    </h5>
                                    <span class="badge ${badgeColor} rounded-pill px-3 py-2 text-uppercase" style="font-size: 0.7rem;">
                                        ${turno.estado}
                                    </span>
                                </div>
                                
                                <div class="fs-4 fw-light mb-3">
                                    <i class="bi bi-clock me-2 text-muted fs-5"></i>${horaFormat} hs
                                </div>
                                
                                <hr class="opacity-10 my-3">
                                
                                ${pacienteInfo}

                                <div class="mb-2">
                                    <i class="bi bi-person-badge text-muted me-2"></i>
                                    <span class="fw-semibold">Dr/a. ${turno.medico_nombre} ${turno.medico_apellido}</span>
                                </div>
                                
                                <div class="mb-2">
                                    <i class="bi bi-heart-pulse text-muted me-2"></i>
                                    <span>${turno.especialidad_nombre}</span>
                                </div>

                                ${turno.sede_nombre ? `
                                <div class="mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    <span class="text-primary fw-medium small">${turno.sede_nombre}${turno.sede_calle ? ' (' + turno.sede_calle + (turno.sede_numero ? ' ' + turno.sede_numero : '') + ')' : ''}</span>
                                </div>` : ''}
                                
                                <div>
                                    <i class="bi bi-shield-check text-muted me-2"></i>
                                    <span class="text-muted small">${coberturaText}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(err => {
            console.error("Error al cargar mis turnos:", err);
            container.innerHTML = `
                <div class="alert alert-danger rounded-4 shadow-sm border-0 d-flex align-items-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                    <div>Ocurrió un error al cargar tus turnos.</div>
                </div>
            `;
        });
}

let usuariosDisponibles = [];
let especialidadesDisponibles = [];
let sedesDisponibles = [];

// Función para cargar usuarios desde la base de datos
function cargarUsuarios() {
    const user = JSON.parse(localStorage.getItem('user'));
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr>';

    fetch('backend/api/get_users.php')
        .then(res => res.json())
        .then(data => {
            if(data.usuarios) {
                usuariosDisponibles = data.usuarios;
                renderUsuarios(usuariosDisponibles);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${data.message || 'Error al cargar'}</td></tr>`;
            }
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error de conexión</td></tr>`;
        });
}

function renderUsuarios(usuarios) {
    const user = JSON.parse(localStorage.getItem('user'));
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = '';
    
    if(usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron usuarios.</td></tr>';
        return;
    }

    usuarios.forEach(u => {
        // Solo SuperAdmin puede cambiar roles y no a sí mismo
        const puedeCambiarRol = user.rol === 'superadmin' && u.id !== user.id;
        
        let rolHtml = '';
        if(puedeCambiarRol) {
            rolHtml = `
                <select class="form-select form-select-sm" style="width: auto;" onchange="cambiarRol(${u.id}, this.value)">
                    <option value="paciente" ${u.rol==='paciente'?'selected':''}>Paciente</option>
                    <option value="medico" ${u.rol==='medico'?'selected':''}>Médico</option>
                    <option value="recepcionista" ${u.rol==='recepcionista'?'selected':''}>Recepcionista</option>
                    <option value="admin" ${u.rol==='admin'?'selected':''}>Administrador</option>
                    <option value="superadmin" ${u.rol==='superadmin'?'selected':''}>SuperAdmin</option>
                </select>
            `;
        } else {
            rolHtml = `<span class="badge bg-secondary">${u.rol.toUpperCase()}</span>`;
        }

        const espBadge = u.especialidad_nombre ? `<span class="badge bg-info text-dark ms-2">${u.especialidad_nombre}</span>` : '';

        const row = `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-weight: bold;">
                            ${u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-bold">${u.nombre} ${espBadge}</div>
                            <div class="text-muted small">ID: ${u.id}</div>
                        </div>
                    </div>
                </td>
                <td>${u.email}</td>
                <td>${rolHtml}</td>
                <td class="pe-4">
                    <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="borrarUsuario(${u.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filtrarUsuarios() {
    const searchVal = document.getElementById('search-usuarios').value.toLowerCase();
    const rolVal = document.getElementById('filter-rol-usuarios').value;

    const filtrados = usuariosDisponibles.filter(u => {
        const matchesSearch = u.nombre.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
        let matchesRol = true;
        
        if (rolVal !== 'todos') {
            if (rolVal.startsWith('esp_')) {
                const espId = rolVal.split('_')[1];
                matchesRol = (u.rol === 'medico' && u.especialidad_id == espId);
            } else if (rolVal === 'medico') {
                matchesRol = (u.rol === 'medico');
            } else {
                matchesRol = (u.rol === rolVal);
            }
        }
        
        return matchesSearch && matchesRol;
    });

    renderUsuarios(filtrados);
}

document.getElementById('search-usuarios')?.addEventListener('input', filtrarUsuarios);
document.getElementById('filter-rol-usuarios')?.addEventListener('change', filtrarUsuarios);

function borrarUsuario(id) {
    if(!confirm('¿Estás seguro de eliminar este usuario?')) return;
    // Falta implementar API de borrar usuario, simulamos por ahora
    alert("Función eliminar usuario en desarrollo.");
}

// ==========================================
// GESTIÓN DE ESPECIALIDADES (CATEGORÍAS)
// ==========================================
function cargarEspecialidades() {
    fetch('backend/api/get_especialidades.php')
        .then(res => res.json())
        .then(data => {
            especialidadesDisponibles = data;
            const tbody = document.getElementById('tabla-especialidades');
            const selectFilter = document.getElementById('filter-especialidades-opts');
            
            tbody.innerHTML = '';
            
            // Llenar tabla de modal
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No hay categorías.</td></tr>';
            } else {
                data.forEach(esp => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${esp.nombre}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger" onclick="borrarEspecialidad(${esp.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            // Llenar select de filtro de usuarios
            if(selectFilter) {
                selectFilter.innerHTML = '<option value="medico">Todos los Médicos</option>';
                data.forEach(esp => {
                    selectFilter.innerHTML += `<option value="esp_${esp.id}">${esp.nombre}</option>`;
                });
            }
        });
}

document.getElementById('form-crear-especialidad')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('new-especialidad-nombre').value;
    
    fetch('backend/api/crud_especialidades.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nombre })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById('new-especialidad-nombre').value = '';
        cargarEspecialidades();
        cargarUsuarios(); // Refrescar por si impacta algo
    })
    .catch(err => alert('Error al crear especialidad'));
});

function borrarEspecialidad(id) {
    if(!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    
    fetch('backend/api/crud_especialidades.php', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        cargarEspecialidades();
    })
    .catch(err => alert('Error al eliminar'));
}

function cambiarRol(userId, nuevoRol) {
    if(!confirm(`¿Estás seguro de cambiar el rol a ${nuevoRol}?`)) {
        cargarUsuarios(); // revertir visualmente
        return;
    }
    
    fetch('backend/api/update_user_role.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId, nuevo_rol: nuevoRol })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        cargarUsuarios();
    })
    .catch(err => {
        alert("Error al cambiar rol.");
        cargarUsuarios();
    });
}

// --- Nuevas Funciones Administrativas ---

function crearPersonal() {
    const btn = document.querySelector('#modalCrearUsuario .btn-primary');
    btn.disabled = true;
    
    const data = {
        nombre: document.getElementById('new-nombre').value,
        email: document.getElementById('new-email').value,
        rol: document.getElementById('new-rol').value,
        password: document.getElementById('new-password').value
    };

    if(!data.nombre || !data.email || !data.rol || !data.password) {
        alert("Todos los campos son obligatorios");
        btn.disabled = false;
        return;
    }

    fetch('backend/api/admin_create_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if(data.message.includes('exitosamente')) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario'));
            modal.hide();
            document.getElementById('form-crear-personal').reset();
            cargarUsuarios();
        }
    })
    .catch(err => alert("Error de conexión"))
    .finally(() => btn.disabled = false);
}

function cargarObrasSociales() {
    const tbody = document.getElementById('tabla-obras');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Cargando...</td></tr>';
    
    fetch('backend/api/crud_obras_sociales.php')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if(data.length > 0) {
                let html = '';
                data.forEach(obra => {
                    html += `
                        <tr>
                            <td class="ps-4 fw-bold text-muted">#${obra.id}</td>
                            <td>${obra.nombre}</td>
                            <td class="pe-4 text-end">
                                <button class="btn btn-sm btn-outline-info rounded-pill px-3 me-2" onclick="abrirGestionPlanes(${obra.id}, '${obra.nombre.replace(/'/g, "\\'")}')"><i class="bi bi-card-list"></i> Planes</button>
                                <button class="btn btn-sm btn-outline-primary rounded-circle"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger rounded-circle"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
                
                // Initialize DataTables
                if ($.fn.DataTable.isDataTable('#obras-table')) {
                    $('#obras-table').DataTable().destroy();
                }
                $('#obras-table').DataTable({
                    language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                    pageLength: 10
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">No hay obras sociales cargadas.</td></tr>';
            }
        })
        .catch(err => {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-danger">Error de conexión</td></tr>';
        });
}

// --- Lógica del Paciente (Solicitar Turno - UX Rediseñada) ---
const modalTurno = document.getElementById('modalNuevoTurno');
if(modalTurno) {
    modalTurno.addEventListener('show.bs.modal', () => {
        // Reset state
        document.getElementById('step-2').classList.add('d-none');
        document.getElementById('step-3').classList.add('d-none');
        document.getElementById('btn-confirmar-turno').classList.add('d-none');
        document.getElementById('turno-plan').value = '';
        document.getElementById('turno-fecha').value = '';
        document.getElementById('turno-hora').value = '';
        document.getElementById('planes-container').innerHTML = '';
        document.getElementById('dias-container').innerHTML = '';
        document.getElementById('horarios-list').innerHTML = '';
        
        // Cargar Especialidades
        fetch('backend/api/get_especialidades.php')
            .then(res => res.json())
            .then(data => {
                const sel = document.getElementById('turno-especialidad');
                sel.innerHTML = '<option value="" selected disabled>Selecciona especialidad...</option>';
                data.forEach(e => {
                    sel.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
                });
            });

        // No cargar Obras Sociales hasta elegir médico para filtrar (opcional), 
        // pero por ahora cargamos todas o las permitidas por el médico
        fetch('backend/api/crud_obras_sociales.php')
            .then(res => res.json())
            .then(data => {
                const sel = document.getElementById('turno-obra-social');
                sel.innerHTML = '<option value="" selected disabled>Selecciona tu cobertura médica...</option>';
                sel.innerHTML += '<option value="particular">Particular (Sin Obra Social)</option>';
                data.forEach(o => {
                    sel.innerHTML += `<option value="${o.id}">${o.nombre}</option>`;
                });
            });
    });

    // Cambio de Especialidad -> Cargar Médicos
    document.getElementById('turno-especialidad').addEventListener('change', (e) => {
        const espId = e.target.value;
        const medicoSel = document.getElementById('turno-medico');
        medicoSel.disabled = true;
        medicoSel.innerHTML = '<option value="" selected disabled>Cargando profesionales...</option>';
        
        fetch(`backend/api/get_medicos.php?especialidad_id=${espId}`)
            .then(res => res.json())
            .then(data => {
                medicoSel.innerHTML = '<option value="" selected disabled>Selecciona un profesional...</option>';
                if(data.length > 0) {
                    data.forEach(m => {
                        const fullName = m.apellido ? `${m.nombre} ${m.apellido}` : m.nombre;
                        medicoSel.innerHTML += `<option value="${m.id}">${fullName}</option>`;
                    });
                    medicoSel.disabled = false;
                } else {
                    medicoSel.innerHTML = '<option value="" selected disabled>No hay profesionales disponibles.</option>';
                }
            });
    });

    // Cambio de Médico -> Mostrar Paso 2
    document.getElementById('turno-medico').addEventListener('change', (e) => {
        document.getElementById('step-2').classList.remove('d-none');
        document.getElementById('turno-obra-social').value = '';
        document.getElementById('planes-container').classList.add('d-none');
        document.getElementById('step-3').classList.add('d-none');
    });
            
    // Cambio de Obra Social -> Cargar Planes (Pills)
    document.getElementById('turno-obra-social').addEventListener('change', (e) => {
        const osId = e.target.value;
        const planesContainer = document.getElementById('planes-container');
        const inputPlan = document.getElementById('turno-plan');
        
        planesContainer.innerHTML = '';
        planesContainer.classList.remove('d-none');
        inputPlan.value = '';
        document.getElementById('step-3').classList.add('d-none');
        
        if (osId === 'particular') {
            inputPlan.value = 'particular';
            renderPill(planesContainer, 'Particular', 'particular', inputPlan, () => showStep3());
            return;
        }
        
        planesContainer.innerHTML = '<span class="text-muted small spinner-border spinner-border-sm"></span>';
        
        fetch(`backend/api/get_planes.php?obra_social_id=${osId}`)
            .then(res => res.json())
            .then(data => {
                planesContainer.innerHTML = '';
                if(data.length > 0) {
                    data.forEach(p => {
                        renderPill(planesContainer, p.nombre, p.id, inputPlan, () => showStep3());
                    });
                } else {
                    inputPlan.value = 'unico';
                    renderPill(planesContainer, 'Plan Único', 'unico', inputPlan, () => showStep3());
                }
            });
    });

    // Renderiza un botón píldora simple y maneja su estado activo
    function renderPill(container, label, value, hiddenInput, onClickCallback = null) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill-btn';
        if (hiddenInput.value == value) btn.classList.add('active');
        btn.textContent = label;
        btn.dataset.value = value;
        
        btn.addEventListener('click', () => {
            // Deseleccionar hermanos
            container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hiddenInput.value = value;
            if(onClickCallback) onClickCallback(value);
        });
        
        container.appendChild(btn);
    }

    // Mostrar Paso 3 (Calendario) y renderizar Días simulados
    function showStep3() {
        document.getElementById('step-3').classList.remove('d-none');
        const diasContainer = document.getElementById('dias-container');
        const inputFecha = document.getElementById('turno-fecha');
        diasContainer.innerHTML = '';
        inputFecha.value = '';
        
        // Simular próximos 14 días
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const hoy = new Date();
        
        for(let i = 1; i <= 14; i++) {
            const d = new Date();
            d.setDate(hoy.getDate() + i);
            
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const slots = isWeekend ? 0 : Math.floor(Math.random() * 8) + 2; // de 2 a 9 turnos en la semana
            
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `pill-btn calendar-pill ${slots === 0 ? 'disabled' : ''}`;
            if(slots === 0) btn.disabled = true;
            
            const diaNombre = diasSemana[d.getDay()];
            const diaNum = d.getDate();
            const dateStr = d.toISOString().split('T')[0];
            
            btn.innerHTML = `
                <span class="pill-date">${diaNombre} ${diaNum}</span>
                <span class="pill-slots">${slots === 0 ? '(sin horarios)' : `(${slots} horarios)`}</span>
            `;
            
            if(slots > 0) {
                btn.addEventListener('click', () => {
                    diasContainer.querySelectorAll('.calendar-pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    inputFecha.value = dateStr;
                    showHorarios(slots);
                });
            }
            diasContainer.appendChild(btn);
        }
    }

    // Mostrar las horas para un día seleccionado
    function showHorarios(numSlots) {
        const c = document.getElementById('horarios-container');
        const list = document.getElementById('horarios-list');
        const inputHora = document.getElementById('turno-hora');
        const btnSubmit = document.getElementById('btn-confirmar-turno');
        
        c.classList.remove('d-none');
        list.innerHTML = '';
        inputHora.value = '';
        btnSubmit.classList.add('d-none');
        
        let horaBase = 9; // Empiezan 9 AM
        for(let i=0; i<numSlots; i++) {
            const h = horaBase + Math.floor(i/2);
            const m = (i%2 === 0) ? '00' : '30';
            const horaStr = `${h.toString().padStart(2, '0')}:${m}`;
            
            renderPill(list, horaStr, horaStr, inputHora, () => {
                btnSubmit.classList.remove('d-none'); // Mostrar botón confirmar
            });
        }
    }
}

// --- Gestión de Planes por Obra Social ---
function abrirGestionPlanes(obraSocialId, obraSocialNombre) {
    document.getElementById('gestion-plan-os-id').value = obraSocialId;
    document.getElementById('modalGestionPlanesTitle').textContent = `Planes de: ${obraSocialNombre}`;
    cargarPlanesAdmin(obraSocialId);
    const modal = new bootstrap.Modal(document.getElementById('modalGestionPlanes'));
    modal.show();
}

function cargarPlanesAdmin(obraSocialId) {
    const tbody = document.getElementById('tabla-planes');
    tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3 text-muted">Cargando planes...</td></tr>';
    
    fetch(`backend/api/crud_planes.php?obra_social_id=${obraSocialId}`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if(data.length > 0) {
                data.forEach(p => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${p.nombre}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="eliminarPlan(${p.id})"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3 text-muted">No hay planes para esta obra social.</td></tr>';
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3 text-danger">Error al cargar planes.</td></tr>';
        });
}

document.getElementById('form-crear-plan').addEventListener('submit', function(e) {
    e.preventDefault();
    const osId = document.getElementById('gestion-plan-os-id').value;
    const nombre = document.getElementById('new-plan-nombre').value;
    const btn = this.querySelector('button[type="submit"]');
    
    btn.disabled = true;
    
    fetch('backend/api/crud_planes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obra_social_id: osId, nombre: nombre })
    })
    .then(res => res.json())
    .then(data => {
        if(data.message.includes('exitosamente')) {
            document.getElementById('new-plan-nombre').value = '';
            cargarPlanesAdmin(osId);
        } else {
            alert(data.message || 'Error al crear plan');
        }
    })
    .catch(() => alert('Error de conexión'))
    .finally(() => btn.disabled = false);
});

function eliminarPlan(id) {
    if(!confirm('¿Estás seguro de eliminar este plan?')) return;
    
    const osId = document.getElementById('gestion-plan-os-id').value;
    
    fetch('backend/api/crud_planes.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        cargarPlanesAdmin(osId);
    })
    .catch(() => alert('Error de conexión'));
}

// ==========================================
// CONFIGURACIÓN
// ==========================================
function cargarConfiguracion() {
    fetch('backend/api/config.php')
        .then(res => res.json())
        .then(data => {
            document.getElementById('config-meses').value = data.meses_agenda || 3;
        })
        .catch(err => console.error("Error cargando config", err));
}

document.getElementById('form-configuracion').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const meses = document.getElementById('config-meses').value;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
    
    fetch('backend/api/config.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meses_agenda: meses })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
    })
    .catch(() => alert('Error de conexión'))
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Guardar Configuración';
    });
});

// ==========================================
// CRUD MÉDICOS
// ==========================================
let medicosDisponibles = [];
let obrasSocialesDisponibles = [];

function cargarMedicosAdmin() {
    const container = document.getElementById('medicos-container');
    container.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Cargando médicos...</p>
        </div>
    `;

    // Cargar médicos, Obras Sociales, Especialidades y Sedes
    Promise.all([
        fetch('backend/api/admin_get_medicos.php').then(res => res.json()),
        fetch('backend/api/get_obras_sociales.php').then(res => res.json()),
        fetch('backend/api/get_especialidades.php').then(res => res.json()),
        fetch('backend/api/crud_unidades.php').then(res => res.json()).catch(() => [])
    ]).then(([medicos, obras, especialidades, sedes]) => {
        medicosDisponibles = medicos;
        obrasSocialesDisponibles = obras;
        especialidadesDisponibles = especialidades || [];
        sedesDisponibles = sedes || [];
        
        renderMedicos(medicosDisponibles);
    }).catch(err => {
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error cargando datos.</div></div>';
    });
}

function renderMedicos(medicos) {
    const container = document.getElementById('medicos-container');
    container.innerHTML = '';
    
    if(medicos.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay médicos que coincidan con la búsqueda.</div></div>';
        return;
    }

    medicos.forEach(med => {
        const fotoHtml = med.foto_perfil
            ? `<img src="${med.foto_perfil}" class="rounded-circle mb-3 object-fit-cover" width="100" height="100" style="border: 3px solid #e9ecef;">`
            : `<div class="rounded-circle mb-3 bg-light d-inline-flex align-items-center justify-content-center" style="width:100px;height:100px;border:3px solid #e9ecef;"><i class="bi bi-person-fill text-secondary" style="font-size:3rem;"></i></div>`;
        
        const horariosResumen = med.horarios && med.horarios.length > 0
            ? med.horarios.map(h => {
                const sede = h.unidad_nombre ? ` • <span class="text-primary fw-semibold">${h.unidad_nombre}</span>` : '';
                return `<div class="badge bg-light text-dark border me-1 mb-1 p-2 text-start d-block" style="font-size:0.78rem; font-weight:normal;">
                    <i class="bi bi-clock text-primary me-1"></i><strong>${h.dia_semana}:</strong> ${h.hora_inicio.slice(0,5)} a ${h.hora_fin.slice(0,5)} hs${sede}
                </div>`;
            }).join('')
            : `<span class="text-muted small">Sin horarios configurados</span>`;
        
        const cantCoberturas = (med.obras_sociales ? med.obras_sociales.length : 0) + (med.planes ? med.planes.length : 0);

        const html = `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-body p-4 text-center">
                        ${fotoHtml}
                        <h5 class="fw-bold mb-1">Dr/a. ${med.nombre} ${med.apellido}</h5>
                        <p class="text-muted small mb-1">${med.especialidad_nombre || 'Sin especialidad'}</p>
                        <p class="text-muted small mb-2">Matrícula: ${med.matricula || 'No especificada'}</p>
                        <div class="mb-3 text-start px-2" style="max-height:130px; overflow-y:auto;">${horariosResumen}</div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="abrirEditMedico(${med.id})">
                                <i class="bi bi-pencil-square me-1"></i> Editar Perfil y Especialidades
                            </button>
                            <button class="btn btn-outline-warning btn-sm rounded-pill" onclick="abrirHorariosMedico(${med.id})">
                                <i class="bi bi-clock me-1"></i> Horarios (${med.horarios ? med.horarios.length : 0})
                            </button>
                            <button class="btn btn-outline-success btn-sm rounded-pill" onclick="abrirCoberturasMedico(${med.id})">
                                <i class="bi bi-shield-check me-1"></i> Coberturas (${cantCoberturas})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Búsqueda de Médicos
document.getElementById('search-medicos')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtrados = medicosDisponibles.filter(m => {
        const nombreCompleto = `${m.nombre} ${m.apellido}`.toLowerCase();
        const especialidad = (m.especialidad_nombre || '').toLowerCase();
        return nombreCompleto.includes(query) || especialidad.includes(query);
    });
    renderMedicos(filtrados);
});

function abrirEditMedico(id) {
    const med = medicosDisponibles.find(m => m.id == id);
    if(!med) return;
    
    document.getElementById('edit-medico-id').value = med.id;
    document.getElementById('edit-medico-nombre').value = med.nombre || '';
    document.getElementById('edit-medico-apellido').value = med.apellido || '';
    document.getElementById('edit-medico-matricula').value = med.matricula || '';
    document.getElementById('edit-medico-direccion').value = med.direccion || '';
    document.getElementById('edit-medico-biografia').value = med.biografia || '';
    document.getElementById('edit-medico-foto').value = '';

    // Llenar select de sedes
    const sedeSelect = document.getElementById('edit-medico-sede-select');
    if (sedeSelect) {
        sedeSelect.innerHTML = '<option value="">-- Seleccionar Sede de Atención (Configuración) --</option>';
        sedesDisponibles.forEach(s => {
            const dir = [s.calle, s.numero].filter(Boolean).join(' ');
            const label = s.nombre + (dir ? ` (${dir})` : '');
            sedeSelect.innerHTML += `<option value="${s.id}">${label}</option>`;
        });
    }
    
    // Especialidades dinámicas
    renderEspecialidadesCheckboxes(med);

    // Manejar foto: mostrar imagen si existe, o placeholder
    const preview = document.getElementById('edit-medico-foto-preview');
    const placeholder = document.getElementById('edit-medico-foto-placeholder');
    if(med.foto_perfil) {
        preview.src = med.foto_perfil;
        preview.classList.remove('d-none');
        placeholder.classList.add('d-none');
    } else {
        preview.src = '';
        preview.classList.add('d-none');
        placeholder.classList.remove('d-none');
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditMedico'));
    modal.show();
}

function renderEspecialidadesCheckboxes(medico) {
    const espContainer = document.getElementById('edit-medico-especialidades-container');
    if (!espContainer) return;
    
    const medEspIds = medico 
        ? (medico.especialidades_ids || (medico.especialidades ? medico.especialidades.map(e => e.id || e.especialidad_id) : []))
        : Array.from(document.querySelectorAll('.check-especialidad-medico:checked')).map(cb => parseInt(cb.value));

    if (!especialidadesDisponibles || especialidadesDisponibles.length === 0) {
        espContainer.innerHTML = '<span class="text-muted small">No hay especialidades configuradas. Puedes agregar una abajo directamente.</span>';
    } else {
        espContainer.innerHTML = especialidadesDisponibles.map(esp => {
            const checked = medEspIds.includes(esp.id) ? 'checked' : '';
            return `
                <div class="form-check mb-1">
                    <input class="form-check-input check-especialidad-medico" type="checkbox" value="${esp.id}" id="edit-esp-${esp.id}" ${checked}>
                    <label class="form-check-label" for="edit-esp-${esp.id}">${esp.nombre}</label>
                </div>
            `;
        }).join('');
    }
}

// Al seleccionar una sede en el perfil del médico
window.seleccionarSedeEnMedico = function(sedeId) {
    if(!sedeId) return;
    const sede = sedesDisponibles.find(s => s.id == sedeId);
    if(sede) {
        const dir = [sede.calle, sede.numero].filter(Boolean).join(' ');
        const loc = sede.localidad ? ` (${sede.localidad})` : '';
        document.getElementById('edit-medico-direccion').value = sede.nombre + (dir ? ` - ${dir}` : '') + loc;
    }
};

// Agregar especialidad rápida desde el modal
window.agregarEspecialidadRapida = function() {
    const input = document.getElementById('nueva-especialidad-rapida');
    const nombre = input.value.trim();
    if(!nombre) {
        alert('Escribe el nombre de la especialidad');
        return;
    }

    fetch('backend/api/crud_especialidades.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    })
    .then(res => res.json())
    .then(data => {
        input.value = '';
        // Recargar especialidades
        return fetch('backend/api/get_especialidades.php').then(r => r.json());
    })
    .then(esps => {
        especialidadesDisponibles = esps;
        // Buscar la nueva especialidad creada
        const creada = esps.find(e => e.nombre.toLowerCase() === nombre.toLowerCase());
        const espContainer = document.getElementById('edit-medico-especialidades-container');
        
        // Renderizar manteniendo las ya seleccionadas + la nueva
        const checksActuales = Array.from(document.querySelectorAll('.check-especialidad-medico:checked')).map(cb => parseInt(cb.value));
        if (creada && !checksActuales.includes(creada.id)) {
            checksActuales.push(creada.id);
        }
        
        espContainer.innerHTML = especialidadesDisponibles.map(esp => {
            const checked = checksActuales.includes(esp.id) ? 'checked' : '';
            return `
                <div class="form-check mb-1">
                    <input class="form-check-input check-especialidad-medico" type="checkbox" value="${esp.id}" id="edit-esp-${esp.id}" ${checked}>
                    <label class="form-check-label" for="edit-esp-${esp.id}">${esp.nombre}</label>
                </div>
            `;
        }).join('');
    })
    .catch(() => alert('Error al agregar especialidad'));
};

// Subida de imagen
document.getElementById('edit-medico-foto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('backend/api/upload_image.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if(data.url) {
            const preview = document.getElementById('edit-medico-foto-preview');
            const placeholder = document.getElementById('edit-medico-foto-placeholder');
            preview.src = data.url;
            preview.setAttribute('data-url-relativa', data.url);
            preview.classList.remove('d-none');
            placeholder.classList.add('d-none');
        } else {
            alert(data.message || 'Error al subir imagen');
        }
    })
    .catch(() => alert('Error de conexión al subir imagen'));
});

// Guardar Perfil Médico
document.getElementById('form-edit-medico').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const preview = document.getElementById('edit-medico-foto-preview');
    let fotoUrl = preview.getAttribute('data-url-relativa') || preview.getAttribute('src') || null;
    if(fotoUrl && fotoUrl.includes('/img/medicos/')) {
        fotoUrl = 'img/medicos/' + fotoUrl.split('/img/medicos/').pop();
    }
    if(preview.classList.contains('d-none')) fotoUrl = null;
    
    const espChecks = document.querySelectorAll('.check-especialidad-medico:checked');
    const especialidadesSeleccionadas = Array.from(espChecks).map(cb => parseInt(cb.value));

    const payload = {
        id: document.getElementById('edit-medico-id').value,
        nombre: document.getElementById('edit-medico-nombre').value,
        apellido: document.getElementById('edit-medico-apellido').value,
        matricula: document.getElementById('edit-medico-matricula').value,
        direccion: document.getElementById('edit-medico-direccion').value,
        biografia: document.getElementById('edit-medico-biografia').value,
        foto_perfil: fotoUrl,
        especialidades: especialidadesSeleccionadas
    };
    
    fetch('backend/api/admin_update_medico.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        preview.removeAttribute('data-url-relativa');
        bootstrap.Modal.getInstance(document.getElementById('modalEditMedico')).hide();
        cargarMedicosAdmin();
    })
    .catch(() => alert('Error de conexión'))
    .finally(() => btn.disabled = false);
});

// Modal de Coberturas
function abrirCoberturasMedico(id) {
    const med = medicosDisponibles.find(m => m.id == id);
    if(!med) return;
    
    document.getElementById('coberturas-medico-id').value = med.id;
    const container = document.getElementById('coberturas-list-container');
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary spinner-border-sm"></div></div>';
    
    const planesMed = med.planes || [];
    const obrasMed = med.obras_sociales || [];
    
    let html = '';
    obrasSocialesDisponibles.forEach(os => {
        const tienePlanes = os.planes && os.planes.length > 0;
        const osChecked = obrasMed.includes(os.id) || (tienePlanes && os.planes.some(p => planesMed.includes(p.id)));
        
        html += `
            <div class="card mb-3 border-0 shadow-sm rounded-3">
                <div class="card-header bg-light border-0 d-flex justify-content-between align-items-center">
                    <div class="form-check mb-0">
                        <input class="form-check-input check-os-medico" type="checkbox" value="${os.id}" id="os-check-${os.id}" ${osChecked ? 'checked' : ''} onchange="togglePlanesOS(${os.id}, this.checked)">
                        <label class="form-check-label fw-bold" for="os-check-${os.id}">${os.nombre}</label>
                    </div>
                    ${tienePlanes ? `<span class="badge bg-white text-secondary border small">${os.planes.length} planes</span>` : '<span class="badge bg-secondary-subtle text-secondary small">Convenio directo</span>'}
                </div>
        `;
        
        if (tienePlanes) {
            html += `<div class="card-body py-2 ps-4" id="planes-os-${os.id}">`;
            os.planes.forEach(plan => {
                const planChecked = planesMed.includes(plan.id);
                html += `
                    <div class="form-check mb-1">
                        <input class="form-check-input check-plan-medico plan-de-os-${os.id}" type="checkbox" value="${plan.id}" data-os-id="${os.id}" id="plan-${plan.id}" ${planChecked ? 'checked' : ''} onchange="syncOSFromPlan(${os.id})">
                        <label class="form-check-label small" for="plan-${plan.id}">
                            ${plan.nombre}
                        </label>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('modalCoberturasMedico'));
    modal.show();
}

window.togglePlanesOS = function(osId, isChecked) {
    const planChecks = document.querySelectorAll(`.plan-de-os-${osId}`);
    planChecks.forEach(cb => { cb.checked = isChecked; });
};

window.syncOSFromPlan = function(osId) {
    const planChecks = document.querySelectorAll(`.plan-de-os-${osId}`);
    const anyChecked = Array.from(planChecks).some(cb => cb.checked);
    const osCheck = document.getElementById(`os-check-${osId}`);
    if (osCheck && anyChecked) {
        osCheck.checked = true;
    }
};

// Guardar Coberturas
document.getElementById('form-coberturas-medico').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const usuarioId = document.getElementById('coberturas-medico-id').value;
    const osCheckboxes = document.querySelectorAll('.check-os-medico:checked');
    const obrasSeleccionadas = Array.from(osCheckboxes).map(cb => parseInt(cb.value));

    const planCheckboxes = document.querySelectorAll('.check-plan-medico:checked');
    const planesSeleccionados = Array.from(planCheckboxes).map(cb => parseInt(cb.value));
    
    fetch('backend/api/admin_update_medico_coberturas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: usuarioId,
            obras_sociales: obrasSeleccionadas,
            planes: planesSeleccionados
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        bootstrap.Modal.getInstance(document.getElementById('modalCoberturasMedico')).hide();
        cargarMedicosAdmin();
    })
    .catch(() => alert('Error de conexión'))
    .finally(() => btn.disabled = false);
});

// ==========================================
// SEDES / UNIDADES DE ATENCIÓN
// ==========================================

function cargarSedes() {
    fetch('backend/api/crud_unidades.php')
        .then(res => res.json())
        .then(data => {
            sedesDisponibles = data;
            renderSedes(data);
        })
        .catch(() => {
            document.getElementById('tabla-sedes').innerHTML =
                '<tr><td colspan="4" class="text-center text-danger">Error al cargar sedes.</td></tr>';
        });
}

function renderSedes(sedes) {
    const tbody = document.getElementById('tabla-sedes');
    if(!tbody) return;
    tbody.innerHTML = '';

    if(sedes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay sedes registradas.</td></tr>';
        return;
    }

    sedes.forEach(s => {
        const dir = [s.calle, s.numero].filter(Boolean).join(' ') || '—';
        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold">${s.nombre}</td>
                <td>${dir}</td>
                <td>${s.localidad || '—'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalSede(${s.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="borrarSede(${s.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function abrirModalSede(id) {
    const sede = id ? sedesDisponibles.find(s => s.id == id) : null;
    document.getElementById('modalSedeTitle').textContent = sede ? 'Editar Sede' : 'Nueva Sede';
    document.getElementById('sede-id').value = sede ? sede.id : '';
    document.getElementById('sede-nombre').value = sede ? sede.nombre : '';
    document.getElementById('sede-calle').value = sede ? (sede.calle || '') : '';
    document.getElementById('sede-numero').value = sede ? (sede.numero || '') : '';
    document.getElementById('sede-localidad').value = sede ? (sede.localidad || '') : '';
    new bootstrap.Modal(document.getElementById('modalSede')).show();
}

document.getElementById('form-sede').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;

    const payload = {
        id: document.getElementById('sede-id').value || null,
        nombre: document.getElementById('sede-nombre').value,
        calle: document.getElementById('sede-calle').value,
        numero: document.getElementById('sede-numero').value,
        localidad: document.getElementById('sede-localidad').value
    };

    fetch('backend/api/crud_unidades.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        bootstrap.Modal.getInstance(document.getElementById('modalSede')).hide();
        cargarSedes();
    })
    .catch(() => alert('Error al guardar sede'))
    .finally(() => btn.disabled = false);
});

function borrarSede(id) {
    if(!confirm('¿Seguro que deseas eliminar esta sede?')) return;
    fetch('backend/api/crud_unidades.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        cargarSedes();
    })
    .catch(() => alert('Error al eliminar'));
}

// ==========================================
// HORARIOS DEL MÉDICO
// ==========================================
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function abrirHorariosMedico(id) {
    const med = medicosDisponibles.find(m => m.id == id);
    if(!med) return;

    document.getElementById('horario-medico-id').value = med.id;
    document.getElementById('horario-medico-nombre-label').textContent = `Dr/a. ${med.nombre} ${med.apellido}`;

    const container = document.getElementById('horarios-editor-container');
    container.innerHTML = '';

    // Renderizar horarios existentes o un bloque vacío si no hay
    if(med.horarios && med.horarios.length > 0) {
        med.horarios.forEach(h => renderBloqueHorario(container, h));
    } else {
        renderBloqueHorario(container, null);
    }

    new bootstrap.Modal(document.getElementById('modalHorariosMedico')).show();
}

const HORAS_24 = [];
for (let hr = 6; hr <= 23; hr++) {
    const hh = String(hr).padStart(2, '0');
    HORAS_24.push(`${hh}:00`);
    HORAS_24.push(`${hh}:30`);
}

function generarOpcionesHoras(horaActual, defecto) {
    const hora = (horaActual && horaActual.length >= 5) ? horaActual.slice(0, 5) : defecto;
    let horas = [...HORAS_24];
    if (hora && !horas.includes(hora)) {
        horas.push(hora);
        horas.sort();
    }
    return horas.map(h => `<option value="${h}" ${h === hora ? 'selected' : ''}>${h} hs</option>`).join('');
}

function renderBloqueHorario(container, h) {
    const sedesOpts = sedesDisponibles.map(s => {
        const dir = [s.calle, s.numero].filter(Boolean).join(' ');
        const label = s.nombre + (dir ? ` (${dir})` : '');
        return `<option value="${s.id}" ${h && h.unidad_id == s.id ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const div = document.createElement('div');
    div.className = 'card border-0 bg-light rounded-3 p-3 mb-3 horario-bloque';
    div.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-md-2">
                <label class="form-label small fw-semibold">Día</label>
                <select class="form-select form-select-sm hb-dia">
                    ${DIAS_SEMANA.map(d => `<option value="${d}" ${h && h.dia_semana === d ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small fw-semibold">Desde (24hs)</label>
                <select class="form-select form-select-sm hb-inicio">
                    ${generarOpcionesHoras(h ? h.hora_inicio : null, '08:00')}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small fw-semibold">Hasta (24hs)</label>
                <select class="form-select form-select-sm hb-fin">
                    ${generarOpcionesHoras(h ? h.hora_fin : null, '13:00')}
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small fw-semibold">Duración (min)</label>
                <input type="number" class="form-control form-control-sm hb-duracion" min="10" max="120" step="5" value="${h ? h.duracion_turno_minutos : 30}">
            </div>
            <div class="col-md-3">
                <label class="form-label small fw-semibold">Centro / Sede</label>
                <select class="form-select form-select-sm hb-sede">
                    <option value="">-- Sin sede --</option>
                    ${sedesOpts}
                </select>
            </div>
            <div class="col-md-1 d-flex align-items-end">
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="this.closest('.horario-bloque').remove()" title="Eliminar bloque">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function agregarBloqueHorario() {
    const container = document.getElementById('horarios-editor-container');
    renderBloqueHorario(container, null);
}

function guardarHorariosMedico() {
    const medicoId = document.getElementById('horario-medico-id').value;
    const bloques = document.querySelectorAll('.horario-bloque');

    const horarios = Array.from(bloques).map(b => ({
        dia_semana: b.querySelector('.hb-dia').value,
        hora_inicio: b.querySelector('.hb-inicio').value,
        hora_fin: b.querySelector('.hb-fin').value,
        duracion_turno_minutos: parseInt(b.querySelector('.hb-duracion').value) || 30,
        unidad_id: b.querySelector('.hb-sede').value || null
    }));

    fetch('backend/api/crud_horarios_medico.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medico_id: medicoId, horarios })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        bootstrap.Modal.getInstance(document.getElementById('modalHorariosMedico')).hide();
        cargarMedicosAdmin();
    })
    .catch(() => alert('Error al guardar horarios'));
}
