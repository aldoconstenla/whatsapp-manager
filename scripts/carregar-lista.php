<?php
$nome = preg_replace('/[^a-zA-Z0-9_-]/', '_', $_GET['nome'] ?? '');
$caminho = __DIR__ . "/listas_de_envio/lista-{$nome}.json";

if (!file_exists($caminho)) {
  http_response_code(404);
  echo json_encode([]);
  exit;
}

echo file_get_contents($caminho);
