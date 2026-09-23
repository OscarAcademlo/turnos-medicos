const loginForm = document.getElementById('login-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const errorDiv = document.getElementById('login-error');

// URL base de la API (Ajustar al subir a oscarsoft.click)
const API_URL = 'backend/api';

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

// Reutilizable para enviar datos extra al backend
function handleBackendLogin(user, extraData = {}) {
    fetch(`${API_URL}/auth.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firebase_uid: user.uid,
            email: user.email,
            nombre: extraData.nombre || user.displayName || user.email.split('@')[0],
            apellido: extraData.apellido || "",
            dni: extraData.dni || null,
            fecha_nacimiento: extraData.fecha_nacimiento || null,
            telefono: extraData.telefono || null
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Check for redirect params
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('redirect') === 'agendar' && urlParams.get('medico_id')) {
                window.location.href = 'agendar.php?medico_id=' + urlParams.get('medico_id');
            } else {
                window.location.href = 'dashboard.php';
            }
        } else {
            showError(data.message || 'Error al conectar con el servidor.');
        }
    })
    .catch(error => {
        showError('Ocurrió un error en el servidor.');
    });
}

// Login con Email y Contraseña
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Autenticación Híbrida: Primero intentamos en el backend local (para médicos y recepcionistas)
        fetch(`${API_URL}/db_login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                // Login local exitoso
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.php';
            } else if (data.status === "use_firebase") {
                // El usuario no tiene contraseña local, intentar con Firebase
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        handleBackendLogin(userCredential.user);
                    })
                    .catch((error) => {
                        showError('Credenciales inválidas o error: ' + error.message);
                    });
            } else {
                showError(data.message || 'Error al iniciar sesión.');
            }
        })
        .catch(error => {
            showError('Ocurrió un error de conexión con el servidor.');
        });
    });
}

// Registro Completo de Paciente
const registerForm = document.getElementById('register-form');
if(registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const extraData = {
            nombre: document.getElementById('reg-nombre').value,
            apellido: document.getElementById('reg-apellido').value,
            dni: document.getElementById('reg-dni').value,
            fecha_nacimiento: document.getElementById('reg-fecha-nac').value,
            telefono: document.getElementById('reg-telefono').value
        };
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                handleBackendLogin(userCredential.user, extraData);
            })
            .catch((error) => {
                showError('Error al crear cuenta: ' + error.message);
            });
    });
}

// Login con Google
if(googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then((result) => {
                // El login de google no tiene DNI ni los otros campos en esta etapa,
                // idealmente se debería redirigir a "Completar Perfil". 
                // Por ahora se envía lo básico.
                handleBackendLogin(result.user);
            })
            .catch((error) => {
                showError('Error al iniciar sesión con Google: ' + error.message);
            });
    });
}

// Recuperar contraseña
const forgotPasswordLink = document.getElementById('forgot-password-link');
if(forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if(!email) {
            showError('Por favor, ingresa tu correo electrónico en el campo superior para enviarte el enlace de recuperación.');
            return;
        }
        
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
            })
            .catch((error) => {
                showError('Error al recuperar contraseña: ' + error.message);
            });
    });
}
