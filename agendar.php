<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitar Turno - Clínica Médica</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Animate.css para animaciones suaves -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
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
    <header class="py-3 mb-4 shadow-sm" style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
        <div class="container d-flex flex-wrap justify-content-between align-items-center">
            <a href="index.php" class="d-flex align-items-center mb-2 mb-md-0 text-decoration-none" style="color: var(--bs-primary);">
                <i class="bi bi-heart-pulse-fill fs-3 me-2"></i>
                <span class="fs-4 fw-bold">Clínica Médica</span>
            </a>
            <div class="text-end" id="header-auth-section">
                <a href="login.php" class="btn btn-outline-primary rounded-pill px-4 fw-semibold shadow-sm">
                    <i class="bi bi-person-circle me-1"></i> Iniciar Sesión
                </a>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- VISTA: ASISTENTE DE RESERVA PANTALLA COMPLETA -->
        <div id="content-wizard-agendar" class="animate__animated animate__fadeIn">
            <!-- Barra de Resumen (Sticky) -->
            <div class="glass-card p-3 mb-5 sticky-top mt-3" style="z-index: 1020; top: 1rem;">
                <div class="row align-items-center">
                    <div class="col-md-4 d-flex align-items-center mb-3 mb-md-0">
                        <div id="wizard-avatar-container" class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm overflow-hidden" style="width: 45px; height: 45px; flex-shrink: 0;">
                            <i class="bi bi-person-fill fs-4"></i>
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold" id="wizard-medico-nombre">Cargando...</h6>
                            <small class="text-primary" style="cursor:pointer;" id="btn-cambiar-profesional">Cambiar profesional</small>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3 mb-md-0 border-start ps-4">
                        <h6 class="text-muted small text-uppercase mb-1">Especialidad</h6>
                        <span id="wizard-especialidad-nombre" class="fw-semibold">Cargando...</span>
                    </div>
                    <div class="col-md-4 border-start ps-4">
                        <h6 class="text-muted small text-uppercase mb-1">Cobertura Médica</h6>
                        <span id="wizard-cobertura-nombre" class="fw-semibold text-muted">Seleccionar...</span>
                        <br><small class="text-primary d-none" style="cursor:pointer;" id="btn-cambiar-cobertura">Cambiar cobertura</small>
                    </div>
                </div>
            </div>

            <!-- Contenedor Principal del Wizard -->
            <div class="container pb-5">
                
                <!-- Wizard Paso 1: Tipo de Paciente -->
                <div id="wizard-step-1" class="text-center py-4">
                    <h2 class="fw-light mb-5">¿Ya te has atendido con <span id="wizard-medico-nombre-q">este profesional</span>?</h2>
                    <div class="d-flex flex-column flex-md-row justify-content-center gap-4">
                        <button class="wizard-big-btn bg-white" onclick="wizardGoToStep2()">
                            <span class="d-block fs-4 text-primary mb-2">Es la primera vez</span>
                            <small class="text-muted">(será mi primer visita)</small>
                        </button>
                        <button class="wizard-big-btn bg-white" onclick="wizardGoToStep2()">
                            <span class="d-block fs-4 text-primary mb-2">Ya me he atendido</span>
                            <small class="text-muted">(soy un paciente recurrente)</small>
                        </button>
                    </div>
                </div>

                <!-- Wizard Paso 2: Cobertura -->
                <div id="wizard-step-2" class="text-center py-4 d-none animate__animated animate__fadeIn">
                    <h2 class="fw-light mb-4">¿Será de forma particular?</h2>
                    <button class="btn btn-outline-primary rounded-pill fs-5 px-5 py-3 mb-5 fw-semibold shadow-sm" onclick="wizardSelectCobertura('particular', 'Particular')">
                        <i class="bi bi-person-heart me-2"></i> Sin obra social / Particular
                    </button>
                    
                    <div class="glass-card p-4 p-md-5 mx-auto text-center shadow-lg" style="max-width: 800px; border-radius: 20px;">
                        <h4 class="text-muted mb-4 fw-normal">¿O qué cobertura médica tienes?</h4>
                        <div class="mb-5 position-relative mx-auto" style="max-width: 500px;">
                            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-muted fs-5"></i>
                            <input type="text" id="wizard-search-os" class="form-control form-control-lg rounded-pill shadow-sm border-0 bg-light py-3 ps-5" placeholder="Buscar cobertura...">
                        </div>
                        <div id="wizard-os-container" class="d-flex flex-wrap gap-3 justify-content-center mt-4">
                            <!-- OS Cards -->
                        </div>
                    </div>
                </div>

                <!-- Wizard Paso 3: Planes -->
                <div id="wizard-step-3" class="text-center py-4 d-none animate__animated animate__fadeIn">
                    <div class="glass-card p-4 p-md-5 mx-auto text-center shadow-lg" style="max-width: 800px; border-radius: 20px;">
                        <h2 class="fw-light mb-4 text-primary">¿Qué plan tienes?</h2>
                        <div class="mb-5 position-relative mx-auto" style="max-width: 500px;">
                            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-muted fs-5"></i>
                            <input type="text" id="wizard-search-plan" class="form-control form-control-lg rounded-pill shadow-sm border-0 bg-light py-3 ps-5" placeholder="Buscar plan...">
                        </div>
                        <div id="wizard-planes-container" class="d-flex flex-wrap gap-3 justify-content-center mt-4">
                            <!-- Planes Cards -->
                        </div>
                    </div>
                </div>

                <!-- Wizard Paso 4: Calendario -->
                <div id="wizard-step-4" class="py-4 d-none animate__animated animate__fadeIn">
                    <h2 class="text-center fw-light mb-5">¿Qué día prefieres?</h2>
                    <div id="wizard-mes-label" class="text-center text-muted fw-bold mb-4 fs-4 text-uppercase">Octubre</div>
                    <div id="wizard-dias-container" class="d-flex flex-wrap gap-3 justify-content-center mb-5" style="max-width: 900px; margin: 0 auto;">
                        <!-- Días Pills -->
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal Selección de Horarios (Nivel raíz para evitar solapamiento de backdrop) -->
    <div class="modal fade" id="modalHorariosTurno" tabindex="-1" aria-labelledby="modalHorariosTurnoLabel" aria-hidden="true" style="z-index: 1060;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
          <div class="modal-header border-bottom-0 pb-1 pt-4 px-4 bg-white">
            <div>
              <span class="badge bg-primary-subtle text-primary text-uppercase px-3 py-1 rounded-pill small fw-bold mb-2">Horarios Disponibles</span>
              <h4 class="modal-title fw-bold" id="modalHorariosTurnoLabel">Turnos para el <span id="modal-fecha-seleccionada" class="text-primary">--</span></h4>
              <div id="modal-sede-info-banner" class="mt-2 text-muted small"></div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body p-4 text-center bg-white">
            <p class="text-muted mb-3">Elige el horario en que deseas atenderte:</p>
            <div id="modal-horarios-list" class="d-flex flex-wrap gap-2 justify-content-center py-2" style="max-height: 280px; overflow-y: auto;">
              <!-- Horas generadas dinámicamente -->
            </div>
            <div id="modal-horario-seleccionado-info" class="mt-3 text-muted small d-none">
              Horario seleccionado: <span class="fw-bold text-primary fs-6" id="modal-hora-texto">--:-- hs</span>
            </div>
          </div>
          <div class="modal-footer border-top-0 pt-0 pb-4 px-4 justify-content-between bg-white">
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cambiar Día</button>
            <button type="button" class="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm d-none" id="wizard-btn-confirmar">
              <i class="bi bi-check-circle me-1"></i> Confirmar Turno
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Firebase App & Auth (v8 compat) -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="assets/js/firebase-config.js"></script>

    <!-- Lógica Pública -->
    <script src="assets/js/agendar.js?v=<?php echo time(); ?>"></script>
</body>
</html>
