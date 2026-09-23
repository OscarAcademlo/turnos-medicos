<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin'])) {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso denegado."));
    exit();
}

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->usuario_id) && isset($data->planes)) {
    $db->beginTransaction();
    
    try {
        // 1. Eliminar coberturas anteriores (planes)
        $q_del = "DELETE FROM medicos_planes WHERE usuario_id = :id";
        $stmt_del = $db->prepare($q_del);
        $stmt_del->bindParam(":id", $data->usuario_id);
        $stmt_del->execute();
        
        // 2. Eliminar obras sociales anteriores
        $q_del_os = "DELETE FROM medicos_obras_sociales WHERE usuario_id = :id";
        $stmt_del_os = $db->prepare($q_del_os);
        $stmt_del_os->bindParam(":id", $data->usuario_id);
        $stmt_del_os->execute();
        
        if (count($data->planes) > 0) {
            // 3. Insertar nuevos planes y obtener sus obras sociales
            $q_ins = "INSERT INTO medicos_planes (usuario_id, plan_id) VALUES (:uid, :pid)";
            $stmt_ins = $db->prepare($q_ins);
            
            $obras_sociales = []; // para almacenar os unicas
            
            foreach($data->planes as $pid) {
                $stmt_ins->bindParam(":uid", $data->usuario_id);
                $stmt_ins->bindParam(":pid", $pid);
                $stmt_ins->execute();
                
                // Obtener OS de este plan
                $q_os = "SELECT obra_social_id FROM planes_obras_sociales WHERE id = :pid";
                $stmt_os = $db->prepare($q_os);
                $stmt_os->bindParam(":pid", $pid);
                $stmt_os->execute();
                $os_id = $stmt_os->fetchColumn();
                if ($os_id) {
                    $obras_sociales[$os_id] = true;
                }
            }
            
            // 4. Insertar OS correspondientes para que los joins básicos funcionen si es necesario
            $q_ins_os = "INSERT IGNORE INTO medicos_obras_sociales (usuario_id, obra_social_id) VALUES (:uid, :os_id)";
            $stmt_ins_os = $db->prepare($q_ins_os);
            foreach(array_keys($obras_sociales) as $osid) {
                $stmt_ins_os->bindParam(":uid", $data->usuario_id);
                $stmt_ins_os->bindParam(":os_id", $osid);
                $stmt_ins_os->execute();
            }
        }
        
        $db->commit();
        echo json_encode(array("message" => "Coberturas actualizadas correctamente."));
    } catch(Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("message" => "Error al actualizar coberturas.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos incompletos."));
}
?>
