<?php
session_start();

if (!isset($_SESSION['usuario'])) {
  http_response_code(401);
  echo json_encode(['erro' => 'Usuário não autenticado']);
  exit;
}

$usuario = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['usuario']);
$caminho = __DIR__ . "/listas_de_envio/sessao-{$usuario}.json";

if (!file_exists($caminho)) {
  echo json_encode(['mensagem' => '', 'contatos' => []]);
  exit;
}

$dados = json_decode(file_get_contents($caminho), true);

echo json_encode([
  'mensagem' => $dados['mensagem'] ?? '',
  'contatos' => $dados['contatos'] ?? []
]);
