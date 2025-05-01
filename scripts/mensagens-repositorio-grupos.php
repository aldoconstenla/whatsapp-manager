<?php
session_start();

$empresa = $_SESSION['empresa'] ?? null;
if (!$empresa) {
  http_response_code(403);
  echo json_encode(['erro' => 'Empresa não identificada']);
  exit;
}

$empresa = preg_replace('/[^a-z0-9_-]/i', '', $empresa);
$dirEmpresa = __DIR__ . "/listas_de_envio/{$empresa}";

if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

$arquivo = "{$dirEmpresa}/repo_mensagens_grupos.json";

// Garante existência do arquivo
if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([]));
}

$mensagens = json_decode(file_get_contents($arquivo), true);

// SALVAR NOVA
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $titulo = trim($input['titulo'] ?? '');
  $mensagem = trim($input['mensagem'] ?? '');

  if (!$titulo || !$mensagem) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'Título ou mensagem ausente.']);
    exit;
  }

  $mensagens[] = [
    'titulo' => $titulo,
    'mensagem' => $mensagem
  ];

  file_put_contents($arquivo, json_encode($mensagens, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  echo json_encode(['ok' => true]);
  exit;
}

// EXCLUIR
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $input = json_decode(file_get_contents('php://input'), true);
  $index = $input['index'] ?? -1;

  if (!isset($mensagens[$index])) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'erro' => 'Índice inválido ou inexistente.']);
    exit;
  }

  array_splice($mensagens, $index, 1);
  file_put_contents($arquivo, json_encode($mensagens, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  echo json_encode(['ok' => true]);
  exit;
}

// LISTAR
header('Content-Type: application/json');
echo json_encode($mensagens);
