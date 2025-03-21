<?php
// Encabezados requeridos
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Usuario.php';

// Instanciar conexión a la base de datos
$database = new Database();
$db = $database->getConnection();

// Instanciar objeto usuario
$usuario = new Usuario($db);

// Obtener datos enviados
$data = json_decode(file_get_contents("php://input"));

// Verificar que los datos no estén vacíos
if(
    !empty($data->nombre) &&
    !empty($data->email) &&
    !empty($data->password) &&
    isset($data->role) // Ahora verificamos que role esté definido (puede ser 0)
) {
    // Asignar valores al objeto usuario
    $usuario->nombre = $data->nombre;
    $usuario->email = $data->email;
    $usuario->password = $data->password;
    $usuario->role = (string)$data->role; // Convertir a entero (0=empleador, 1=empleado)
    $usuario->empresa_id = $data->empresa_id ?? null;
    $usuario->position = $data->position ?? null;
    $usuario->department = $data->department ?? null;

    // Verificar si el email ya existe
    $usuario->email = $data->email;
    if($usuario->emailExists()) {
        // Respuesta - email ya existe
        http_response_code(400);
        echo json_encode(array("message" => "El email ya está registrado."));
        exit();
    }

    // Crear el usuario
    if($usuario->create()) {
        // Respuesta - creado con éxito
        http_response_code(201);
        echo json_encode(array("message" => "Usuario creado con éxito."));
    } else {
        // Respuesta - error al crear
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo crear el usuario."));
    }
} else {
    // Respuesta - datos incompletos
    http_response_code(400);
    echo json_encode(array("message" => "No se puede crear el usuario. Datos incompletos."));
}
?>

