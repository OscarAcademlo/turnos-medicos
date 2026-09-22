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
        // Verificar si el usuario ya existe en la base de datos por email o uid
        $query = "SELECT id, rol, nombre, firebase_uid FROM usuarios WHERE email = :email LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            // Usuario existe, obtener sus datos
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Si el UID de firebase guardado es un temp (creado por admin) o nulo, actualizarlo
            if ($row['firebase_uid'] !== $uid) {
                $update_query = "UPDATE usuarios SET firebase_uid = :uid WHERE id = :id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(":uid", $uid);
                $update_stmt->bindParam(":id", $row['id']);
                $update_stmt->execute();
            }
            
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
            // Capturar datos extras si vienen
            $apellido = !empty($data->apellido) ? $data->apellido : "";
            $dni = !empty($data->dni) ? $data->dni : null;
            $fecha_nacimiento = !empty($data->fecha_nacimiento) ? $data->fecha_nacimiento : null;
            $telefono = !empty($data->telefono) ? $data->telefono : null;

            // Usuario NO existe, lo registramos por primera vez (como paciente por defecto)
            $query = "INSERT INTO usuarios (firebase_uid, email, nombre, apellido, dni, fecha_nacimiento, telefono) VALUES (:uid, :email, :nombre, :apellido, :dni, :fecha_nacimiento, :telefono)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":uid", $uid);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":nombre", $nombre);
            $stmt->bindParam(":apellido", $apellido);
            $stmt->bindParam(":dni", $dni);
            $stmt->bindParam(":fecha_nacimiento", $fecha_nacimiento);
            $stmt->bindParam(":telefono", $telefono);

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
