<?php
session_start();

if (!isset($_SESSION['usuario'], $_SESSION['empresa'])) {
  http_response_code(401);
  echo json_encode(['erro' => 'Usuário ou empresa não autenticado(s)']);
  exit;
}

$usuario = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['usuario']);
$empresa = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['empresa']);

$dirEmpresa = __DIR__ . "/listas_de_envio/{$empresa}";
$caminho = "{$dirEmpresa}/sessao-{$usuario}.json";

// Garante que o diretório da empresa existe
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

// Zera o conteúdo do arquivo
file_put_contents($caminho, json_encode([
  'mensagem' => '',
  'contatos' => []
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(['ok' => true]);
