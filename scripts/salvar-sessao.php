<?php
session_start();

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($_SESSION['empresa'], $_SESSION['usuario'])) {
  http_response_code(403);
  echo json_encode(['ok' => false, 'erro' => 'Sessão inválida.']);
  exit;
}

$empresa = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['empresa']);
$usuario = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['usuario']);
$mensagem = $input['mensagem'] ?? '';
$contatos = $input['contatos'] ?? [];

$dados = [
  'mensagem' => $mensagem,
  'contatos' => $contatos
];

$dirEmpresa = __DIR__ . "/../listas_de_envio/{$empresa}";
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

$caminho = "{$dirEmpresa}/sessao-{$usuario}.json";

try {
  file_put_contents($caminho, json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  echo json_encode(['ok' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'erro' => 'Erro ao salvar: ' . $e->getMessage()]);
}
