<?php
$arquivo = __DIR__ . '/disparos_agendados/agendamentos-contatos.json';

session_start();

$empresa = $_SESSION['empresa'] ?? null;
if (!$empresa) {
  http_response_code(403);
  echo json_encode(['erro' => 'Sessão inválida']);
  exit;
}

// Garante que o diretório existe
if (!is_dir(dirname($arquivo))) {
  mkdir(dirname($arquivo), 0777, true);
}

// Inicializa como array vazio se o arquivo não existir
if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([]));
}

// Lê e decodifica os dados existentes
$dados = json_decode(file_get_contents($arquivo), true) ?? [];

// Define o método HTTP
$metodo = $_SERVER['REQUEST_METHOD'];

// 📥 POST: adiciona novo agendamento
if ($metodo === 'POST') {
  $novo = json_decode(file_get_contents('php://input'), true);

  if (!$novo || !isset($novo['dataHora']) || !isset($novo['mensagem']) || !isset($novo['contatos'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados incompletos']);
    exit;
  }

  $novo['empresa'] = $empresa; // <-- adiciona a empresa logada

  $dados[] = $novo;
  file_put_contents($arquivo, json_encode($dados, JSON_PRETTY_PRINT));
  echo json_encode(['ok' => true]);
  exit;
}

// 🗑 DELETE: exclui agendamento por índice
if ($metodo === 'DELETE') {
  $input = json_decode(file_get_contents('php://input'), true);
  $index = $input['index'] ?? -1;

  if ($index >= 0 && isset($dados[$index])) {
    array_splice($dados, $index, 1);
    file_put_contents($arquivo, json_encode($dados, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
  } else {
    http_response_code(404);
    echo json_encode(['erro' => 'Agendamento não encontrado']);
  }
  exit;
}

// 📤 GET: retorna todos os agendamentos
header('Content-Type: application/json');
$dadosEmpresa = array_filter($dados, fn($d) => ($d['empresa'] ?? '') === $empresa);
echo json_encode(array_values($dadosEmpresa));

