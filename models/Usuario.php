<?php
class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public $id;
    public $nombre;
    public $email;
    public $password;
    public $role; // 0=empleador, 1=empleado
    public $empresa_id;
    public $position;
    public $department;
    public $active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear un nuevo usuario
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                (nombre, email, password, role, empresa_id, position, department, status_employee)
                VALUES
                (:nombre, :email, :password, :role, :empresa_id, :position, :department, :status_employee)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->role = (string)$this->role; // Asegurar que role sea un entero (0 o 1)
        $this->empresa_id = htmlspecialchars(strip_tags($this->empresa_id));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->department = htmlspecialchars(strip_tags($this->department));
        $this->status_employee = htmlspecialchars(strip_tags($this->status_employee));

        // Vincular valores
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":role", $this->role, PDO::PARAM_INT);
        $stmt->bindParam(":empresa_id", $this->empresa_id);
        $stmt->bindParam(":position", $this->position);
        $stmt->bindParam(":department", $this->department);
        $stmt->bindParam(":status_employee", $this->status_employee);

        // Ejecutar consulta
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Actualizar un usuario
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    nombre = :nombre,
                    email = :email,
                    role = :role,
                    empresa_id = :empresa_id,
                    position = :position,
                    department = :department,
                    active = :active,
                    status_employee = :status_employee
                WHERE
                    id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = (string)$this->role; // Asegurar que role sea un entero (0 o 1)
        $this->empresa_id = htmlspecialchars(strip_tags($this->empresa_id));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->department = htmlspecialchars(strip_tags($this->department));
        $this->active = htmlspecialchars(strip_tags($this->active));
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->status_employee = htmlspecialchars(strip_tags($this->status_employee));

        // Vincular valores
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role, PDO::PARAM_INT);
        $stmt->bindParam(":empresa_id", $this->empresa_id);
        $stmt->bindParam(":position", $this->position);
        $stmt->bindParam(":department", $this->department);
        $stmt->bindParam(":active", $this->active);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":status_employee", $this->status_employee);

        // Ejecutar consulta
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Cambiar contraseña
    public function updatePassword() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    password = :password
                WHERE
                    id = :id";

        $stmt = $this->conn->prepare($query);

        // Hash de la contraseña
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular valores
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":id", $this->id);

        // Ejecutar consulta
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Leer un usuario por ID
    public function readOne() {
        $query = "SELECT u.id, u.nombre, u.email, u.role, u.empresa_id, u.position, u.department, u.active, 
                        e.nombre as empresa_nombre
                FROM " . $this->table_name . " u
                LEFT JOIN empresas e ON u.empresa_id = e.id
                WHERE u.id = ?
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->id = $row['id'];
            $this->nombre = $row['nombre'];
            $this->email = $row['email'];
            $this->role = $row['role'];
            $this->empresa_id = $row['empresa_id'];
            $this->position = $row['position'];
            $this->department = $row['department'];
            $this->active = $row['active'];
            $this->status_employee = $row['status_employee'];
            return true;
        }

        return false;
    }

    // Leer todos los usuarios
    public function read() {
        $query = "SELECT u.id, u.nombre, u.email, u.role, u.empresa_id, u.position, u.department, u.active, 
                        e.nombre as empresa_nombre
                FROM " . $this->table_name . " u
                LEFT JOIN empresas e ON u.empresa_id = e.id
                ORDER BY u.nombre ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Leer empleados por empresa
    public function readByEmpresa() {
        $query = "SELECT u.id, u.nombre, u.email, u.role, u.empresa_id, u.position, u.department, u.active
                FROM " . $this->table_name . " u
                WHERE u.empresa_id = ? AND u.role = 'employer'
                ORDER BY u.nombre ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->empresa_id);
        $stmt->execute();

        return $stmt;
    }

    // Verificar si existe un email
    public function emailExists() {
        $query = "SELECT id, nombre, email, password, role, empresa_id
                FROM " . $this->table_name . "
                WHERE email = ?
                LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        $num = $stmt->rowCount();

        if($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->id = $row['id'];
            $this->nombre = $row['nombre'];
            $this->email = $row['email'];
            $this->password = $row['password'];
            $this->role = $row['role'];
            $this->empresa_id = $row['empresa_id'];
            $this->status_employee = $row['status_employee'];
            return true;
        }

        return false;
    }
}
?>

