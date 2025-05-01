<?php
session_start();

if (!isset($_SESSION['empresa'], $_SESSION['usuario'])) {
  http_response_code(403);
  echo json_encode(['mensagem' => '', 'contatos' => []]);
  exit;
}

$empresa = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['empresa']);
$usuario = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['usuario']);
$caminho = __DIR__ . "/../listas_de_envio/{$empresa}/sessao-{$usuario}.json";

if (!file_exists($caminho)) {
  echo json_encode(['mensagem' => '', 'contatos' => []]);
  exit;
}

echo file_get_contents($caminho);
