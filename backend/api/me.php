<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión a la base de datos."]);
    exit();
}

// 1. Si hay sesión activa en PHP
if (isset($_SESSION['user_id'])) {
    try {
        $query = "SELECT id, nombre, email, rol, firebase_uid FROM usuarios WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $_SESSION['user_id']);
        $stmt->execute();
        
        if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $_SESSION['rol'] = $row['rol'];
            $_SESSION['nombre'] = $row['nombre'];
            echo json_encode(["user" => $row]);
            exit();
        }
    } catch(PDOException $e) {}
}

// 2. Auto-recuperación híbrida: si la cookie PHP expiró pero el cliente tiene credenciales locales
$headers = getallheaders();
$firebase_uid = $headers['X-Firebase-UID'] ?? $headers['x-firebase-uid'] ?? $_SERVER['HTTP_X_FIREBASE_UID'] ?? $_GET['firebase_uid'] ?? null;
$email = $headers['X-User-Email'] ?? $headers['x-user-email'] ?? $_SERVER['HTTP_X_USER_EMAIL'] ?? $_GET['email'] ?? null;

if (!empty($firebase_uid)) {
    $stmt = $db->prepare("SELECT id, nombre, email, rol, firebase_uid FROM usuarios WHERE firebase_uid = :fuid LIMIT 1");
    $stmt->execute([':fuid' => $firebase_uid]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['rol'] = $row['rol'];
        $_SESSION['nombre'] = $row['nombre'];
        echo json_encode(["user" => $row]);
        exit();
    }
}

if (!empty($email)) {
    $stmt = $db->prepare("SELECT id, nombre, email, rol, firebase_uid FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['rol'] = $row['rol'];
        $_SESSION['nombre'] = $row['nombre'];
        echo json_encode(["user" => $row]);
        exit();
    }
}

http_response_code(401);
echo json_encode(["message" => "No autenticado."]);
?>
