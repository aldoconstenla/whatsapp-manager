<?php
session_start();
$dados = json_decode(file_get_contents("php://input"), true);

$nomeEmpresa = $_SESSION['empresa'] ?? '';
$nome = preg_replace('/[^a-zA-Z0-9_-]/', '_', $dados['nome'] ?? '');
$contatos = $dados['contatos'] ?? [];

if (!$nome || !$nomeEmpresa || !is_array($contatos)) {
  http_response_code(400);
  echo json_encode(['erro' => 'Dados inválidos.']);
  exit;
}

$dirEmpresa = __DIR__ . "/listas_de_envio/$nomeEmpresa";
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

$caminho = "$dirEmpresa/lista-{$nome}.json";
$salvo = file_put_contents($caminho, json_encode($contatos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($salvo === false) {
  http_response_code(500);
  echo json_encode(['erro' => 'Falha ao salvar a lista.']);
  exit;
}

echo json_encode(['ok' => true]);
