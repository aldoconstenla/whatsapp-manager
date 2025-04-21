<?php

require __DIR__ . '/scripts/auth.php';

$instancias = [];
$jsonPath = __DIR__ . "/scripts/instancias.json";

if (file_exists($jsonPath)) {
    $instancias = json_decode(file_get_contents($jsonPath), true);
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="assets/css/shared.css">
    <link rel="stylesheet" href="assets/css/instancias.css">
    <title>Jutsu WhatsApp Manager</title>
</head>
<body>

<header>
    <h1>WhatsApp Manager</h1>
    <div class="menu-toggle" onclick="toggleMenu()">☰</div>
    <div class="menu">
        <a href="instancias.php" onclick="closeMenu()">Instâncias</a>
        <a href="disparar-contatos.php" onclick="closeMenu()">Disparar para Contatos</a>
        <a href="disparar-grupos.php" onclick="closeMenu()">Disparar para Grupos</a>
    </div>
</header>

<div class="grid">
    <div class="form-container">
        <h2>Nova Instância</h2>
        <form id="createForm" action="scripts/instanciador.php" method="POST">
            <label for="nome">Nome da Instância</label>
            <input type="text" name="nome" id="nome" required>
            <button type="submit">Criar Instância</button>
        </form>
        <div id="status" class="status-message"></div>
    </div>

    <div class="instancias-container">
        <h2>Instâncias Ativas</h2>
        <?php if (is_array($instancias) && count($instancias) > 0) : ?>
            <?php foreach ($instancias as $inst) : ?>
                <div class="instancia">
                    <div class="instancia-header">
                        <span class="instancia-name"><?= htmlspecialchars($inst['nome']) ?></span>
                        <form class="delete-form" data-nome="<?= htmlspecialchars($inst['nome']) ?>" data-porta="<?= htmlspecialchars($inst['porta']) ?>">
                            <input type="hidden" name="nome" value="<?= htmlspecialchars($inst['nome']) ?>">
                            <input type="hidden" name="porta" value="<?= htmlspecialchars($inst['porta']) ?>">
                            <button class="delete-btn" type="submit">🗑️ Deletar</button>
                        </form>
                    </div>
                    <a href="#" class="qr-link" onclick="toggleQRCode('<?= $inst['porta'] ?>', this); return false;">📷 Ver QR Code</a>
                    <iframe id="qr-<?= $inst['porta'] ?>" src=""></iframe>
                    <div class="delete-status"></div>
                </div>
            <?php endforeach; ?>
        <?php else : ?>
            <p>Nenhuma instância cadastrada.</p>
        <?php endif; ?>
    </div>
</div>

<script src="assets/js/instancias.js?v=<?= time() ?>"></script>

</body>
</html>
