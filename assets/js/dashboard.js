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
    const menuTurnos = document.getElementById('menu-turnos');
    
    const contentDashboard = document.getElementById('content-dashboard');
    const contentUsuarios = document.getElementById('content-usuarios');
    const contentObras = document.getElementById('content-obras');
    const contentAgendaAdmin = document.getElementById('content-agenda-admin');
    const contentTurnos = document.getElementById('content-turnos');

    // Función auxiliar para cambiar vistas
    function mostrarVista(vistaActiva, menuActivo, titulo) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if(menuActivo) menuActivo.classList.add('active');
        
        contentDashboard.classList.add('d-none');
        if(contentUsuarios) contentUsuarios.classList.add('d-none');
        if(contentObras) contentObras.classList.add('d-none');
        if(contentAgendaAdmin) contentAgendaAdmin.classList.add('d-none');
        if(contentTurnos) contentTurnos.classList.add('d-none');
        
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
        auth.signOut().then(() => {
            localStorage.removeItem('user');
            window.location.href = 'login.php';
        });
    });
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
            container.innerHTML = '';
            if(!data || data.length === 0 || data.message) {
                container.innerHTML = `
                    <div class="alert alert-info rounded-4 shadow-sm border-0 d-flex align-items-center" role="alert">
                        <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                        <div>Todavía no tienes turnos programados. Haz clic en "Solicitar Turno" para agendar uno.</div>
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
                                
                                <div class="mb-2">
                                    <i class="bi bi-person-badge text-muted me-2"></i>
                                    <span class="fw-semibold">Dr/a. ${turno.medico_nombre} ${turno.medico_apellido}</span>
                                </div>
                                
                                <div class="mb-2">
                                    <i class="bi bi-heart-pulse text-muted me-2"></i>
                                    <span>${turno.especialidad_nombre}</span>
                                </div>
                                
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

// Función para cargar usuarios desde la base de datos
function cargarUsuarios() {
    const user = JSON.parse(localStorage.getItem('user'));
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Cargando...</td></tr>';

    fetch('backend/api/get_users.php')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            
            if(data.usuarios) {
                data.usuarios.forEach(u => {
                    // Solo SuperAdmin puede cambiar roles y no a sí mismo
                    const puedeCambiarRol = user.rol === 'superadmin' && u.id !== user.id;
                    
                    const selectRol = puedeCambiarRol ? `
                        <select class="form-select form-select-sm" style="width: auto;" onchange="cambiarRol(${u.id}, this.value)">
                            <option value="paciente" ${u.rol==='paciente'?'selected':''}>Paciente</option>
                            <option value="medico" ${u.rol==='medico'?'selected':''}>Médico</option>
                            <option value="recepcionista" ${u.rol==='recepcionista'?'selected':''}>Recepcionista</option>
                            <option value="admin" ${u.rol==='admin'?'selected':''}>Administrador</option>
                            <option value="superadmin" ${u.rol==='superadmin'?'selected':''}>SuperAdmin</option>
                        </select>
                    ` : `<span class="badge bg-secondary">${u.rol.toUpperCase()}</span>`;

                    const row = `
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-weight: bold;">
                                        ${u.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="fw-bold">${u.nombre}</div>
                                        <div class="text-muted small">ID: ${u.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${u.email}</td>
                            <td>${selectRol}</td>
                            <td class="pe-4">
                                <button class="btn btn-sm btn-outline-info rounded-circle" title="Detalles"><i class="bi bi-eye"></i></button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${data.message || 'Error al cargar'}</td></tr>`;
            }
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error de conexión</td></tr>`;
        });
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


