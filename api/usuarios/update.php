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
    !empty($data->id) &&
    !empty($data->nombre) &&
    !empty($data->email) &&
    isset($data->role) // Ahora verificamos que role esté definido (puede ser 0)
) {
    // Asignar valores al objeto usuario
    $usuario->id = $data->id;
    $usuario->nombre = $data->nombre;
    $usuario->email = $data->email;
    $usuario->role = (string)$data->role; // Convertir a entero (0=empleador, 1=empleado)
    $usuario->empresa_id = $data->empresa_id ?? null;
    $usuario->position = $data->position ?? null;
    $usuario->department = $data->department ?? null;
    $usuario->active = $data->active ?? 1;

    // Actualizar el usuario
    if($usuario->update()) {
        // Respuesta - actualizado con éxito
        http_response_code(200);
        echo json_encode(array("message" => "Usuario actualizado con éxito."));
    } else {
        // Respuesta - error al actualizar
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar el usuario."));
    }
} else {
    // Respuesta - datos incompletos
    http_response_code(400);
    echo json_encode(array("message" => "No se puede actualizar el usuario. Datos incompletos."));
}
?>

