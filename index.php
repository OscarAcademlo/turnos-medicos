<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Turnos Médicos</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS con Cache Busting automático -->
    <link href="assets/css/style.css?v=<?php echo filemtime('assets/css/style.css'); ?>" rel="stylesheet">
</head>
<body class="bg-light d-flex align-items-center py-4">
    
    <main class="form-signin w-100 m-auto text-center">
        <div class="card shadow-sm">
            <div class="card-body p-5">
                <h1 class="h3 mb-3 fw-normal">Clínica Médica</h1>
                <p class="text-muted mb-4">Ingresa a tu cuenta para gestionar tus turnos.</p>

                <!-- Email/Password Login -->
                <form id="login-form">
                    <div class="form-floating mb-3">
                        <input type="email" class="form-control" id="email" placeholder="nombre@ejemplo.com" required>
                        <label for="email">Email</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="password" class="form-control" id="password" placeholder="Contraseña" required>
                        <label for="password">Contraseña</label>
                    </div>

                    <button class="w-100 btn btn-lg btn-primary" type="submit">Iniciar Sesión</button>
                    <div class="mt-2 text-end">
                        <a href="#" id="forgot-password-link" class="text-decoration-none">¿Olvidaste tu contraseña?</a>
                    </div>
                </form>

                <hr class="my-4">

                <!-- Google Login -->
                <button id="google-login-btn" class="w-100 btn btn-lg btn-outline-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-google mb-1 me-2" viewBox="0 0 16 16">
                      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                    </svg>
                    Ingresar con Google
                </button>

                <div id="login-error" class="alert alert-danger mt-3 d-none" role="alert"></div>
            </div>
        </div>
    </main>

    <!-- Firebase SDK (Version 8 compat for simplicity or v9 modular. Using v8 compat for easier vanilla JS integration without build tools) -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    
    <!-- Configuración y lógica con Cache Busting automático -->
    <script src="assets/js/firebase-config.js?v=<?php echo filemtime('assets/js/firebase-config.js'); ?>"></script>
    <script src="assets/js/auth.js?v=<?php echo filemtime('assets/js/auth.js'); ?>"></script>
</body>
</html>
