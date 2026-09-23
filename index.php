<!DOCTYPE html>
<html lang="es">
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
    
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Inter', sans-serif;
            color: #333;
        }
        
        .header {
            background-color: #0d8de0; /* Azul estilo Docturno */
            padding: 15px 20px;
            color: white;
            display: flex;
            align-items: center;
        }

        .header h1 {
            font-size: 1.5rem;
            margin: 0;
            font-weight: 700;
            display: flex;
            align-items: center;
        }

        .header h1 i {
            margin-right: 10px;
        }

        .main-title {
            text-align: center;
            font-weight: 300;
            margin: 40px 0;
            font-size: 1.8rem;
            color: #4a4a4a;
        }

        /* Filter Section */
        .filter-section {
            max-width: 1100px;
            margin: 0 auto 30px auto;
        }
        
        .filter-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 5px;
            display: block;
        }

        /* Doctor Card */
        .doctor-card {
            max-width: 1100px;
            margin: 0 auto 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            padding: 25px;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
        }

        .doctor-avatar-col {
            flex: 0 0 120px;
            text-align: center;
        }

        .doctor-avatar-col img {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #e9ecef;
        }

        .doctor-info-col {
            flex: 1 1 300px;
            padding: 0 20px;
        }

        .doctor-name {
            font-size: 1.3rem;
            color: #2c6686; /* Azul oscuro */
            margin-bottom: 5px;
            font-weight: 600;
        }

        .doctor-specialty {
            color: #6c757d;
            margin-bottom: 10px;
            font-size: 0.95rem;
        }

        .doctor-coberturas {
            font-size: 0.85rem;
            color: #999;
            margin-bottom: 10px;
        }

        .doctor-schedule-col {
            flex: 1 1 350px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 100px;
        }

        .schedule-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 4px;
        }

        .btn-agendar {
            background-color: #4b8b4b; /* Verde Docturno */
            color: white;
            font-weight: 600;
            border: none;
            padding: 10px 0;
            border-radius: 20px;
            width: 100%;
            margin-top: 15px;
            transition: background-color 0.2s;
        }

        .btn-agendar:hover {
            background-color: #3d753d;
            color: white;
        }

        @media (max-width: 768px) {
            .doctor-card {
                flex-direction: column;
            }
            .doctor-info-col {
                padding: 15px 0;
            }
            .doctor-schedule-col {
                width: 100%;
            }
        }
        
        .loading-spinner {
            text-align: center;
            padding: 50px;
            color: #6c757d;
        }
    </style>
</head>
<body>

    <header class="header d-flex justify-content-between">
        <h1><i class="bi bi-heart-pulse-fill"></i> Clínica Médica</h1>
        <a href="login.php" class="btn btn-outline-light btn-sm rounded-pill fw-bold" id="btn-login-nav">Iniciar Sesión / Registrarse</a>
    </header>

    <div class="container-fluid px-3 px-md-5">
        <h2 class="main-title">Elige el profesional que necesitas de Clínica Médica</h2>

        <!-- Buscador / Filtros -->
        <div class="row filter-section g-3">
            <div class="col-md-4">
                <label class="filter-label">Apellido o nombre</label>
                <input type="text" class="form-control" id="filter-nombre" placeholder="Por apellido o nombre del profesional...">
            </div>
            <div class="col-md-4">
                <label class="filter-label">Especialidad</label>
                <select class="form-select" id="filter-especialidad">
                    <option value="">especialidad...</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="filter-label">Cobertura médica</label>
                <select class="form-select" id="filter-cobertura">
                    <option value="">cobertura médica...</option>
                </select>
            </div>
        </div>

        <!-- Lista de Resultados -->
        <div id="results-container">
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mt-2">Cargando profesionales...</div>
            </div>
        </div>

    </div>

    <!-- Modals, Scripts, etc -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Lógica de Frontend -->
    <script src="assets/js/agenda_publica.js?v=<?php echo time(); ?>"></script>
</body>
</html>
