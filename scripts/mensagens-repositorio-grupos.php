<?php
$arquivo = __DIR__ . '/listas_de_envio/repo_mensagens_grupos.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([]));
}

$mensagens = json_decode(file_get_contents($arquivo), true);

// Salvar nova
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $mensagens[] = [
    'titulo' => $input['titulo'] ?? 'Sem título',
    'mensagem' => $input['mensagem'] ?? ''
  ];
  file_put_contents($arquivo, json_encode($mensagens, JSON_PRETTY_PRINT));
  echo json_encode(['ok' => true]);
  exit;
}

// Excluir
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $input = json_decode(file_get_contents('php://input'), true);
  $index = $input['index'] ?? -1;
  if (isset($mensagens[$index])) {
    array_splice($mensagens, $index, 1);
    file_put_contents($arquivo, json_encode($mensagens, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
  } else {
    echo json_encode(['ok' => false, 'erro' => 'Índice inválido']);
  }
  exit;
}

// GET padrão
echo json_encode($mensagens);
