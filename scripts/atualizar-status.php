<?php
session_start();

// Verifica se veio um corpo de requisição válido
$input = json_decode(file_get_contents('php://input'), true);

// Validação mínima
if (!isset($input['usuario'])) {
  http_response_code(400);
  echo json_encode(['erro' => 'Usuário não informado.']);
  exit;
}

// Define caminho do status para esse usuário
$usuario = preg_replace('/[^a-z0-9_-]/i', '', $input['usuario']);
$statusPath = __DIR__ . "/status/status-{$usuario}.json";

// Caso seja um reset (disparo de "limpar")
if ($input === [] || (isset($input['reset']) && $input['reset'] === true)) {
  file_put_contents($statusPath, json_encode([]));
  echo json_encode(['ok' => true, 'resetado' => true]);
  exit;
}

// Validação do corpo normal
if (!isset($input['telefone']) || !isset($input['status'])) {
  http_response_code(400);
  echo json_encode(['erro' => 'Faltando telefone ou status.']);
  exit;
}

$telefone = preg_replace('/\D/', '', $input['telefone']);
$status = strtolower(trim($input['status']));

// Carrega status atual
$dados = file_exists($statusPath) ? json_decode(file_get_contents($statusPath), true) : [];

// Atualiza
$dados[$telefone] = $status;

// Salva de volta
file_put_contents($statusPath, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Sucesso
echo json_encode(['ok' => true]);
