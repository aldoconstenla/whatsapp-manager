<?php
$nome = $_POST['nome'] ?? '';

if (!$nome) {
    die('❌ Nome da instância é obrigatório.');
}

// Caminhos
$instanciaDir = "/home/deployzdg/botzdg";
$instanciaPath = "$instanciaDir/{$nome}.js";
$templatePath = __DIR__ . "/../instancia_template/template.js";
$jsonPath = __DIR__ . "/instancias.json";

// Verifica se o template existe
if (!file_exists($templatePath)) {
    die('❌ Template não encontrado.');
}

// Evita sobrescrever instância existente
if (file_exists($instanciaPath)) {
    die("⚠️ Já existe uma instância com esse nome.");
}

// Carrega instâncias já existentes
$instancias = file_exists($jsonPath) ? json_decode(file_get_contents($jsonPath), true) : [];

// Gera próxima porta disponível a partir de 8085
$nextPort = 8085;
$usedPorts = array_column($instancias, 'porta');
while (in_array($nextPort, $usedPorts)) {
    $nextPort++;
}
$porta = $nextPort;

// Prepara o conteúdo da nova instância
$template = file_get_contents($templatePath);
$template = str_replace(['{{PORTA}}', '{{NOME}}'], [$porta, $nome], $template);

// Cria o arquivo da nova instância
if (!file_put_contents($instanciaPath, $template)) {
    die('❌ Erro ao criar o arquivo da instância.');
}

// Corrige permissões do script da instância
chmod($instanciaPath, 0755);
exec("sudo chown deployzdg:deployzdg " . escapeshellarg($instanciaPath));

// Atualiza o JSON com a nova instância
$instancias[] = [ "nome" => $nome, "porta" => $porta ];
if (!file_put_contents($jsonPath, json_encode($instancias, JSON_PRETTY_PRINT))) {
    die('❌ Erro ao atualizar o arquivo de instâncias.');
}
chmod($jsonPath, 0664);
exec("sudo chown www-data:www-data " . escapeshellarg($jsonPath));

// Executa o script como deployzdg
$scriptPath = "/home/deployzdg/botzdg/criar_instancia.sh";
$comando = "sudo -u deployzdg " . escapeshellarg($scriptPath) . " " . escapeshellarg($nome) . " " . escapeshellarg($porta);

// DEBUG opcional
error_log("Executando comando: $comando");

exec($comando, $output, $returnCode);
file_put_contents('/tmp/debug_instancia.log', implode("\n", $output) . "\nRetorno: $returnCode");

// DEBUG de saída
error_log("Saída do script:\n" . implode("\n", $output));

if ($returnCode !== 0) {
    echo "⚠️ Arquivo criado, mas erro ao iniciar com PM2 via script:\n" . implode("\n", $output);
} else {
    echo "✅ Instância '{$nome}' criada e iniciada com sucesso na porta {$porta}!";
}
