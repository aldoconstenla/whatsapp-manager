<?php
session_start();

if (!isset($_SESSION['empresa'])) {
  http_response_code(403);
  echo json_encode(['erro' => 'Sessão inválida.']);
  exit;
}

$empresa = preg_replace('/[^a-z0-9_-]/i', '', $_SESSION['empresa']);
$arquivo = __DIR__ . "/../listas_de_envio/{$empresa}/mensagens-salvas-grupos.json";

// Garante que a pasta existe
$dirEmpresa = dirname($arquivo);
if (!is_dir($dirEmpresa)) {
  mkdir($dirEmpresa, 0777, true);
}

// Inicializa o arquivo se não existir
if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([]));
}

$mensagens = json_decode(file_get_contents($arquivo), true) ?? [];

switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    echo json_encode($mensagens);
    break;

  case 'POST':
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['titulo'], $input['mensagem'])) {
      http_response_code(400);
      echo json_encode(['ok' => false, 'erro' => 'Dados incompletos.']);
      exit;
    }

    $mensagens[] = [
      'titulo' => $input['titulo'],
      'mensagem' => $input['mensagem']
    ];

    file_put_contents($arquivo, json_encode($mensagens, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    break;

  case 'DELETE':
    $input = json_decode(file_get_contents('php://input'), true);
    $index = $input['index'] ?? -1;

    if ($index >= 0 && isset($mensagens[$index])) {
      array_splice($mensagens, $index, 1);
      file_put_contents($arquivo, json_encode($mensagens, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
      echo json_encode(['ok' => true]);
    } else {
      http_response_code(404);
      echo json_encode(['ok' => false, 'erro' => 'Mensagem não encontrada.']);
    }
    break;
}
