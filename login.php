<?php
session_start();

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $usuarios = json_decode(file_get_contents(__DIR__ . '/scripts/usuarios.json'), true);

  $login = $_POST['login'] ?? '';
  $senha = $_POST['senha'] ?? '';

  foreach ($usuarios as $usuario) {
    if (
      $usuario['login'] === $login &&
      password_verify($senha, $usuario['senha'])
    ) {
      $_SESSION['usuario'] = $usuario['login'];
      header('Location: index.php');
      exit;
    }
  }

  $erro = 'Usuário ou senha incorretos.';
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/webp" href="assets/img/favicon.webp">
  <title>Login</title>
  <link rel="stylesheet" href="assets/css/login-modern.css?v=<?= time() ?>">
</head>
<body>
  <div class="login-container">
  <h1>
    <img src="assets/img/jazap-logo.webp" style="width:145px"><br>
    <span class="sub">🔐 Acesso Restrito</span>
  </h1>

    <?php if ($erro): ?>
      <div class="erro"><?= htmlspecialchars($erro) ?></div>
    <?php endif; ?>

    <form method="POST">
      <label for="login">Usuário</label>
      <input type="text" name="login" id="login" required>

      <label for="senha">Senha</label>
      <input type="password" name="senha" id="senha" required>

      <button type="submit">Entrar</button>
    </form>
  </div>
</body>
</html>
