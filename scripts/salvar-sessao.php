<?php
session_start();

// Verifica se a empresa está presente na sessão
if (!isset($_SESSION['empresa'])) {
  http_response_code(403);
  echo json_encode(['ok' => false, 'erro' => 'Empresa não autenticada.']);
  exit;
}

// Recebe os dados da requisição
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['usuario']) || !is_string($input['usuario'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'erro' => 'Usuário não especificado.']);
  exit;
}

$empresa = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['empresa']);
$usuario = preg_replace('/[^a-z0-9_-]/i', '', $input['usuario']);
$mensagem = $input['mensagem'] ?? '';
$contatos = $input['contatos'] ?? [];

$dados = [
  'mensagem' => $mensagem,
  'contatos' => $contatos
];

// Cria diretório por empresa, se não existir
$dirEmpresa = __DIR__ . "/listas_de_envio/{$empresa}";
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

$caminho = "{$dirEmpresa}/sessao-{$usuario}.json";

// Tenta salvar a sessão
try {
  file_put_contents($caminho, json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  echo json_encode(['ok' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'erro' => 'Erro ao salvar: ' . $e->getMessage()]);
}
