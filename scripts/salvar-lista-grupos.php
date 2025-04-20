<?php
header('Content-Type: application/json');

// Pega o corpo cru da requisição
$input = file_get_contents("php://input");

// Tenta decodificar como JSON
$data = json_decode($input, true);

// Valida se veio o campo "grupos"
if (isset($data['grupos']) && is_array($data['grupos'])) {
    $grupos = $data['grupos'];

    // Caminho para salvar
    $arquivo = __DIR__ . '/lista_grupos.json';

    // Salva como JSON formatado
    file_put_contents($arquivo, json_encode($grupos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['status' => 'ok', 'total' => count($grupos)]);
} else {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Dados inválidos ou campo grupos ausente']);
}
