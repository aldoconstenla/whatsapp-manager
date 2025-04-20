<?php

require __DIR__ . '/scripts/auth.php';

$instancias = [];

$jsonPath = __DIR__ . "/scripts/instancias.json";

require __DIR__ . '/scripts/config-webhooks.php';

if (file_exists($jsonPath)) {
    $instancias = json_decode(file_get_contents($jsonPath), true);
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/shared.css">
  <link rel="stylesheet" href="assets/css/disparar-contatos.css">
  <meta charset="UTF-8">
  <title>Disparar para Contatos</title>
</head>
<body>

  <header>
    <h1>📤 Disparar para Contatos</h1>
    <div class="menu-toggle" onclick="toggleMenu()">☰</div>
    <div class="menu" id="menuDropdown">
      <a href="instancias.php" onclick="closeMenu()">Instâncias</a>
      <a href="disparar-contatos.php" onclick="closeMenu()">Disparar para Contatos</a>
      <a href="disparar-grupos.php" onclick="closeMenu()">Disparar para Grupos</a>
    </div>
  </header>

  <div class="instance-select">
    <label for="instancia">Instância:</label>
    <select id="instancia">
      <?php foreach ($instancias as $inst) : ?>
        <option value="<?= htmlspecialchars($inst['nome']) ?>|<?= htmlspecialchars($inst['porta']) ?>">
          <?= htmlspecialchars($inst['nome']) ?>
        </option>
      <?php endforeach; ?>
    </select>
  </div>

  <div class="list-controls">
    <select id="selectListaSalva" onchange="carregarListaSelecionada()">
      <option value="">📂 Carregar lista salva...</option>
    </select>
    <button onclick="salvarComoLista()">💾 Salvar como Lista</button>
  </div>


  <div class="top-controls">
    <div class="spreadsheet-container">
      <div id="dropzone" contenteditable="true" onpaste="handlePaste(event)">
        Clique aqui e cole os nomes e/ou números
      </div>

      <table class="spreadsheet" id="planilha">
        <thead>
          <tr>
            <th></th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div id="mensagem-erro" style="color: #ff4d4d; font-weight: bold; margin-bottom: 10px; display: none;"></div>
      <div class="controls">
        <button onclick="abrirLightboxConfirmacao()">🚀 Disparar</button>
        <button onclick="limpar()">🗑️ Limpar Tudo</button>
        <button onclick="salvarSessaoAtual()">💾 Salvar Sessão Atual</button>
      </div>
      <div class="small">* Os dados serão salvos ao clicar em disparar ou no botão "Salvar Sessão Atual".</div>
    </div>

    <div class="copy-container">
      <div class="format-buttons" style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button type="button" class="format-btn" onclick="inserirNoCursor('{Nome}')">{Nome}</button>
        <button type="button" class="format-btn" onclick="formatarTexto('negrito')"><strong>B</strong></button>
        <button type="button" class="format-btn" onclick="formatarTexto('italico')"><em>I</em></button>
      </div>
      <label for="mensagem">Mensagem a ser enviada:</label>

      <textarea id="mensagem" placeholder="Digite aqui sua mensagem..." oninput="sincronizarMensagem()"></textarea>

      <div class="btn-ia-wrapper">
        <button id="btnReverterIA" onclick="reverterIA()" style="display: none; margin-right: 10px;">
          ↩ Reverter
        </button>
        <button id="btnMelhorarIA" onclick="melhorarComIA()">
          <span class="icon">✨</span>
          <span class="text">Melhorar com IA</span>
        </button>
      </div>

  </div>

  <!-- Lightbox de Confirmação -->
  <div id="lightbox-confirmacao" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 9999; align-items: center; justify-content: center;">
    <div style="background: #1e1e1e; border: 2px solid #00ff88; padding: 30px; border-radius: 12px; max-width: 500px; text-align: center; color: #f1f1f1; box-shadow: 0 0 25px #00ff8860;">
      <h2 style="color: #00ff88;">⚠️ Cuidado!</h2>
      <p style="font-size: 18px; margin-bottom: 20px;">Com grandes poderes, vem grandes responsabilidades.</p>
      <p style="font-size: 16px;">Você está iniciando um disparo em massa a partir da instância:</p>
      <div style="margin: 10px 0;">
        <select id="instancia-lightbox" style="font-size: 20px; font-weight: bold; background: #1e1e1e; border: 2px solid #00ff88; border-radius: 8px; color: #00ff88; padding: 10px;">
          <?php foreach ($instancias as $inst) : ?>
            <option value="<?= htmlspecialchars($inst['nome']) ?>|<?= htmlspecialchars($inst['porta']) ?>">
              <?= htmlspecialchars($inst['nome']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <p style="margin-bottom: 25px;"><b>Tem certeza que deseja iniciar?</b><br><br><i>Se tiver configurado algo errado, o japa vai comer o seu toco...</i></p>
      <div style="display: flex; justify-content: center; gap: 20px;">
        <button onclick="confirmarDisparo()" style="background: #00ff88; color: #000; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer;">✅ Tenho certeza, pode disparar!</button>
        <button onclick="fecharLightbox()" style="background: #444; color: #fff; padding: 10px 20px; border-radius: 8px; border: 1px solid #00ff88; font-weight: bold; cursor: pointer;">🔍 Conferir detalhes</button>
      </div>
    </div>
  </div>

  <script>
    const WEBHOOKS = {
      disparoContatos: "<?= $urlPaths['disparo_contatos'] ?>",
      melhorarIA: "<?= $urlPaths['melhorar_ia'] ?>",
      systemURL: "<?= $urlPaths['system_URL'] ?>",
    };

    // Pegando o nome do usuário logado da sessão PHP
    const USUARIO_LOGADO = "<?= $_SESSION['usuario'] ?>";
  </script>


  <script src="assets/js/disparar-contatos.js?v=<?= time() ?>"></script>
</body>
</html>
