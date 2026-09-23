<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    $cols = $db->query("DESCRIBE turnos")->fetchAll(PDO::FETCH_ASSOC);
    $turnos_rows = $db->query("SELECT * FROM turnos ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        "columns" => $cols,
        "recent_turnos" => $turnos_rows
    ], JSON_PRETTY_PRINT);
} catch(Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
