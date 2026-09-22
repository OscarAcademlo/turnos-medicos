<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Recibir los datos JSON del frontend
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->firebase_uid) && !empty($data->email)) {
    $uid = $data->firebase_uid;
    $email = $data->email;
    $nombre = !empty($data->nombre) ? $data->nombre : "Usuario";

    try {
        // Verificar si el usuario ya existe en la base de datos
        $query = "SELECT id, rol, nombre FROM usuarios WHERE firebase_uid = :uid LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":uid", $uid);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            // Usuario existe, obtener sus datos
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Iniciar sesión en PHP
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['rol'] = $row['rol'];
            $_SESSION['nombre'] = $row['nombre'];

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login exitoso.",
                "user" => array(
                    "id" => $row['id'],
                    "nombre" => $row['nombre'],
                    "rol" => $row['rol']
                )
            ));
        } else {
            // Usuario NO existe, lo registramos por primera vez (como paciente por defecto)
            $query = "INSERT INTO usuarios (firebase_uid, email, nombre) VALUES (:uid, :email, :nombre)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":uid", $uid);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":nombre", $nombre);

            if($stmt->execute()) {
                $new_id = $db->lastInsertId();
                
                $_SESSION['user_id'] = $new_id;
                $_SESSION['rol'] = 'paciente';
                $_SESSION['nombre'] = $nombre;

                http_response_code(201);
                echo json_encode(array(
                    "message" => "Usuario registrado e inició sesión exitosamente.",
                    "user" => array(
                        "id" => $new_id,
                        "nombre" => $nombre,
                        "rol" => 'paciente'
                    )
                ));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "No se pudo registrar el usuario."));
            }
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error de base de datos: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos incompletos. Se requiere firebase_uid y email."));
}
?>
