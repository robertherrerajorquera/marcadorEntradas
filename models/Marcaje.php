<?php
class Marcaje {
    private $conn;
    private $table_name = "marcajes";

    public $id;
    public $usuario_id;
    public $tipo;
    public $timestamp;
    public $latitud;
    public $longitud;
    public $photo_url;
    public $modified;
    public $modified_by;
    public $modified_at;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear un nuevo marcaje
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                (usuario_id, tipo, timestamp, latitud, longitud, photo_url)
                VALUES
                (:usuario_id, :tipo, :timestamp, :latitud, :longitud, :photo_url)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->usuario_id = htmlspecialchars(strip_tags($this->usuario_id));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->timestamp = htmlspecialchars(strip_tags($this->timestamp));
        $this->latitud = htmlspecialchars(strip_tags($this->latitud));
        $this->longitud = htmlspecialchars(strip_tags($this->longitud));
        $this->photo_url = htmlspecialchars(strip_tags($this->photo_url));

        // Vincular valores
        $stmt->bindParam(":usuario_id", $this->usuario_id);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":timestamp", $this->timestamp);
        $stmt->bindParam(":latitud", $this->latitud);
        $stmt->bindParam(":longitud", $this->longitud);
        $stmt->bindParam(":photo_url", $this->photo_url);

        // Ejecutar consulta
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Actualizar un marcaje (para correcciones)
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    tipo = :tipo,
                    timestamp = :timestamp,
                    latitud = :latitud,
                    longitud = :longitud,
                    photo_url = :photo_url,
                    modified = TRUE,
                    modified_by = :modified_by,
                    modified_at = NOW()
                WHERE
                    id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->timestamp = htmlspecialchars(strip_tags($this->timestamp));
        $this->latitud = htmlspecialchars(strip_tags($this->latitud));
        $this->longitud = htmlspecialchars(strip_tags($this->longitud));
        $this->photo_url = htmlspecialchars(strip_tags($this->photo_url));
        $this->modified_by = htmlspecialchars(strip_tags($this->modified_by));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular valores
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":timestamp", $this->timestamp);
        $stmt->bindParam(":latitud", $this->latitud);
        $stmt->bindParam(":longitud", $this->longitud);
        $stmt->bindParam(":photo_url", $this->photo_url);
        $stmt->bindParam(":modified_by", $this->modified_by);
        $stmt->bindParam(":id", $this->id);

        // Ejecutar consulta
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Leer un marcaje por ID
    public function readOne() {
        $query = "SELECT m.id, m.usuario_id, m.tipo, m.timestamp, m.latitud, m.longitud, 
                        m.photo_url, m.modified, m.modified_by, m.modified_at, m.created_at,
                        u.nombre as usuario_nombre
                FROM " . $this->table_name . " m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.id = ?
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->usuario_id = $row['usuario_id'];
            $this->tipo = $row['tipo'];
            $this->timestamp = $row['timestamp'];
            $this->latitud = $row['latitud'];
            $this->longitud = $row['longitud'];
            $this->photo_url = $row['photo_url'];
            $this->modified = $row['modified'];
            $this->modified_by = $row['modified_by'];
            $this->modified_at = $row['modified_at'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    // Leer todos los marcajes
    public function read() {
        $query = "SELECT m.id, m.usuario_id, m.tipo, m.timestamp, m.latitud, m.longitud, 
                        m.photo_url, m.modified, m.modified_by, m.modified_at, m.created_at,
                        u.nombre as usuario_nombre
                FROM " . $this->table_name . " m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                ORDER BY m.timestamp DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Leer marcajes por usuario
    public function readByUsuario() {
        $query = "SELECT m.id, m.usuario_id, m.tipo, m.timestamp, m.latitud, m.longitud, 
                        m.photo_url, m.modified, m.modified_by, m.modified_at, m.created_at,
                        u.nombre as usuario_nombre
                FROM " . $this->table_name . " m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.usuario_id = ?
                ORDER BY m.timestamp DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->usuario_id);
        $stmt->execute();

        return $stmt;
    }

    // Leer marcajes por empresa
    public function readByEmpresa() {
        $query = "SELECT m.id, m.usuario_id, m.tipo, m.timestamp, m.latitud, m.longitud, 
                        m.photo_url, m.modified, m.modified_by, m.modified_at, m.created_at,
                        u.nombre as usuario_nombre, u.position, u.department
                FROM " . $this->table_name . " m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                WHERE u.empresa_id = ?
                ORDER BY m.timestamp DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->empresa_id);
        $stmt->execute();

        return $stmt;
    }

    // Leer marcajes con filtros (fecha, tipo)
    public function readWithFilters($fecha_inicio, $fecha_fin, $tipo, $empresa_id = null, $usuario_id = null) {
        $query = "SELECT m.id, m.usuario_id, m.tipo, m.timestamp, m.latitud, m.longitud, 
                        m.photo_url, m.modified, m.modified_by, m.modified_at, m.created_at,
                        u.nombre as usuario_nombre, u.position, u.department
                FROM " . $this->table_name . " m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                WHERE 1=1";

        // Agregar filtros si están presentes
        if($fecha_inicio && $fecha_fin) {
            $query .= " AND DATE(m.timestamp) BETWEEN :fecha_inicio AND :fecha_fin";
        }

        if($tipo) {
            $query .= " AND m.tipo = :tipo";
        }

        if($empresa_id) {
            $query .= " AND u.empresa_id = :empresa_id";
        }

        if($usuario_id) {
            $query .= " AND m.usuario_id = :usuario_id";
        }

        $query .= " ORDER BY m.timestamp DESC";

        $stmt = $this->conn->prepare($query);

        // Vincular parámetros si están presentes
        if($fecha_inicio && $fecha_fin) {
            $stmt->bindParam(":fecha_inicio", $fecha_inicio);
            $stmt->bindParam(":fecha_fin", $fecha_fin);
        }

        if($tipo) {
            $stmt->bindParam(":tipo", $tipo);
        }

        if($empresa_id) {
            $stmt->bindParam(":empresa_id", $empresa_id);
        }

        if($usuario_id) {
            $stmt->bindParam(":usuario_id", $usuario_id);
        }

        $stmt->execute();

        return $stmt;
    }
}
?>