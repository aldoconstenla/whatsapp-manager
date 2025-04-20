<?php
$arquivo = __DIR__ . '/disparos_agendados/agendamentos.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([]));
}

$lista = json_decode(file_get_contents($arquivo), true) ?? [];

switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    echo json_encode($lista);
    break;

  case 'POST':
    $dados = json_decode(file_get_contents('php://input'), true);
    $lista[] = $dados;
    file_put_contents($arquivo, json_encode($lista, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true]);
    break;

  case 'DELETE':
    $body = json_decode(file_get_contents('php://input'), true);
    $index = $body['index'];
    array_splice($lista, $index, 1);
    file_put_contents($arquivo, json_encode($lista, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true]);
    break;
}
