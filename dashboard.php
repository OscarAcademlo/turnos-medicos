<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Turnos Médicos</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS con Cache Busting -->
    <link href="assets/css/style.css?v=<?php echo filemtime('assets/css/style.css'); ?>" rel="stylesheet">
</head>
<body>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar -->
        <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
            <div class="position-sticky pt-3">
                <div class="text-center mb-4 mt-2">
                    <h5>Clínica Médica</h5>
                    <small class="text-muted" id="user-role-display">Rol</small>
                </div>
                <ul class="nav flex-column" id="nav-menu">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" id="menu-dashboard">
                            Dashboard
                        </a>
                    </li>
                    <li class="nav-item admin-only d-none">
                        <a class="nav-link" href="#" id="menu-usuarios">
                            Gestión de Usuarios
                        </a>
                    </li>
                    <li class="nav-item admin-only d-none">
                        <a class="nav-link" href="#" id="menu-medicos">
                            Gestión de Médicos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" id="menu-turnos">
                            Mis Turnos
                        </a>
                    </li>
                </ul>
                <div class="mt-5 px-3">
                    <button id="logout-btn" class="btn btn-outline-danger w-100">Cerrar Sesión</button>
                </div>
            </div>
        </nav>

        <!-- Contenido Principal -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2" id="page-title">Bienvenido, <span id="user-name-display"></span></h1>
            </div>

            <!-- Contenedores Dinámicos -->
            <div id="content-dashboard">
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="card text-white bg-primary">
                            <div class="card-body">
                                <h5 class="card-title">Turnos Hoy</h5>
                                <p class="card-text fs-2">0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="content-usuarios" class="d-none">
                <h3>Gestión de Usuarios</h3>
                <p>Solo Superadmin y Recepcionistas pueden ver esto.</p>
                <button class="btn btn-sm btn-primary mb-3" onclick="cargarUsuarios()">Refrescar Lista</button>
                <div class="table-responsive">
                    <table class="table table-striped table-sm">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol Actual</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-usuarios">
                            <!-- Los usuarios se llenarán con JS -->
                        </tbody>
                    </table>
                </div>
            </div>

        </main>
    </div>
</div>

<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<!-- Scripts Propios con Cache Busting -->
<script src="assets/js/firebase-config.js?v=<?php echo filemtime('assets/js/firebase-config.js'); ?>"></script>
<script src="assets/js/dashboard.js?v=<?php echo filemtime('assets/js/dashboard.js'); ?>"></script>
</body>
</html>
