<?php
$dados = json_decode(file_get_contents("php://input"), true);

$nome = preg_replace('/[^a-zA-Z0-9_-]/', '_', $dados['nome'] ?? '');
$contatos = $dados['contatos'] ?? [];

if (!$nome || !is_array($contatos)) {
  http_response_code(400);
  echo json_encode(['erro' => 'Nome ou contatos inválidos.']);
  exit;
}

session_start();
$empresa = $_SESSION['empresa'] ?? null;

if (!$empresa) {
  http_response_code(403);
  echo json_encode(['erro' => 'Empresa não identificada']);
  exit;
}

$dirEmpresa = __DIR__ . "/../listas_de_envio/{$empresa}";
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

$caminho = "{$dirEmpresa}/lista-{$nome}.json";

$salvo = file_put_contents($caminho, json_encode($contatos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($salvo === false) {
  http_response_code(500);
  echo json_encode(['erro' => 'Falha ao salvar o arquivo.']);
  exit;
}

echo json_encode(['ok' => true]);
