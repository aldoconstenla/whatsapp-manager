<?php
$dados = json_decode(file_get_contents("php://input"), true);

$nome = preg_replace('/[^a-zA-Z0-9_-]/', '_', $dados['nome'] ?? '');
$contatos = $dados['contatos'] ?? [];

if (!$nome || !is_array($contatos)) {
  http_response_code(400);
  echo json_encode(['erro' => 'Nome ou contatos inválidos.']);
  exit;
}

$caminho = __DIR__ . "/../listas_de_envio/lista-{$nome}.json";
file_put_contents($caminho, json_encode($contatos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => true]);
