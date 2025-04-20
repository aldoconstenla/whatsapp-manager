<?php
$arquivos = glob(__DIR__ . '/../listas_de_envio/lista-*.json');
$listas = [];

foreach ($arquivos as $arquivo) {
  $nome = basename($arquivo);
  $nome = preg_replace('/^lista-/', '', $nome);
  $nome = preg_replace('/\.json$/', '', $nome);
  $listas[] = $nome;
}

echo json_encode($listas);
