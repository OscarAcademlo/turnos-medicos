<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

// Verificar permisos (solo superadmin o admin) para operaciones destructivas
if ($method !== 'GET') {
    if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin'])) {
        http_response_code(403);
        echo json_encode(array("message" => "Acceso denegado."));
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

switch($method) {
    case 'GET':
        // Leer Obras Sociales
        $query = "SELECT id, nombre FROM obras_sociales ORDER BY nombre ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $obras = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($obras);
        break;

    case 'POST':
        // Crear Obra Social
        if(!empty($data->nombre)) {
            $query = "INSERT INTO obras_sociales (nombre) VALUES (:nombre)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":nombre", $data->nombre);
            if($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Obra Social creada.", "id" => $db->lastInsertId()));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "No se pudo crear. ¿Ya existe?"));
            }
        }
        break;

    case 'PUT':
        // Editar Obra Social
        if(!empty($data->id) && !empty($data->nombre)) {
            $query = "UPDATE obras_sociales SET nombre = :nombre WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":nombre", $data->nombre);
            $stmt->bindParam(":id", $data->id);
            if($stmt->execute()) {
                echo json_encode(array("message" => "Obra Social actualizada."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "No se pudo actualizar."));
            }
        }
        break;

    case 'DELETE':
        // Borrar Obra Social
        if(!empty($data->id)) {
            $query = "DELETE FROM obras_sociales WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            if($stmt->execute()) {
                echo json_encode(array("message" => "Obra Social eliminada."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "No se pudo eliminar. Puede que esté en uso."));
            }
        }
        break;
}
?>
