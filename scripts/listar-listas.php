<?php
session_start();

$empresa = $_SESSION['empresa'] ?? null;

if (!$empresa) {
  echo json_encode([]);
  exit;
}

$dir = __DIR__ . "/../listas_de_envio/{$empresa}";
if (!is_dir($dir)) {
  echo json_encode([]);
  exit;
}

$arquivos = glob($dir . '/lista-*.json');
$listas = [];

foreach ($arquivos as $arquivo) {
  $nome = basename($arquivo);
  $nome = preg_replace('/^lista-/', '', $nome);
  $nome = preg_replace('/\.json$/', '', $nome);
  $listas[] = $nome;
}

echo json_encode($listas);
