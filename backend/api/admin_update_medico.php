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

if(!empty($data->id)) {
    $query = "UPDATE usuarios SET ";
    $params = [];
    $updates = [];
    
    if(isset($data->biografia)) {
        $updates[] = "biografia = :biografia";
        $params[':biografia'] = $data->biografia;
    }
    if(isset($data->direccion)) {
        $updates[] = "direccion = :direccion";
        $params[':direccion'] = $data->direccion;
    }
    if(isset($data->matricula)) {
        $updates[] = "matricula = :matricula";
        $params[':matricula'] = $data->matricula;
    }
    if(isset($data->foto_perfil)) {
        $updates[] = "foto_perfil = :foto_perfil";
        $params[':foto_perfil'] = $data->foto_perfil;
    }
    
    if(count($updates) > 0) {
        $query .= implode(", ", $updates) . " WHERE id = :id AND rol = 'medico'";
        $params[':id'] = $data->id;
        
        $stmt = $db->prepare($query);
        foreach($params as $key => &$val) {
            $stmt->bindParam($key, $val);
        }
        
        if($stmt->execute()) {
            echo json_encode(array("message" => "Médico actualizado exitosamente."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Error al actualizar médico."));
        }
    } else {
        echo json_encode(array("message" => "No hay campos para actualizar."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "ID de médico requerido."));
}
?>
