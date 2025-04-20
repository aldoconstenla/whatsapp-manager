<?php
$mensagemPath = __DIR__ . '/mensagem_ia.json';

// Lê o corpo da requisição
$input = json_decode(file_get_contents('php://input'), true);

// Resetar conteúdo se JSON vazio
if ($input === []) {
    file_put_contents($mensagemPath, json_encode([]));
    echo json_encode(['ok' => true, 'resetado' => true]);
    exit;
}

// Verifica se veio o campo 'mensagem'
if (!isset($input['mensagem'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Mensagem não encontrada.']);
    exit;
}

// Salva nova mensagem no JSON
file_put_contents($mensagemPath, json_encode([
    'mensagem' => $input['mensagem']
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => true]);
