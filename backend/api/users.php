<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

// Verificar permisos (solo superadmin o recepcionista pueden ver todos los usuarios)
// En un sistema real de APIs, usaríamos un JWT enviado en los headers. 
// Para mantenerlo simple, confiamos en la sesión de PHP.
if (!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], ['superadmin', 'admin', 'recepcionista'])) {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso denegado. No tienes permisos suficientes."));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Leer usuarios
        $query = "SELECT id, email, nombre, rol, telefono, creado_en FROM usuarios ORDER BY nombre ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $usuarios = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($usuarios, $row);
        }
        echo json_encode($usuarios);
        break;

    case 'PUT':
        // Actualizar rol de un usuario (generalmente lo hace el superadmin)
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id) && !empty($data->rol)) {
            // Solo superadmin puede dar rol de superadmin a otro
            if ($data->rol === 'superadmin' && $_SESSION['rol'] !== 'superadmin') {
                http_response_code(403);
                echo json_encode(array("message" => "Solo un superadmin puede crear otro superadmin."));
                exit();
            }

            $query = "UPDATE usuarios SET rol = :rol WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':rol', $data->rol);
            $stmt->bindParam(':id', $data->id);
            
            if($stmt->execute()) {
                echo json_encode(array("message" => "Rol actualizado exitosamente."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Error al actualizar el usuario."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Datos incompletos. Se requiere ID y Rol."));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
        break;
}
?>
