document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user');
    
    // Verificar si el usuario tiene datos básicos locales
    if(!userJson) {
        window.location.href = 'index.php';
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
            window.location.href = 'index.php';
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
        });
    }

    // Lógica Cerrar Sesión
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.php';
        });
    });
});

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

// --- Lógica del Paciente (Solicitar Turno) ---
const modalTurno = document.getElementById('modalNuevoTurno');
if(modalTurno) {
    modalTurno.addEventListener('show.bs.modal', () => {
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

        // Cargar Obras Sociales
        fetch('backend/api/crud_obras_sociales.php')
            .then(res => res.json())
            .then(data => {
                const sel = document.getElementById('turno-obra-social');
                sel.innerHTML = '<option value="" selected disabled>Selecciona tu cobertura médica...</option>';
                sel.innerHTML += '<option value="particular">Particular (Sin Obra Social)</option>';
                
                let html = '';
                data.forEach(o => {
                    html += `<option value="${o.id}">${o.nombre}</option>`;
                });
                sel.innerHTML += html;
                
                // Init Select2
                $('#turno-obra-social').select2({
                    theme: 'bootstrap-5',
                    dropdownParent: $('#modalNuevoTurno')
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
                    medicoSel.innerHTML = '<option value="" selected disabled>No hay profesionales disponibles para esta especialidad.</option>';
                }
            });
    });
}
