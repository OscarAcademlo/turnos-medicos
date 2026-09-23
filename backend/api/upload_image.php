<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin'])) {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso denegado."));
    exit();
}

$target_dir = "../../img/medicos/";

// Create directory if it does not exist
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if (!isset($_FILES["image"])) {
    http_response_code(400);
    echo json_encode(array("message" => "No se envió ninguna imagen."));
    exit();
}

$imageFileType = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
$valid_extensions = array("jpg", "jpeg", "png", "gif", "webp");

if (!in_array($imageFileType, $valid_extensions)) {
    http_response_code(400);
    echo json_encode(array("message" => "Solo se permiten archivos JPG, JPEG, PNG, GIF y WEBP."));
    exit();
}

// Check if image file is a actual image or fake image
$check = getimagesize($_FILES["image"]["tmp_name"]);
if($check === false) {
    http_response_code(400);
    echo json_encode(array("message" => "El archivo no es una imagen."));
    exit();
}

// Limit size to 5MB
if ($_FILES["image"]["size"] > 5000000) {
    http_response_code(400);
    echo json_encode(array("message" => "El archivo es demasiado grande (máx 5MB)."));
    exit();
}

// Generate unique name
$new_filename = uniqid("medico_") . "." . $imageFileType;
$target_file = $target_dir . $new_filename;

if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
    echo json_encode(array(
        "message" => "Archivo subido exitosamente.",
        "url" => "img/medicos/" . $new_filename
    ));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Ocurrió un error al subir el archivo."));
}
?>
