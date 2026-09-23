<?php
include_once 'backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $sql = file_get_contents('update_db_admin.sql');
    $db->exec($sql);
    echo "Successfully executed update_db_admin.sql\n";
    // self-delete
    unlink(__FILE__);
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
