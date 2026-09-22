<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost'); // En Hostinger suele ser localhost
define('DB_NAME', 'u237313556_turnos_medicos'); // Nombre de BD actualizado según tu phpMyAdmin
define('DB_USER', 'root'); // Cambiar por el usuario de la DB en producción
define('DB_PASS', ''); // Cambiar por la contraseña de la DB en producción

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            // Activar excepciones en errores PDO
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>
