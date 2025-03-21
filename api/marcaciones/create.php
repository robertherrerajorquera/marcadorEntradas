<?php
// Encabezados requeridos
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Marcaje.php';

// Asegurarse de que no haya salida antes de los encabezados
ob_clean();

// Instanciar conexión a la base de datos
$database = new Database();
$db = $database->getConnection();

// Instanciar objeto marcación
$marcacion = new Marcacion($db);

// Obtener datos enviados
$data = json_decode(file_get_contents("php://input"));

// Verificar que los datos no estén vacíos
if(
  !empty($data->usuario_id) &&
  !empty($data->tipo)
) {
  // Asignar valores al objeto marcación
  $marcacion->usuario_id = $data->usuario_id;
  $marcacion->tipo = $data->tipo;
  $marcacion->latitud = $data->latitud ?? null;
  $marcacion->longitud = $data->longitud ?? null;
  $marcacion->photo_url = $data->photo_url ?? null;
  $marcacion->timestamp = date('Y-m-d H:i:s'); // Fecha y hora actual
  

  // Crear la marcación
  if($id = $marcacion->create()) {
      // Respuesta - creado con éxito
      http_response_code(201);
      echo json_encode(array(
          "message" => "Marcación registrada con éxito.",
          "id" => $id,
          "timestamp" => $marcacion->timestamp
      ));
  } else {
      // Respuesta - error al crear
      http_response_code(503);
      echo json_encode(array(
          "message" => "No se pudo registrar la marcación.",
          "error" => "DATABASE_ERROR"
      ));
  }
} else {
  // Respuesta - datos incompletos
  http_response_code(400);
  echo json_encode(array(
      "message" => "No se puede registrar la marcación. Datos incompletos.",
      "error" => "INCOMPLETE_DATA",
      "received" => $data
  ));
}
?>

