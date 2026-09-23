<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin'])) {
        http_response_code(403);
        echo json_encode(["message" => "Acceso denegado."]);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

switch($method) {
    case 'GET':
        $query = "SELECT id, nombre, calle, numero, localidad, activa FROM unidades_atencion ORDER BY nombre ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        if(!empty($data->nombre)) {
            if(!empty($data->id)) {
                // UPDATE
                $query = "UPDATE unidades_atencion SET nombre=:nombre, calle=:calle, numero=:numero, localidad=:localidad WHERE id=:id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":id", $data->id);
            } else {
                // INSERT
                $query = "INSERT INTO unidades_atencion (nombre, calle, numero, localidad) VALUES (:nombre, :calle, :numero, :localidad)";
                $stmt = $db->prepare($query);
            }
            $stmt->bindParam(":nombre", $data->nombre);
            $calle = $data->calle ?? null;
            $numero = $data->numero ?? null;
            $localidad = $data->localidad ?? null;
            $stmt->bindParam(":calle", $calle);
            $stmt->bindParam(":numero", $numero);
            $stmt->bindParam(":localidad", $localidad);

            if($stmt->execute()) {
                $id = !empty($data->id) ? $data->id : $db->lastInsertId();
                http_response_code(!empty($data->id) ? 200 : 201);
                echo json_encode(["message" => "Sede guardada exitosamente.", "id" => $id]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo guardar la sede."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "El nombre es obligatorio."]);
        }
        break;

    case 'DELETE':
        if(!empty($data->id)) {
            $query = "DELETE FROM unidades_atencion WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            if($stmt->execute()) {
                echo json_encode(["message" => "Sede eliminada."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo eliminar. Puede que esté en uso."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID requerido."]);
        }
        break;
}
?>
