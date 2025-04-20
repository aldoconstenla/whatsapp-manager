<?php
$nome = $_POST['nome'] ?? '';

if (!$nome) {
    die('❌ Nome da instância é obrigatório.');
}

$jsonPath = __DIR__ . "/instancias.json";

// Carrega instâncias
$instancias = file_exists($jsonPath) ? json_decode(file_get_contents($jsonPath), true) : [];

$instancia = null;
foreach ($instancias as $inst) {
    if ($inst['nome'] === $nome) {
        $instancia = $inst;
        break;
    }
}

if (!$instancia) {
    die("⚠️ Instância '{$nome}' não encontrada.");
}

$script = "/home/deployzdg/botzdg/remover_instancia.sh";

// ⚠️ Sem 'bash' no meio, igual no criar
$comando = "sudo -u deployzdg " . escapeshellarg($script) . " " . escapeshellarg($nome);

exec($comando, $output, $code);

// Remove do JSON
$instancias = array_filter($instancias, fn($inst) => $inst['nome'] !== $nome);
file_put_contents($jsonPath, json_encode(array_values($instancias), JSON_PRETTY_PRINT));

if ($code !== 0) {
    echo "⚠️ Erro ao remover a instância '{$nome}'.";
} else {
    echo "✅ Instância '{$nome}' removida com sucesso.";
}
