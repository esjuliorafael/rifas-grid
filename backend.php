<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$archivo = 'datos_rifa.json';
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    if (file_exists($archivo)) {
        echo file_get_contents($archivo);
    } else {
        echo json_encode([]); // Array vacío por defecto
    }
} 
elseif ($metodo === 'POST') {
    $datosRecibidos = file_get_contents("php://input");
    if (!empty($datosRecibidos)) {
        file_put_contents($archivo, $datosRecibidos);
        echo json_encode(["status" => "exito"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
}
?>