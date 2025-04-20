<?php
session_start();

if (!isset($_SESSION['usuario'])) {
  http_response_code(401);
  echo json_encode(['erro' => 'Usuário não autenticado']);
  exit;
}

$usuario = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['usuario']);
$caminho = __DIR__ . "/listas_de_envio/sessao-{$usuario}.json";

// Zera o conteúdo do arquivo se existir
file_put_contents($caminho, json_encode([
  'mensagem' => '',
  'contatos' => []
]));

echo json_encode(['ok' => true]);
