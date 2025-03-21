<?php
// Encabezados requeridos
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Marcacion.php';

// Instanciar conexión a la base de datos
$database = new Database();
$db = $database->getConnection();

// Instanciar objeto marcación
$marcacion = new Marcacion($db);

// Obtener parámetros de la solicitud
$usuario_id = isset($_GET['usuario_id']) ? $_GET['usuario_id'] : null;
$empresa_id = isset($_GET['empresa_id']) ? $_GET['empresa_id'] : null;
$fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : date('Y-m-d', strtotime('-30 days'));
$fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : date('Y-m-d');

// Verificar que al menos uno de los IDs esté presente
if(!$usuario_id && !$empresa_id) {
    // Respuesta - datos incompletos
    http_response_code(400);
    echo json_encode(array(
        "message" => "Se requiere usuario_id o empresa_id para consultar marcajes.",
        "error" => "MISSING_PARAMETER"
    ));
    exit();
}

// Array para almacenar los resultados
$marcajes_arr = array();
$marcajes_arr["records"] = array();

// Consultar marcajes según el parámetro proporcionado
if($usuario_id) {
    // Consultar por usuario
    $marcacion->usuario_id = $usuario_id;
    $stmt = $marcacion->readByUsuario($fecha_inicio, $fecha_fin);
} else {
    // Consultar por empresa
    $stmt = $marcacion->readByEmpresa($empresa_id, $fecha_inicio, $fecha_fin);
}

// Verificar si hay resultados
$num = $stmt->rowCount();

if($num > 0) {
    // Recorrer los resultados
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $marcacion_item = array(
            "id" => $id,
            "usuario_id" => $usuario_id,
            "usuario_nombre" => $usuario_nombre ?? null,
            "tipo" => $tipo,
            "timestamp" => $timestamp,
            "latitud" => $latitud,
            "longitud" => $longitud,
            "photo_url" => $photo_url,
            "modificado" => $modificado,
            "modificado_por" => $modificado_por,
            "modificado_en" => $modificado_en
        );

        array_push($marcajes_arr["records"], $marcacion_item);
    }

    // Respuesta - éxito
    http_response_code(200);
    echo json_encode($marcajes_arr);
} else {
    // Respuesta - no hay registros
    http_response_code(200);
    echo json_encode(array(
        "message" => "No se encontraron marcajes para el período especificado.",
        "records" => array()
    ));
}
?>

