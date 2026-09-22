const loginForm = document.getElementById('login-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const errorDiv = document.getElementById('login-error');

// URL base de la API (Ajustar al subir a oscarsoft.click)
const API_URL = 'backend/api';

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

function handleBackendLogin(user) {
    // Enviar datos al backend PHP
    fetch(`${API_URL}/auth.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firebase_uid: user.uid,
            email: user.email,
            nombre: user.displayName || user.email.split('@')[0]
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.user) {
            // Guardar datos en localStorage y redirigir al dashboard
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.php';
        } else {
            showError(data.message || 'Error al conectar con el servidor.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Ocurrió un error en el servidor.');
    });
}

// Login con Email y Contraseña
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                handleBackendLogin(userCredential.user);
            })
            .catch((error) => {
                showError('Credenciales inválidas o error en Firebase: ' + error.message);
            });
    });
}

// Login con Google
if(googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then((result) => {
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
