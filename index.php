<?php

require __DIR__ . '/scripts/auth.php';

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Dashboard - WhatsApp Manager</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/index-modern.css?v=<?= time() ?>">
</head>
<body>

<h1>WhatsApp Manager</h1>

<div class="dashboard">
  <a class="dash-button" href="disparar-contatos.php">
    <i class="fas fa-paper-plane"></i>
    <span>Disparar para Contatos</span>
  </a>
  <a class="dash-button" href="disparar-grupos.php">
    <i class="fas fa-users-gear"></i>
    <span>Disparar para Grupos</span>
  </a>
  <a class="dash-button" href="instancias.php">
    <i class="fas fa-network-wired"></i>
    <span>Instâncias</span>
  </a>
</div>

<footer class="footer-logout">
  <form method="POST" action="logout.php">
    <button type="submit" class="logout-btn">Sair</button>
  </form>
</footer>

</body>
</html>
