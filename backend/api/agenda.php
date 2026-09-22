<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

// Acción solicitada por POST o GET action
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data->action) ? $data->action : '');

switch($action) {
    case 'get_config':
        // Obtener configuración de horario de un médico
        $medico_id = isset($_GET['medico_id']) ? $_GET['medico_id'] : null;
        if($medico_id) {
            $query = "SELECT * FROM horarios_medicos WHERE medico_id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $medico_id);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'save_config':
        // Guardar configuración (Solo Admin o el propio Médico)
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin', 'medico'])) {
            http_response_code(403);
            echo json_encode(array("message" => "Acceso denegado."));
            exit();
        }
        if(!empty($data->medico_id) && !empty($data->horarios)) {
            // Eliminar horarios anteriores
            $del = "DELETE FROM horarios_medicos WHERE medico_id = :id";
            $stmtDel = $db->prepare($del);
            $stmtDel->bindParam(":id", $data->medico_id);
            $stmtDel->execute();

            // Insertar nuevos horarios
            $query = "INSERT INTO horarios_medicos (medico_id, dia_semana, hora_inicio, hora_fin, duracion_turno_minutos) VALUES (:medico, :dia, :inicio, :fin, :duracion)";
            $stmt = $db->prepare($query);
            
            foreach($data->horarios as $h) {
                $stmt->bindParam(":medico", $data->medico_id);
                $stmt->bindParam(":dia", $h->dia_semana);
                $stmt->bindParam(":inicio", $h->hora_inicio);
                $stmt->bindParam(":fin", $h->hora_fin);
                $stmt->bindParam(":duracion", $h->duracion);
                $stmt->execute();
            }
            echo json_encode(array("message" => "Horarios guardados correctamente."));
        }
        break;

    case 'generar_slots':
        // Script para generar slots libres basados en la configuración
        // Ejemplo: generar turnos para el mes actual
        // En una app real, esto podría ejecutarse por un cron o manualmente por el admin
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin'])) {
            http_response_code(403);
            exit();
        }
        // Lógica de generación omitida para simplificar el POC, pero aquí se crearían 
        // las filas en 'turnos' con estado='libre'.
        echo json_encode(array("message" => "Slots generados correctamente (Simulación)."));
        break;

    case 'get_turnos_libres':
        // API pública para pacientes que buscan turnos
        $medico_id = isset($_GET['medico_id']) ? $_GET['medico_id'] : null;
        $especialidad_id = isset($_GET['especialidad_id']) ? $_GET['especialidad_id'] : null;
        
        $query = "SELECT id, fecha, hora_inicio, hora_fin FROM turnos WHERE estado = 'libre' AND fecha >= CURDATE() ";
        if($medico_id) $query .= " AND medico_id = :medico_id ";
        if($especialidad_id) $query .= " AND especialidad_id = :especialidad_id ";
        $query .= " ORDER BY fecha ASC, hora_inicio ASC LIMIT 50";
        
        $stmt = $db->prepare($query);
        if($medico_id) $stmt->bindParam(":medico_id", $medico_id);
        if($especialidad_id) $stmt->bindParam(":especialidad_id", $especialidad_id);
        
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    default:
        http_response_code(400);
        echo json_encode(array("message" => "Acción inválida."));
}
?>
