<?php
$nome = preg_replace('/[^a-zA-Z0-9_-]/', '_', $_GET['nome'] ?? '');
session_start();
$empresa = $_SESSION['empresa'] ?? null;

$caminho = __DIR__ . "/../listas_de_envio/{$empresa}/lista-{$nome}.json";

if (!file_exists($caminho)) {
  http_response_code(404);
  echo json_encode([]);
  exit;
}

echo file_get_contents($caminho);
