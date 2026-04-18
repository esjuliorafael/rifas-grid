<?php
/* -------------------------------------------------------------------------- */
/* CONFIGURACIÓN                               */
/* -------------------------------------------------------------------------- */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$archivo = 'datos_rifa.json';
$metodo = $_SERVER['REQUEST_METHOD'];

/* -------------------------------------------------------------------------- */
/* LÓGICA DE PETICIONES                        */
/* -------------------------------------------------------------------------- */

if ($metodo === 'GET') {
    // Leer datos
    if (file_exists($archivo)) {
        echo file_get_contents($archivo);
    } else {
        // NUEVA ESTRUCTURA POR DEFECTO
        echo json_encode([
            "config" => ["autoReleaseEnabled" => false, "releaseHours" => 24],
            "auditLog" => [],
            "raffles" => []
        ]);
    }
} 
elseif ($metodo === 'POST') {
    // Guardar datos
    $datosRecibidos = file_get_contents("php://input");
    
    if (!empty($datosRecibidos)) {
        file_put_contents($archivo, $datosRecibidos);
        echo json_encode(["status" => "exito"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
}
?>