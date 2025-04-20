<?php
// Recebe os dados da requisição
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['usuario']) || !is_string($input['usuario'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'erro' => 'Usuário não especificado.']);
  exit;
}

$usuario = preg_replace('/[^a-z0-9_-]/i', '', $input['usuario']);
$mensagem = $input['mensagem'] ?? '';
$contatos = $input['contatos'] ?? [];

$dados = [
  'mensagem' => $mensagem,
  'contatos' => $contatos
];

$caminho = __DIR__ . "/listas_de_envio/sessao-{$usuario}.json";

// Tenta salvar
try {
  file_put_contents($caminho, json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  echo json_encode(['ok' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'erro' => 'Erro ao salvar: ' . $e->getMessage()]);
}
