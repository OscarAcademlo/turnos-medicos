<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin', 'recepcionista'])) {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Auto-healing: asegurarse de que unidades_atencion existe y que horarios_medicos tiene unidad_id
try {
    $db->exec("CREATE TABLE IF NOT EXISTS unidades_atencion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        calle VARCHAR(150) NULL,
        numero VARCHAR(20) NULL,
        localidad VARCHAR(100) NULL,
        activa TINYINT(1) DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    // Agregar columna unidad_id si no existe
    $cols = $db->query("SHOW COLUMNS FROM horarios_medicos LIKE 'unidad_id'")->fetchAll();
    if(empty($cols)) {
        $db->exec("ALTER TABLE horarios_medicos ADD COLUMN unidad_id INT NULL");
    }
} catch(Exception $e) { /* silencioso */ }

switch($method) {
    case 'GET':
        $medico_id = $_GET['medico_id'] ?? null;
        if(!$medico_id) {
            http_response_code(400);
            echo json_encode(["message" => "medico_id requerido."]);
            exit();
        }
        $query = "
            SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, h.duracion_turno_minutos,
                   h.unidad_id, u.nombre as unidad_nombre
            FROM horarios_medicos h
            LEFT JOIN unidades_atencion u ON h.unidad_id = u.id
            WHERE h.medico_id = :medico_id
            ORDER BY FIELD(h.dia_semana, 'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')
        ";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":medico_id", $medico_id);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        if(empty($data->medico_id) || !isset($data->horarios)) {
            http_response_code(400);
            echo json_encode(["message" => "medico_id y horarios son requeridos."]);
            exit();
        }

        try {
            $db->beginTransaction();

            // Borrar horarios anteriores del médico
            $del = $db->prepare("DELETE FROM horarios_medicos WHERE medico_id = :medico_id");
            $del->bindParam(":medico_id", $data->medico_id);
            $del->execute();

            // Insertar los nuevos
            foreach($data->horarios as $h) {
                if(empty($h->dia_semana) || empty($h->hora_inicio) || empty($h->hora_fin)) continue;
                
                $ins = $db->prepare("
                    INSERT INTO horarios_medicos (medico_id, dia_semana, hora_inicio, hora_fin, duracion_turno_minutos, unidad_id)
                    VALUES (:medico_id, :dia, :inicio, :fin, :duracion, :unidad_id)
                ");
                $duracion = $h->duracion_turno_minutos ?? 30;
                $unidad_id = !empty($h->unidad_id) ? $h->unidad_id : null;
                $ins->bindParam(":medico_id", $data->medico_id);
                $ins->bindParam(":dia", $h->dia_semana);
                $ins->bindParam(":inicio", $h->hora_inicio);
                $ins->bindParam(":fin", $h->hora_fin);
                $ins->bindParam(":duracion", $duracion);
                $ins->bindParam(":unidad_id", $unidad_id);
                $ins->execute();
            }

            $db->commit();
            echo json_encode(["message" => "Horarios guardados exitosamente."]);
        } catch(PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Error al guardar horarios.", "error" => $e->getMessage()]);
        }
        break;
}
?>
