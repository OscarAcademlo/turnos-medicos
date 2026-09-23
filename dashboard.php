<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Clínica Médica</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Select2 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css" rel="stylesheet" />
    <!-- DataTables CSS -->
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <!-- Custom CSS con Cache Busting -->
    <link href="assets/css/style.css?v=<?php echo filemtime('assets/css/style.css'); ?>" rel="stylesheet">
</head>
<body class="bg-body-tertiary">

<!-- Navbar Superior -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
    <div class="container-fluid px-4">
        <button class="navbar-toggler d-md-none collapsed me-2" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <a class="navbar-brand d-flex align-items-center fw-bold me-auto" href="#">
            <i class="bi bi-heart-pulse-fill me-2 fs-4"></i> <span id="page-title">Clínica Médica</span>
        </a>
        
        <!-- Controles derecha -->
        <div class="d-flex align-items-center gap-3">
            <!-- Theme Toggle -->
            <button class="btn btn-sm btn-outline-light rounded-circle" id="theme-toggle">
                <i class="bi bi-moon-fill"></i>
            </button>
            
            <div class="dropdown text-end">
                <a href="#" class="d-block link-light text-decoration-none dropdown-toggle" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="https://ui-avatars.com/api/?name=Usuario&background=random" id="user-avatar" alt="mdo" width="32" height="32" class="rounded-circle">
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
                    <li><h6 class="dropdown-header" id="user-name-display">Cargando...</h6></li>
                    <li><span class="dropdown-item-text badge bg-info text-dark mx-3 mb-2" id="user-role-display">ROL</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </div>
</nav>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar -->
        <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block sidebar collapse">
            <div class="position-sticky pt-4 px-2">
                <ul class="nav flex-column gap-1" id="nav-menu">
                    <li class="nav-item">
                        <a class="nav-link active d-flex align-items-center" href="#" id="menu-dashboard">
                            <i class="bi bi-house-door me-2"></i> Inicio
                        </a>
                    </li>
                    <li class="nav-item admin-only d-none">
                        <a class="nav-link d-flex align-items-center" href="#" id="menu-usuarios">
                            <i class="bi bi-people me-2"></i> Gestión de Usuarios
                        </a>
                    </li>
                    <li class="nav-item admin-only d-none">
                        <a class="nav-link d-flex align-items-center" href="#" id="menu-obras">
                            <i class="bi bi-building me-2"></i> Obras Sociales
                        </a>
                    </li>
                    <li class="nav-item admin-only d-none">
                        <a class="nav-link d-flex align-items-center" href="#" id="menu-agenda-admin">
                            <i class="bi bi-calendar-range me-2"></i> Agenda y Horarios
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link d-flex align-items-center" href="#" id="menu-turnos">
                            <i class="bi bi-calendar-check me-2"></i> Mis Turnos
                        </a>
                    </li>
                </ul>
            </div>
        </nav>

        <!-- Contenido Principal -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-3 px-md-4 py-4">
            
            <!-- VISTA: INICIO / DASHBOARD -->
            <!-- VISTA: INICIO / DASHBOARD -->
            <div id="content-dashboard">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 mb-4 border-bottom">
                    <h1 class="h2 fw-bold">Resumen General</h1>
                </div>

                <div class="row g-4">
                    <div class="col-12 col-md-4">
                        <div class="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                            <div class="card-body p-4 bg-primary text-white position-relative">
                                <h5 class="card-title fw-normal opacity-75">Próximos Turnos</h5>
                                <p class="card-text display-4 fw-bold mb-0">0</p>
                                <i class="bi bi-calendar-event position-absolute" style="font-size: 5rem; right: -10px; bottom: -20px; opacity: 0.2;"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12 col-md-8">
                        <div class="card border-0 shadow-sm h-100 rounded-4">
                            <div class="card-body p-4 d-flex flex-column justify-content-center align-items-center text-center">
                                <i class="bi bi-calendar-plus text-primary mb-3" style="font-size: 3rem;"></i>
                                <h4>¿Necesitas atención médica?</h4>
                                <p class="text-muted">Agenda tu cita con nuestros especialistas rápidamente.</p>
                                <button class="btn btn-primary px-4 rounded-pill" onclick="document.getElementById('menu-turnos').click()">Solicitar Turno</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VISTA: GESTIÓN DE USUARIOS -->
            <div id="content-usuarios" class="d-none">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 mb-4 border-bottom">
                    <h1 class="h2 fw-bold">Gestión de Usuarios</h1>
                    <div>
                        <button class="btn btn-outline-primary shadow-sm rounded-pill me-2" onclick="cargarUsuarios()">
                            <i class="bi bi-arrow-clockwise me-1"></i> Refrescar
                        </button>
                        <button class="btn btn-primary shadow-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#modalCrearUsuario">
                            <i class="bi bi-person-plus me-1"></i> Crear Personal
                        </button>
                    </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0" id="users-table">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-4">Usuario</th>
                                        <th>Email</th>
                                        <th>Rol Actual</th>
                                        <th class="pe-4">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="tabla-usuarios">
                                    <tr>
                                        <td colspan="4" class="text-center py-4 text-muted">Cargando usuarios...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VISTA: OBRAS SOCIALES -->
            <div id="content-obras" class="d-none">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 mb-4 border-bottom">
                    <h1 class="h2 fw-bold">Obras Sociales</h1>
                    <button class="btn btn-primary shadow-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#modalCrearObra">
                        <i class="bi bi-plus-lg me-1"></i> Nueva Obra Social
                    </button>
                </div>
                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0" id="obras-table">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-4">ID</th>
                                        <th>Nombre (Obra Social)</th>
                                        <th class="pe-4 text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tabla-obras">
                                    <tr>
                                        <td colspan="3" class="text-center py-4 text-muted">Cargando obras sociales...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VISTA: AGENDA ADMIN -->
            <div id="content-agenda-admin" class="d-none">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 mb-4 border-bottom">
                    <h1 class="h2 fw-bold">Gestión de Agenda</h1>
                </div>
                <div class="alert alert-warning rounded-4 shadow-sm border-0 d-flex align-items-center">
                    <i class="bi bi-tools fs-4 me-3"></i>
                    <div>Módulo de configuración de horarios y duración de consultas en desarrollo.</div>
                </div>
            </div>

            <!-- VISTA: MIS TURNOS -->
            <div id="content-turnos" class="d-none">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 mb-4 border-bottom">
                    <h1 class="h2 fw-bold">Mis Turnos</h1>
                    <button class="btn btn-primary shadow-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#modalNuevoTurno">
                        <i class="bi bi-plus-lg me-1"></i> Solicitar Turno
                    </button>
                </div>

                <div class="alert alert-info rounded-4 shadow-sm border-0 d-flex align-items-center" role="alert">
                    <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                    <div>Todavía no tienes turnos programados. Haz clic en "Solicitar Turno" para agendar uno.</div>
                </div>
            </div>


        </main>
    </div>
</div>

<!-- Modal Solicitar Turno (Docturno Style) -->
<div class="modal fade" id="modalNuevoTurno" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content rounded-4 border-0 shadow">
      <div class="modal-header border-bottom-0 pb-0">
        <h1 class="modal-title fs-5 fw-bold">Solicitar Turno</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <form id="form-solicitar-turno">
            <!-- Paso 1: Especialidad y Profesional -->
            <div id="step-1" class="mb-4">
                <h5 class="fw-semibold text-muted mb-3"><i class="bi bi-person-badge me-2"></i>1. ¿Qué profesional buscas?</h5>
                <div class="row g-3">
                    <div class="col-md-6">
                        <select class="form-select shadow-sm" id="turno-especialidad" required>
                            <option value="" selected disabled>Selecciona especialidad...</option>
                            <!-- Cargado por JS -->
                        </select>
                    </div>
                    <div class="col-md-6">
                        <select class="form-select shadow-sm" id="turno-medico" required disabled>
                            <option value="" selected disabled>Primero selecciona especialidad...</option>
                            <!-- Cargado por JS -->
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Paso 2: Obra Social y Planes (Botones) -->
            <div id="step-2" class="mb-4 d-none">
                <hr class="text-muted opacity-25 my-4">
                <h5 class="fw-semibold text-muted mb-3"><i class="bi bi-shield-check me-2"></i>2. ¿Qué cobertura y plan tienes?</h5>
                
                <div class="mb-3">
                    <select class="form-select shadow-sm" id="turno-obra-social" required>
                        <option value="" selected disabled>Selecciona tu cobertura médica...</option>
                        <!-- Cargado por JS -->
                    </select>
                </div>
                
                <div id="planes-container" class="d-flex flex-wrap gap-2 mt-3 justify-content-center d-none">
                    <!-- Botones píldora (Planes) se inyectan aquí -->
                </div>
                <input type="hidden" id="turno-plan" required>
            </div>

            <!-- Paso 3: Calendario de Días y Horarios -->
            <div id="step-3" class="mb-2 d-none">
                <hr class="text-muted opacity-25 my-4">
                <h5 class="fw-semibold text-muted mb-4 text-center"><i class="bi bi-calendar-event me-2"></i>3. ¿Qué día prefieres?</h5>
                
                <!-- Navegación de meses si fuera necesario -->
                <div id="mes-label" class="text-center text-muted fw-bold mb-3 fs-5">Octubre</div>

                <div id="dias-container" class="d-flex overflow-auto pb-3 gap-3 justify-content-start" style="scroll-snap-type: x mandatory; scroll-behavior: smooth;">
                    <!-- Botones de días (Pills) se inyectan aquí -->
                </div>
                <input type="hidden" id="turno-fecha" required>

                <!-- Horarios Disponibles -->
                <div id="horarios-container" class="d-none mt-4">
                    <h6 class="text-center text-muted mb-3">Horarios disponibles</h6>
                    <div id="horarios-list" class="d-flex flex-wrap gap-2 justify-content-center">
                        <!-- Píldoras de horas se inyectan aquí -->
                    </div>
                    <input type="hidden" id="turno-hora" required>
                </div>
            </div>
        </form>
      </div>
      <div class="modal-footer border-top-0 pt-0">
        <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary rounded-pill px-4" disabled>Siguiente</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal Crear Personal -->
<div class="modal fade" id="modalCrearUsuario" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content rounded-4 border-0 shadow">
      <div class="modal-header border-bottom-0 pb-0">
        <h1 class="modal-title fs-5 fw-bold">Alta de Personal</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="form-crear-personal">
            <div class="mb-3">
                <input type="text" class="form-control" id="new-nombre" placeholder="Nombre completo" required>
            </div>
            <div class="mb-3">
                <input type="email" class="form-control" id="new-email" placeholder="Correo Electrónico" required>
            </div>
            <div class="mb-3">
                <select class="form-select" id="new-rol" required>
                    <option value="" selected disabled>Seleccionar Rol...</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="medico">Médico</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="mb-3">
                <input type="password" class="form-control" id="new-password" placeholder="Contraseña de Acceso" required>
            </div>
        </form>
      </div>
      <div class="modal-footer border-top-0 pt-0">
        <button type="button" class="btn btn-light rounded-pill" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary rounded-pill" onclick="crearPersonal()">Crear</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal Gestión de Planes -->
<div class="modal fade" id="modalGestionPlanes" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content rounded-4 border-0 shadow">
      <div class="modal-header border-bottom-0 pb-0">
        <h1 class="modal-title fs-5 fw-bold" id="modalGestionPlanesTitle">Planes de Obra Social</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="gestion-plan-os-id">
        
        <!-- Formulario para agregar plan -->
        <form id="form-crear-plan" class="mb-4">
            <div class="input-group">
                <input type="text" class="form-control" id="new-plan-nombre" placeholder="Nombre del nuevo plan" required>
                <button class="btn btn-primary" type="submit"><i class="bi bi-plus"></i> Añadir Plan</button>
            </div>
        </form>

        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0" id="planes-table">
                <thead class="table-light">
                    <tr>
                        <th>Nombre del Plan</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-planes">
                    <tr>
                        <td colspan="2" class="text-center py-3 text-muted">Cargando planes...</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
      <div class="modal-footer border-top-0 pt-0">
        <button type="button" class="btn btn-light rounded-pill" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<!-- Botón Flotante de WhatsApp -->
<a href="https://wa.me/5491112345678" target="_blank" class="whatsapp-float shadow-lg" title="Contactar a Recepción">
    <i class="bi bi-whatsapp"></i>
</a>

<!-- Scripts UI Basicos -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    const htmlElement = document.documentElement;
    
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
            icon.style.color = '#ffc107';
        } else {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
            icon.style.color = 'inherit';
        }
    }
</script>

<!-- jQuery (Requerido por Select2 y DataTables) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<!-- Select2 JS -->
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<!-- DataTables JS -->
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<!-- Scripts Propios con Cache Busting -->
<script src="assets/js/firebase-config.js?v=<?php echo filemtime('assets/js/firebase-config.js'); ?>"></script>
<script src="assets/js/dashboard.js?v=<?php echo filemtime('assets/js/dashboard.js'); ?>"></script>
</body>
</html>
