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
  <link rel="stylesheet" href="assets/css/shared.css?v=<?= time() ?>">
  <link rel="stylesheet" href="assets/css/disparar-contatos-modern.css?v=<?= time() ?>">
  <meta charset="UTF-8">
  <link rel="icon" type="image/webp" href="assets/img/favicon.webp">
  <title>Jazap - Disparar para Contatos</title>
</head>
<body>

  <header>
    <img src="assets/img/jazap-logo.webp" style="width:145px">
    <div class="menu-toggle" onclick="toggleMenu()">☰</div>
    <div class="menu" id="menuDropdown">
      <a href="instancias.php" onclick="closeMenu()">Instâncias</a>
      <a href="disparar-contatos.php" onclick="closeMenu()">Disparar para Contatos</a>
      <a href="disparar-grupos.php" onclick="closeMenu()">Disparar para Grupos</a>
    </div>
  </header>

  <div style="padding:0 40px 0 40px">
    <div class="top-bar">
      <h1>📤 Disparar para Contatos</h1>
      <div class="top-bar-controls">
        <label for="instancia">Instância:</label>
        <select id="instancia">
          <?php foreach ($instancias as $inst) : ?>
            <option value="<?= htmlspecialchars($inst['nome']) ?>|<?= htmlspecialchars($inst['porta']) ?>">
              <?= htmlspecialchars($inst['nome']) ?>
            </option>
          <?php endforeach; ?>
        </select>
        <!-- Se quiser adicionar botão aqui -->
        <!-- <button onclick="obterContatos()">🔍 Obter Contatos</button> -->
      </div>
    </div>


    <div class="top-controls">
      <div class="spreadsheet-container">
        <div id="mensagem-erro" style="color: #ff4d4d; font-weight: bold; margin-bottom: 10px; display: none;"></div>
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
        <div class="small">* Os dados serão salvos na sessão ao clicar em Disparar.<br><i>(clique em Limpar para remover sessão ativa)</i></div>
      </div>

      <div class="copy-container">
        <div class="format-buttons" style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="format-btn" onclick="inserirNoCursor('{Nome}')">{Nome}</button>
          <button type="button" class="format-btn" onclick="formatarTexto('negrito')"><strong>B</strong></button>
          <button type="button" class="format-btn" onclick="formatarTexto('italico')"><em>I</em></button>
          <button type="button" class="format-btn" onclick="salvarMensagemAtual()">💾</button>
          <button type="button" class="format-btn" onclick="abrirLightboxMensagens()">📂</button>
        </div>
        <label for="mensagem">Mensagem a ser enviada:</label>

        <textarea id="mensagem" placeholder="Digite aqui sua mensagem..." oninput="sincronizarMensagem()"></textarea>

        <div class="btn-ia-wrapper">
          <button id="btnReverterIA" onclick="reverterIA()" style="display: none; margin-right: 10px;">
            ↩ Reverter
          </button>
          <button id="btnMelhorarIA" onclick="melhorarComIA()">
            <span class="icon">✨</span>
            <span class="text">Formatar com IA</span>
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
  </div>
  <div class="footer-bar">
    <div class="footer-buttons">
      <button onclick="abrirLightboxConfirmacao()">🚀 Disparar</button>
      <button onclick="limpar()">🗑️ Limpar</button>
      <button onclick="salvarComoLista()">💾 Salvar Lista</button>
      <select id="selectListaSalva" onchange="carregarListaSelecionada()">
        <option value="">📂 Carregar lista salva...</option>
      </select>
      <button onclick="abrirLightboxAgendarContatos()">⏰ Agendar Disparo</button>
      <button onclick="abrirLightboxAgendamentosContatos()">📅 Ver Agendados</button>
    </div>
  </div>

  <div id="lightbox-mensagens" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto;">
    <div style="max-width: 600px; margin: 60px auto; background: #1e1e1e; padding: 20px; border-radius: 12px; border: 2px solid #00ff88;">
      <h2 style="color: #00ff88;">📂 Mensagens Salvas</h2>
      <div id="listaMensagensSalvas"></div>
      <div style="text-align: right; margin-top: 20px;">
        <button onclick="fecharLightboxMensagens()" style="background: #444; color: #fff; padding: 10px 20px; border: 1px solid #00ff88; border-radius: 8px; cursor: pointer;">Fechar</button>
      </div>
    </div>
  </div>

  <div id="lightbox-agendar-contato" class="lightbox" style="display: none;">
    <div class="lightbox-inner">
      <h3>📆 Agendar Disparo</h3>
      <p>Atenção: selecione os contatos e a mensagem ANTES de agendar.</p>
      <input type="text" id="nomeAgendamento" placeholder="Nome do agendamento">
      <input type="datetime-local" id="dataHoraAgendamento">
      <div style="margin-top: 20px;">
        <button onclick="salvarAgendamento()" style="background:#00ff88; color:#000; padding:8px 16px; border:none; border-radius:6px;">💾 Salvar</button>
        <button onclick="fecharLightboxAgendar()" style="background:#444; color:#fff; padding:8px 16px; border:none; border-radius:6px;">Cancelar</button>
      </div>
    </div>
  </div>

  <div id="lightbox-ver-agendamentos" class="lightbox" style="display: none;">
    <div class="lightbox-inner" style="max-height:80vh; overflow:auto;">
      <h3>📅 Disparos Agendados</h3>
      <div id="listaAgendamentosContatos"></div>
      <div style="margin-top:20px; text-align:right;">
        <button onclick="fecharLightboxAgendamentosContatos()" style="background:#444; color:#fff; padding:10px 20px; border-radius:8px;">Fechar</button>
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
