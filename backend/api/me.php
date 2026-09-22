<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

// Si no hay sesión iniciada
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "No autenticado."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT id, nombre, email, rol FROM usuarios WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $_SESSION['user_id']);
    $stmt->execute();
    
    if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Actualizar la sesión en caso de que el rol haya cambiado en la BD
        $_SESSION['rol'] = $row['rol'];
        $_SESSION['nombre'] = $row['nombre'];

        echo json_encode(["user" => $row]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos."]);
}
?>
