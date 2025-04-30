<?php

require __DIR__ . '/scripts/auth.php';

// Limpa lista_grupos.json ao carregar a página
file_put_contents(__DIR__ . "/scripts/lista_grupos.json", json_encode([]));

// Carrega instâncias
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
  <link rel="stylesheet" href="assets/css/disparar-grupos-modern.css?v=<?= time() ?>">
  <meta charset="UTF-8">
  <link rel="icon" type="image/webp" href="assets/img/favicon.webp">
  <title>Jazap - Disparar para Grupos</title>
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
    <div class="instancia-barra">
      <h1>📣 Disparar para Grupos</h1>
      <div class="instancia-controle">
        <label for="instanciaSelect">Instância:</label>
        <select id="instanciaSelect">
          <?php foreach ($instancias as $inst): ?>
            <option value="<?= htmlspecialchars($inst['nome']) ?>|<?= htmlspecialchars($inst['porta']) ?>">
              <?= htmlspecialchars($inst['nome']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <!-- Seção 1: Obter IDs dos grupos -->
    <div class="section" id="gruposListados" style="display: none;">
      <input type="text" id="buscaGrupo" placeholder="🔍 Buscar grupo...">
      <div id="instrucoesGrupos" style="margin-bottom: 15px; background: #1a1a1a; border: 1px solid #00ff88; padding: 10px 15px; border-radius: 8px; font-size: 14px; line-height: 1.5; display: none;">
        👉 Clique no(s) grupo(s) que deseja enviar mensagem para adicioná-lo(s) à lista de envio.<br>
        🖱️ Clique com o botão direito do mouse para <strong>mudar o nome</strong> ou <strong>a descrição</strong> do grupo.
      </div>

      <table class="spreadsheet" id="tabelaGrupos">
        <thead><tr><th>Nome</th><th>ID</th></tr></thead>
        <tbody></tbody>
      </table>

      <div style="margin-top: 10px; display: flex; gap: 8px;" id="paginacaoGrupos"></div>
    </div>

    <!-- Seção 2: Disparar para Grupos -->
    <div class="section">
      <div class="row">
        <!-- Coluna da tabela -->
        <div class="col-60">
          <table class="spreadsheet" id="tabelaDisparo">
            <thead><tr><th>❌</th><th>Nome</th><th>ID</th><th>Status</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>

        <!-- Coluna do textarea e botões -->
        <div class="col-40">
          <div class="format-buttons" style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="format-btn" onclick="formatarTexto('negrito')"><strong>B</strong></button>
            <button type="button" class="format-btn" onclick="formatarTexto('italico')"><em>I</em></button>
            <button type="button" class="format-btn" onclick="salvarMensagemAtual()">💾</button>
            <button type="button" class="format-btn" onclick="abrirLightboxMensagens()">📂</button>
          </div>
          <textarea id="mensagemGrupos" placeholder="Digite a mensagem."></textarea>
          <div class="controls">
            <button id="btnReverterIA" onclick="reverterMensagemIA()" style="display: none; margin-right: 10px;">↩ Reverter</button>
            <button id="btnMelhorarIA" onclick="melhorarMensagemComIA()">
              <span class="icon">✨</span>
              <span class="text">Formatar com IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox de Confirmação -->
    <div id="lightbox-confirmacao" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 9999; align-items: center; justify-content: center;">
      <div style="background: #1e1e1e; border: 2px solid #00ff88; padding: 30px; border-radius: 12px; max-width: 500px; text-align: center; color: #f1f1f1; box-shadow: 0 0 25px #00ff8860;">
        <h2 style="color: #00ff88;">⚠️ Atenção!</h2>
        <p style="font-size: 16px;">Tem certeza que deseja iniciar esse disparo para o(s) grupo(s)?</p>
        <div style="margin: 20px 0;">
          <select id="instancia-lightbox" style="font-size: 16px; font-weight: bold; background: #1e1e1e; border: 2px solid #00ff88; border-radius: 8px; color: #00ff88; padding: 10px;">
            <?php foreach ($instancias as $inst) : ?>
              <option value="<?= htmlspecialchars($inst['nome']) ?>|<?= htmlspecialchars($inst['porta']) ?>">
                <?= htmlspecialchars($inst['nome']) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
          <button onclick="confirmarDisparoParaGrupos()" style="background: #00ff88; color: #000; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer;">✅ Sim, pode disparar</button>
          <button onclick="fecharLightbox()" style="background: #444; color: #fff; padding: 10px 20px; border-radius: 8px; border: 1px solid #00ff88; font-weight: bold; cursor: pointer;">❌ Cancelar</button>
        </div>
      </div>
    </div>

    <div id="lightbox-descricao" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center;">
      <div style="background:#1e1e1e; padding:30px; border-radius:10px; border:2px solid #00ff88; max-width:500px; width:100%; color:#fff;">
        <h3 style="color:#00ff88;">✍️ Nova descrição</h3>
        <textarea id="novaDescricaoTexto" style="width:100%; height:250px; margin-top:10px;"></textarea>
        <div style="margin-top:15px; display:flex; justify-content:flex-end; gap:10px;">
          <button onclick="salvarDescricaoGrupo()" style="background:#00ff88; color:#000; padding:8px 16px; border:none; border-radius:6px; cursor: pointer;">Salvar</button>
          <button onclick="fecharLightboxDescricao()" style="background:#555; color:#fff; padding:8px 16px; border:none; border-radius:6px;">Cancelar</button>
        </div>
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
  </div>
  <div class="footer-bar">
    <div class="footer-buttons">
      <button onclick="abrirLightboxConfirmacao()">🚀 Disparar</button>
      <button id="btnObterGrupos" onclick="obterGrupos()">🔍 Obter Grupos</button>
      <button onclick="abrirLightboxAgendamento()">⏰ Agendar Disparo</button>
      <button onclick="abrirLightboxAgendamentos()">📅 Ver Agendados</button>
    </div>
  </div>

  <div id="lightbox-contatos" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; flex-direction:column;">
    <div style="background:#1e1e1e; padding:30px; border-radius:10px; border:2px solid #00ff88; width:90%; max-width:600px; color:#fff;">
      <h3 id="contatosQuantidade" style="color:#00ff88;">📱 Contatos extraídos</h3>
      <div id="contatosTabela" style="max-height:300px; overflow:auto; margin-top:15px;"></div>

      <div style="margin-top:20px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <button onclick="exportarContatosCSV()" style="background:#00ff88; color:#000; padding:10px 20px; border:none; border-radius:6px; cursor:pointer;">⬇ Exportar CSV</button>
        <button onclick="salvarContatosComoLista()" style="background:#00ff88; color:#000; padding:10px 20px; border:none; border-radius:6px; cursor:pointer;">💾 Salvar como Lista</button>
        <button onclick="fecharLightboxContatos()" style="background:#444; color:#fff; padding:10px 20px; border:none; border-radius:6px;">❌ Fechar</button>
      </div>
    </div>
  </div>

  <div id="lightbox-agendar" class="lightbox" style="display: none;">
    <div class="lightbox-inner">
      <h3>📆 Agendar Disparo</h3>
      <p>Atenção: selecione os grupos e a mensagem ANTES de agendar.</p>
      <input type="text" id="nomeAgendamento" placeholder="Nome do agendamento">
      <input type="datetime-local" id="dataHoraAgendamento">
      <div style="margin-top: 20px;">
        <button onclick="salvarAgendamento()" style="background:#00ff88; color:#000; padding:8px 16px; border:none; border-radius:6px;">💾 Salvar</button>
        <button onclick="fecharLightboxAgendar()" style="background:#444; color:#fff; padding:8px 16px; border:none; border-radius:6px;">Cancelar</button>
      </div>
    </div>
  </div>

  <div id="lightbox-agendamentos" class="lightbox" style="display: none;">
    <div class="lightbox-inner" style="max-height:80vh; overflow:auto;">
      <h3>📅 Disparos Agendados</h3>
      <div id="listaAgendamentos"></div>
      <div style="margin-top:20px; text-align:right;">
        <button onclick="fecharLightboxAgendamentos()" style="background:#444; color:#fff; padding:10px 20px; border-radius:8px;">Fechar</button>
      </div>
    </div>
  </div>

  <script>
    const WEBHOOKS = {
      melhorarIA: "<?= $urlPaths['melhorar_ia'] ?>",
      systemURL: "<?= $urlPaths['system_URL'] ?>",
      obterGrupos: "<?= $urlPaths['obter_grupos'] ?? '' ?>",
      dispararGrupos: "<?= $urlPaths['disparar_grupos'] ?? '' ?>",
      mudarNomeGrupo: "<?= $urlPaths['mudar_nome_grupo'] ?? '' ?>",
      mudarDescricaoGrupo: "<?= $urlPaths['mudar_descricao'] ?? '' ?>",
      extrairContatos: "<?= $urlPaths['extrair_contatos'] ?? '' ?>"
    };
  </script>


  <script src="assets/js/disparar-grupos.js?v=<?= time() ?>"></script>

</body>
</html>
