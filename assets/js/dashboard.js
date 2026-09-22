document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user');
    
    // Verificar si el usuario tiene datos básicos locales
    if(!userJson) {
        window.location.href = 'index.php';
        return;
    }

    // Consultar al servidor por los datos MÁS RECIENTES (incluyendo el rol actualizado)
    fetch('backend/api/me.php')
        .then(res => {
            if(!res.ok) throw new Error('Sesión inválida');
            return res.json();
        })
        .then(data => {
            const user = data.user;
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

    menuDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        contentDashboard.classList.remove('d-none');
        contentUsuarios.classList.add('d-none');
        // actualizar UI activa
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        menuDashboard.classList.add('active');
    });

    if(menuUsuarios) {
        menuUsuarios.addEventListener('click', (e) => {
            e.preventDefault();
            contentDashboard.classList.add('d-none');
            contentUsuarios.classList.remove('d-none');
            // actualizar UI activa
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            menuUsuarios.classList.add('active');
            
            cargarUsuarios();
        });
    }

    // Lógica Cerrar Sesión
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.php';
        });
    });
});

// Función para llamar al backend PHP (GET a /api/users.php)
function cargarUsuarios() {
    const API_URL = 'backend/api';
    
    fetch(`${API_URL}/users.php`)
        .then(response => {
            if(response.status === 403) throw new Error('No tienes permisos');
            return response.json();
        })
        .then(usuarios => {
            const tbody = document.getElementById('tabla-usuarios');
            tbody.innerHTML = ''; // Limpiar tabla
            
            usuarios.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td><span class="badge bg-secondary">${u.rol}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="cambiarRol(${u.id}, 'medico')">Hacer Médico</button>
                        <button class="btn btn-sm btn-outline-warning" onclick="cambiarRol(${u.id}, 'recepcionista')">Hacer Recepcionista</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            alert('Error cargando usuarios: ' + err.message);
        });
}

function cambiarRol(idUsuario, nuevoRol) {
    if(!confirm(`¿Seguro que quieres cambiar el rol a ${nuevoRol}?`)) return;

    const API_URL = 'backend/api';
    fetch(`${API_URL}/users.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idUsuario, rol: nuevoRol })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        cargarUsuarios(); // Refrescar la tabla
    })
    .catch(err => alert('Error: ' + err));
}
