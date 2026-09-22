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

    // Lógica de navegación entre "pantallas"
    const menuDashboard = document.getElementById('menu-dashboard');
    const menuUsuarios = document.getElementById('menu-usuarios');
    const contentDashboard = document.getElementById('content-dashboard');
    const contentUsuarios = document.getElementById('content-usuarios');

    // Lógica de Vistas (Navegación Sidebar)
    menuDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        menuDashboard.classList.add('active');
        contentDashboard.classList.remove('d-none');
        contentUsuarios.classList.add('d-none');
    });

    if(menuUsuarios) {
        menuUsuarios.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            menuUsuarios.classList.add('active');
            contentDashboard.classList.add('d-none');
            contentUsuarios.classList.remove('d-none');
            cargarUsuarios();
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
