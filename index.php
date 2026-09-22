<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clínica Médica - Iniciar Sesión</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Custom CSS con Cache Busting automático -->
    <link href="assets/css/style.css?v=<?php echo filemtime('assets/css/style.css'); ?>" rel="stylesheet">
</head>
<body class="login-bg d-flex align-items-center justify-content-center min-vh-100">
    
    <!-- Theme Toggle -->
    <div class="position-absolute top-0 end-0 p-3">
        <button class="btn btn-outline-secondary rounded-circle" id="theme-toggle">
            <i class="bi bi-moon-fill"></i>
        </button>
    </div>

    <main class="form-signin w-100 m-auto text-center">
        <div class="card glass-card border-0">
            <div class="card-body p-4 p-md-5">
                
                <!-- Logo o Icono Principal -->
                <div class="mb-4 text-primary">
                    <i class="bi bi-heart-pulse-fill" style="font-size: 3rem;"></i>
                </div>

                <h1 class="h3 mb-2 fw-bold">Clínica Médica</h1>
                <p class="text-muted mb-4">Ingresa a tu cuenta para gestionar tus turnos</p>

                <!-- Email/Password Login -->
                <form id="login-form">
                    <div class="form-floating mb-3">
                        <input type="email" class="form-control" id="email" placeholder="nombre@ejemplo.com" required>
                        <label for="email"><i class="bi bi-envelope me-2"></i>Email</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="password" class="form-control" id="password" placeholder="Contraseña" required>
                        <label for="password"><i class="bi bi-lock me-2"></i>Contraseña</label>
                    </div>

                    <button class="w-100 btn btn-lg btn-primary fw-semibold" type="submit">Iniciar Sesión</button>
                    <div class="mt-3 text-center">
                        <a href="#" id="forgot-password-link" class="text-decoration-none small">¿Olvidaste tu contraseña?</a>
                    </div>
                </form>

                <div class="d-flex align-items-center my-4">
                    <hr class="flex-grow-1">
                    <span class="mx-3 text-muted small">O continuar con</span>
                    <hr class="flex-grow-1">
                </div>

                <!-- Google Login Rediseñado -->
                <button id="google-login-btn" class="w-100 btn btn-lg btn-google">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 48 48" class="abcRioButtonSvg">
                        <g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g>
                    </svg>
                    Google
                </button>

                <div id="login-error" class="alert alert-danger mt-4 d-none mb-0 small" role="alert"></div>
            </div>
        </div>
    </main>

    <!-- Script de Cambio de Tema -->
    <script>
        const themeToggle = document.getElementById('theme-toggle');
        const icon = themeToggle.querySelector('i');
        const htmlElement = document.documentElement;
        
        // Cargar preferencia guardada
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });

        function updateIcon(theme) {
            if(theme === 'dark') {
                icon.classList.remove('bi-moon-fill');
                icon.classList.add('bi-sun-fill');
                icon.style.color = '#ffc107'; // Yellow sun
            } else {
                icon.classList.remove('bi-sun-fill');
                icon.classList.add('bi-moon-fill');
                icon.style.color = 'inherit';
            }
        }
    </script>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    
    <!-- Configuración y lógica con Cache Busting automático -->
    <script src="assets/js/firebase-config.js?v=<?php echo filemtime('assets/js/firebase-config.js'); ?>"></script>
    <script src="assets/js/auth.js?v=<?php echo filemtime('assets/js/auth.js'); ?>"></script>
</body>
</html>
