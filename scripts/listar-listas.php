<?php
session_start();

$nomeEmpresa = $_SESSION['empresa'] ?? '';
$dirEmpresa = __DIR__ . "/listas_de_envio/$nomeEmpresa";

$listas = [];
if (is_dir($dirEmpresa)) {
  foreach (glob("$dirEmpresa/lista-*.json") as $arquivo) {
    $basename = basename($arquivo);
    if (preg_match('/lista-(.+)\.json$/', $basename, $m)) {
      $listas[] = $m[1];
    }
  }
}

header('Content-Type: application/json');
echo json_encode($listas);
