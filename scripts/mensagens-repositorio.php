<?php
$arquivo = __DIR__ . "/../mensagens_salvas.json";
$method = $_SERVER['REQUEST_METHOD'];

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, json_encode([]));
}

if ($method === 'GET') {
    echo file_get_contents($arquivo);
    exit;
}

if ($method === 'POST') {
    $dados = json_decode(file_get_contents("php://input"), true);
    $titulo = trim($dados['titulo'] ?? '');
    $mensagem = trim($dados['mensagem'] ?? '');

    if (!$titulo || !$mensagem) {
        http_response_code(400);
        echo json_encode(['erro' => 'Título ou mensagem inválidos.']);
        exit;
    }

    $mensagens = json_decode(file_get_contents($arquivo), true);
    $mensagens[] = [ 'titulo' => $titulo, 'mensagem' => $mensagem ];
    file_put_contents($arquivo, json_encode($mensagens, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['ok' => true]);
}
