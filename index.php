<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clínica Médica - Agenda Pública</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="assets/css/style.css?v=<?php echo filemtime('assets/css/style.css'); ?>" rel="stylesheet">
</head>
<body class="login-bg min-vh-100 pb-5">
    
    <!-- Theme Toggle -->
    <div class="position-absolute top-0 end-0 p-3" style="z-index: 10;">
        <button class="btn btn-outline-secondary rounded-circle glass-card border-0" id="theme-toggle">
            <i class="bi bi-moon-fill"></i>
        </button>
    </div>

    <!-- Header / Navbar estilo Glass -->
    <header class="py-3 mb-5 shadow-sm" style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
        <div class="container d-flex flex-wrap justify-content-between align-items-center">
            <a href="/" class="d-flex align-items-center mb-2 mb-md-0 text-decoration-none" style="color: var(--bs-primary);">
                <i class="bi bi-heart-pulse-fill fs-3 me-2"></i>
                <span class="fs-4 fw-bold">Clínica Médica</span>
            </a>
            
            <div class="text-end">
                <a href="login.php" class="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm">
                    <i class="bi bi-person-circle me-1"></i> Iniciar Sesión / Registrarse
                </a>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Título Principal -->
        <div class="text-center mb-5">
            <h1 class="display-6 fw-light mb-3">Elige el profesional que necesitas</h1>
            <p class="lead text-muted">Agenda tu cita de manera rápida y sencilla.</p>
        </div>

        <!-- Sección de Filtros -->
        <div class="row justify-content-center mb-5">
            <div class="col-lg-10">
                <div class="glass-card p-4 p-md-5 border-0">
                    <div class="row g-4">
                        <div class="col-md-4">
                            <label class="form-label text-muted small fw-semibold text-uppercase"><i class="bi bi-search me-1"></i> Profesional</label>
                            <input type="text" id="filter-nombre" class="form-control form-control-lg bg-light border-0 shadow-none" placeholder="Nombre o apellido...">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label text-muted small fw-semibold text-uppercase"><i class="bi bi-hospital me-1"></i> Especialidad</label>
                            <select id="filter-especialidad" class="form-select form-select-lg bg-light border-0 shadow-none">
                                <option value="">Todas las especialidades</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label text-muted small fw-semibold text-uppercase"><i class="bi bi-shield-check me-1"></i> Cobertura Médica</label>
                            <select id="filter-cobertura" class="form-select form-select-lg bg-light border-0 shadow-none">
                                <option value="">Todas las coberturas</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenedor de Resultados -->
        <div id="results-container" class="row g-4 pb-5">
            <!-- Los resultados se cargan vía JS -->
        </div>
    </div>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Scripts Propios -->
    <script src="assets/js/agenda_publica.js?v=<?php echo filemtime('assets/js/agenda_publica.js'); ?>"></script>

    <!-- Script de Modo Oscuro -->
    <script>
        const themeToggle = document.getElementById('theme-toggle');
        const htmlElement = document.documentElement;
        
        // Recuperar tema preferido
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
            if (theme === 'light') {
                themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
            } else {
                themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
            }
        }
    </script>
</body>
</html>
