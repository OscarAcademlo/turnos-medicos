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
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $query = "SELECT id, firebase_uid, email, nombre, apellido, rol, contrasena FROM usuarios WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si el usuario tiene contraseña local
        if (!empty($user['contrasena'])) {
            if (password_verify($password, $user['contrasena'])) {
                // Contraseña válida
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['rol'] = $user['rol'];
                $_SESSION['email'] = $user['email'];
                
                // Quitamos el hash antes de devolver
                unset($user['contrasena']);

                http_response_code(200);
                echo json_encode(array(
                    "status" => "success",
                    "message" => "Inicio de sesión exitoso.",
                    "user" => $user
                ));
            } else {
                http_response_code(401);
                echo json_encode(array("status" => "error", "message" => "Contraseña incorrecta."));
            }
        } else {
            // El usuario existe pero no tiene contraseña local, por lo que debe loguearse con Firebase
            http_response_code(200);
            echo json_encode(array("status" => "use_firebase", "message" => "Este usuario debe iniciar sesión con Firebase."));
        }
    } else {
        // Usuario no existe en DB, puede que sea de Firebase
        http_response_code(200);
        echo json_encode(array("status" => "use_firebase", "message" => "Usuario no encontrado localmente, intentando con Firebase."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("status" => "error", "message" => "Datos incompletos. Faltan credenciales."));
}
?>
