<?php
session_start();

$input = json_decode(file_get_contents('php://input'), true);

// Tenta obter o nome do usuário do corpo ou da sessão
$usuario = isset($input['usuario']) ? $input['usuario'] : ($_SESSION['usuario'] ?? null);

if (!$usuario) {
  http_response_code(400);
  echo json_encode(['erro' => 'Usuário não informado.']);
  exit;
}

$usuario = preg_replace('/[^a-z0-9_-]/i', '', $usuario);
$statusPath = __DIR__ . "/status/status-{$usuario}.json";

// Se for resetar tudo
if ($input === [] || (isset($input['reset']) && $input['reset'] === true)) {
  file_put_contents($statusPath, json_encode([]));
  echo json_encode(['ok' => true, 'resetado' => true]);
  exit;
}

// Validação de status individual
if (!isset($input['telefone']) || !isset($input['status'])) {
  http_response_code(400);
  echo json_encode(['erro' => 'Faltando telefone ou status.']);
  exit;
}

$telefone = preg_replace('/\D/', '', $input['telefone']);
$status = strtolower(trim($input['status']));

// Carrega dados existentes
$dados = file_exists($statusPath) ? json_decode(file_get_contents($statusPath), true) : [];

// Atualiza status
$dados[$telefone] = $status;

// Salva
file_put_contents($statusPath, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => true]);
