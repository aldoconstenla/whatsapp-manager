function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
}
function closeMenu() {
  document.getElementById("menuDropdown").style.display = "none";
}
document.addEventListener('click', function (e) {
  const menu = document.getElementById('menuDropdown');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu.contains(e.target) && !toggle.contains(e.target)) {
    closeMenu();
  }
});

async function obterGrupos() {
  const instancia = document.getElementById('instanciaSelect').value;
  const [nome, porta] = instancia.split('|');

  const btn = document.getElementById('btnObterGrupos');
  btn.innerHTML = `<i class="fas fa-spinner spinner"></i> Carregando...`;
  btn.disabled = true;

  try {
    // 🔄 Reset JSON antes de tudo
    await fetch('scripts/salvar-lista-grupos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    });

    await fetch(WEBHOOKS.obterGrupos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nome,
        porta,
        systemURL: WEBHOOKS.systemURL
      })
    });

    // ⏳ Agora espera o JSON atualizar antes de liberar o botão
    await aguardarAtualizacaoGrupos(btn);

  } catch (err) {
    alert('Erro ao obter grupos. Verifique a instância e tente novamente.');
    console.error(err);
    btn.innerHTML = '🔍 Obter Grupos';
    btn.disabled = false;
  }
}

function aguardarAtualizacaoGrupos(btn) {
  let tentativas = 0;
  const intervalo = setInterval(async () => {
    tentativas++;
    try {
      const res = await fetch('scripts/lista_grupos.json?nocache=' + Date.now());
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        clearInterval(intervalo);
        gruposCache = data;
        paginaAtual = 1;
        await fetch('scripts/salvar-lista-grupos.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grupos: data })
        });
        document.getElementById('gruposListados').style.display = 'block';
        renderizarTabelaGrupos();
        console.log(`✅ JSON atualizado após ${tentativas * 3} segundos.`);

        // ✅ Libera o botão só aqui
        btn.innerText = '🔍 Obter Grupos';
        btn.disabled = false;
      }
    } catch (err) {
      console.warn('Aguardando resposta do JSON...');
    }

    if (tentativas >= 10) {
      clearInterval(intervalo);
      alert('❌ Ocorreu um erro ao carregar a lista de grupos. Tente novamente.');
      btn.innerText = '🔍 Obter Grupos';
      btn.disabled = false;
    }
  }, 3000);
}

async function dispararParaGrupos() {
  const mensagem = document.getElementById('mensagemGrupos').value.trim();
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');
  const rows = document.querySelectorAll('#tabelaDisparo tbody tr');

  const ids = [];
  const statusCells = [];

  rows.forEach(row => {
    const id = row.cells[2].innerText.trim();
    const statusCell = row.cells[3];
    if (id) {
      ids.push(id);
      statusCells.push(statusCell);
      statusCell.textContent = 'Enviando...';
      statusCell.style.color = '#ffc107';
    }
  });

  if (!mensagem || ids.length === 0) {
    alert("Mensagem ou IDs inválidos.");
    return;
  }

  try {
    const res = await fetch(WEBHOOKS.dispararGrupos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instancia,
        porta,
        mensagem,
        grupos: ids,
        systemURL: WEBHOOKS.systemURL
      })
    });

    const sucesso = res.ok;

    statusCells.forEach(cell => {
      cell.textContent = sucesso ? 'Enviado' : 'Erro';
      cell.style.color = sucesso ? '#00ff88' : '#ff4d4d';
    });

  } catch (err) {
    statusCells.forEach(cell => {
      cell.textContent = 'Falha';
      cell.style.color = '#ff4d4d';
    });
    console.error("Erro ao enviar mensagem para grupos:", err);
  }
}

// Menu de contexto dinâmico
const contextMenu = document.createElement('div');
contextMenu.id = 'contextMenu';
contextMenu.style = `
  display: none;
  position: absolute;
  background: #1e1e1e;
  border: 1px solid #00ff88;
  border-radius: 8px;
  z-index: 9999;
`;
contextMenu.innerHTML = `
  <div class="context-option" onclick="editarNomeGrupo(this)">✏️ Alterar nome</div>
  <div class="context-option" onclick="abrirLightboxDescricao(this)">📋 Mudar descrição</div>
  <div class="context-option" onclick="extrairContatosGrupo()">📥 Extrair contatos</div>
`;
document.body.appendChild(contextMenu);

document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

document.addEventListener('contextmenu', function(e) {
  if (e.target.closest('.nome-grupo')) {
    e.preventDefault();

    const nomeTd = e.target.closest('.nome-grupo');
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.id = nomeTd.dataset.id;
    contextMenu.dataset.nome = nomeTd.innerText;
    contextMenu._targetCell = nomeTd;
  }
});

let touchTimeout;

document.addEventListener('touchstart', function(e) {
  const target = e.target.closest('.nome-grupo');
  if (!target) return;

  touchTimeout = setTimeout(() => {
    const nomeTd = target;
    const touch = e.touches[0];

    contextMenu.style.top = `${touch.pageY}px`;
    contextMenu.style.left = `${touch.pageX}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.id = nomeTd.dataset.id;
    contextMenu.dataset.nome = nomeTd.innerText;
    contextMenu._targetCell = nomeTd;
  }, 600); // 600ms para simular "segurar"

}, { passive: true });

document.addEventListener('touchend', function() {
  clearTimeout(touchTimeout);
});


function editarNomeGrupo() {
  contextMenu.style.display = 'none';
  const cell = contextMenu._targetCell;
  const grupoId = contextMenu.dataset.id;
  const originalText = cell.innerText;

  if (cell.querySelector('.edit-wrapper')) return;

  // Salva o conteúdo original e limpa a célula
  cell.innerHTML = '';

  // Cria wrapper de edição
  const wrapper = document.createElement('div');
  wrapper.className = 'edit-wrapper';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '10px';

  // Campo editável
  const spanEdit = document.createElement('span');
  spanEdit.contentEditable = true;
  spanEdit.innerText = originalText;
  spanEdit.style.outline = '2px solid #00ff88';
  spanEdit.style.padding = '4px 8px';
  spanEdit.style.borderRadius = '6px';
  spanEdit.style.backgroundColor = '#1e1e1e';
  spanEdit.style.color = '#00ff88';
  spanEdit.style.flexGrow = '1';

  // Foca e seleciona o texto
  setTimeout(() => {
    spanEdit.focus();
    document.getSelection().selectAllChildren(spanEdit);
  }, 10);

  // Botão salvar
  const btnSalvar = document.createElement('button');
  btnSalvar.textContent = 'Salvar';
  btnSalvar.style = 'padding: 4px 10px; background: #00ff88; color: #000; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;';
  btnSalvar.onclick = async () => {
    const novoNome = spanEdit.innerText.trim();
    const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

    // 🌀 Cria spinner e aplica no botão
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = `<i class="fas fa-spinner spinner"></i>`;

    try {
      const res = await fetch(WEBHOOKS.mudarNomeGrupo, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idGrupo: grupoId,
          novoNome,
          instancia,
          porta,
          systemURL: WEBHOOKS.systemURL
        })
      });

      const json = await res.json();
      if (json.status === 'sucesso') {
        cell.innerText = novoNome;
        alert('✅ Nome alterado com sucesso!');
      } else {
        cell.innerText = originalText;
        alert('❌ Erro ao alterar nome.');
      }
    } catch (err) {
      console.error('Erro ao salvar novo nome:', err);
      cell.innerText = originalText;
      alert('❌ Erro ao comunicar com o servidor.');
    }
  };

  // Botão cancelar
  const btnCancelar = document.createElement('button');
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.style = 'padding: 4px 10px; background: #ff4d4d; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;';
  btnCancelar.onclick = () => {
    cell.innerText = originalText;
  };

  wrapper.appendChild(spanEdit);
  wrapper.appendChild(btnSalvar);
  wrapper.appendChild(btnCancelar);
  cell.appendChild(wrapper);
}

async function mudarNomeGrupo() {
  const id = document.getElementById('idNomeGrupo').value;
  const nome = document.getElementById('novoNomeGrupo').value;
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

  const res = await fetch(WEBHOOKS.mudarNomeGrupo, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idGrupo: id,
      novoNome: nome,
      instancia,
      porta,
      systemURL: WEBHOOKS.systemURL
    })
  });

  const json = await res.json();
  if (json.status === "sucesso") {
    alert(json.mensagem); // ou mostrar mensagem no DOM
  } else {
    alert("Algo deu errado ao alterar o nome.");
  }
}

let escutandoIADescricao = false;
let intervalDescricaoIA = null;
let originalDescricao = '';

async function melhorarDescricao() {
  const texto = document.getElementById('novaDescricaoGrupo').value;
  const btn = document.querySelector('#novaDescricaoGrupo + .controls button');

  // Evita duplicações removendo todos os filhos antes de adicionar
  btn.innerHTML = '';

  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.textContent = '⏳';

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = 'Melhorando...';

  btn.appendChild(icon);
  btn.appendChild(text);

  btn.classList.add('loading');
  icon.classList.add('icon');
  icon.textContent = '⏳';
  text.classList.add('text');
  text.textContent = 'Melhorando...';

  originalDescricao = texto;

  await fetch(WEBHOOKS.melhorarIA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      texto,
      systemURL: WEBHOOKS.systemURL
    })
  });

  if (!escutandoIADescricao) {
    escutandoIADescricao = true;
    intervalDescricaoIA = setInterval(async () => {
      try {
        const res = await fetch('scripts/mensagem_ia.json?nocache=' + Date.now());
        const data = await res.json();

        if (data.mensagem) {
          document.getElementById('novaDescricaoGrupo').value = data.mensagem;

          btn.classList.remove('loading');
          icon.textContent = '✅';
          text.textContent = 'Melhorado!';
          btn.classList.add('success');

          setTimeout(() => {
            icon.textContent = '✨';
            text.textContent = 'Melhorar com IA';
            btn.classList.remove('success');
          }, 4000);

          clearInterval(intervalDescricaoIA);
          escutandoIADescricao = false;

          // Limpa JSON após uso
          await fetch('scripts/atualizar-mensagem-ia.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }
      } catch (err) {
        console.warn('Erro ao escutar descrição IA:', err);
      }
    }, 3000);
  }
}

let grupoIdDescricao = '';

async function mudarDescricaoGrupo() {
  const id = document.getElementById('idDescGrupo').value;
  const desc = document.getElementById('novaDescricaoGrupo').value;
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

  const res = await fetch(WEBHOOKS.mudarDescricaoGrupo, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idGrupo: id,
      novaDescricao: desc,
      instancia,
      porta,
      systemURL: WEBHOOKS.systemURL
    })
  });

  const json = await res.json();

  if (json.status === "sucesso") {
    alert(json.mensagem); // Ou substituir por um toast ou DOM feedback
  } else {
    alert("Algo deu errado ao alterar a descrição.");
  }
}

let gruposCache = [];
let gruposPorPagina = 10;
let paginaAtual = 1;

async function carregarGrupos() {
  const res = await fetch('scripts/lista_grupos.json?nocache=' + Date.now());
  const data = await res.json();

  gruposCache = data;
  paginaAtual = 1;
  document.getElementById('gruposListados').style.display = 'block';
  document.getElementById('instrucoesGrupos').style.display = 'block';
  renderizarTabelaGrupos();
}

function renderizarTabelaGrupos() {
  const busca = document.getElementById('buscaGrupo').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tabela = document.querySelector('#tabelaGrupos tbody');
  const paginacao = document.getElementById('paginacaoGrupos');

  let gruposFiltrados = gruposCache.filter(grupo =>
    grupo.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(busca)
  );

  const totalPaginas = Math.ceil(gruposFiltrados.length / gruposPorPagina);
  const inicio = (paginaAtual - 1) * gruposPorPagina;
  const fim = inicio + gruposPorPagina;

  tabela.innerHTML = '';
  gruposFiltrados.slice(inicio, fim).forEach(grupo => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td class="nome-grupo" data-id="${grupo.id}" style="cursor:pointer; color:#00ff88">${grupo.name}</td>
      <td>${grupo.id}</td>
    `;
    tabela.appendChild(linha);
  });

  // Atualiza paginação
  paginacao.innerHTML = '';
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.style.cssText = `
      background-color: ${i === paginaAtual ? '#00ff88' : '#1e1e1e'};
      color: ${i === paginaAtual ? '#000' : '#00ff88'};
      border: 1px solid #00ff88;
      border-radius: 5px;
      padding: 6px 12px;
      cursor: pointer;
    `;
    btn.onclick = () => {
      paginaAtual = i;
      renderizarTabelaGrupos();
    };
    paginacao.appendChild(btn);
  }
}

// Escuta campo de busca
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buscaGrupo').addEventListener('input', renderizarTabelaGrupos);
  atualizarStatusGrupos(); // ⬅️ aqui o intervalo automático
});

function atualizarStatusGrupos() {
  setInterval(async () => {
    try {
      const res = await fetch('scripts/status_grupos.json?nocache=' + Date.now());
      const data = await res.json();
      const rows = document.querySelectorAll('#tabelaDisparo tbody tr');

      rows.forEach(row => {
        const idGrupo = row.cells[2].innerText.trim();
        const statusCell = row.cells[3];

        if (!idGrupo || !data[idGrupo]) return;

        const status = data[idGrupo];

        if (status === 'enviado') {
          statusCell.textContent = 'Enviado';
          statusCell.style.color = '#00ff88';
        } else if (status === 'erro') {
          statusCell.textContent = 'Erro';
          statusCell.style.color = '#ff4d4d';
        } else if (status === 'enviando') {
          statusCell.textContent = 'Enviando...';
          statusCell.style.color = '#ffc107';
        }
      });
    } catch (err) {
      console.error('Erro ao atualizar status dos grupos:', err);
    }
  }, 3000);
}


let gruposSelecionados = new Set();

// Listener para clique em nome do grupo
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('nome-grupo')) {
    const nome = e.target.innerText;
    const id = e.target.dataset.id;

    if (gruposSelecionados.has(id)) {
      gruposSelecionados.delete(id);
      e.target.style.backgroundColor = '';
      e.target.style.fontWeight = 'normal';
      removerLinhaDaTabela(id);
    } else {
      gruposSelecionados.add(id);
      e.target.style.backgroundColor = '#00ff8855';
      e.target.style.fontWeight = 'bold';
      adicionarNaTabelaDisparo(nome, id);
    }
  }
});

function adicionarNaTabelaDisparo(nome, id) {
  const tabela = document.querySelector('#tabelaDisparo tbody');

  if ([...tabela.querySelectorAll('tr')].some(tr => tr.cells[2]?.dataset?.id === id)) return;

  const linha = document.createElement('tr');
  linha.innerHTML = `
    <td><span style="cursor:pointer; color:red;" onclick="removerLinhaPorClique(this, '${id}')">❌</span></td>
    <td>${nome}</td>
    <td data-id="${id}">${id}</td>
    <td>—</td>
  `;
  tabela.appendChild(linha);
}

function removerLinhaPorClique(element, id) {
  const linha = element.closest('tr');
  if (linha) linha.remove();

  // Desmarcar visual na tabela de grupos
  const grupo = document.querySelector(`.nome-grupo[data-id="${id}"]`);
  if (grupo) {
    grupo.style.backgroundColor = '';
    grupo.style.fontWeight = 'normal';
  }

  gruposSelecionados.delete(id);
}

function removerLinhaDaTabela(id) {
  const linhas = document.querySelectorAll('#tabelaDisparo tbody tr');
  linhas.forEach(linha => {
    const cell = linha.querySelector('td:nth-child(3)');
    if (cell && cell.dataset.id === id) {
      linha.remove();
    }
  });
}

let escutandoIA = false;
let intervalIA = null;
let originalMensagem = '';

async function melhorarMensagemComIA() {
  const mensagem = document.getElementById('mensagemGrupos').value;
  const btn = document.getElementById('btnMelhorarIA');
  const icon = btn.querySelector('.icon');
  const text = btn.querySelector('.text');

  btn.classList.add('loading');
  icon.innerHTML = `<i class="fas fa-spinner spinner"></i>`;
  text.textContent = 'Melhorando...';

  originalMensagem = mensagem;

  await fetch(WEBHOOKS.melhorarIA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      texto: mensagem,
      systemURL: WEBHOOKS.systemURL
    })
  });

  if (!escutandoIA) {
    escutandoIA = true;
    intervalIA = setInterval(async () => {
      try {
        const res = await fetch('scripts/mensagem_ia.json?nocache=' + Date.now());
        const data = await res.json();

        if (data.mensagem) {
          document.getElementById('mensagemGrupos').value = data.mensagem;
          document.getElementById('btnReverterIA').style.display = 'inline-block';

          btn.classList.remove('loading');
          icon.textContent = '✅';
          text.textContent = 'Melhorado!';
          btn.classList.add('success');

          setTimeout(() => {
            icon.textContent = '✨';
            text.textContent = 'Melhorar com IA';
            btn.classList.remove('success');
          }, 5000);

          clearInterval(intervalIA);
          escutandoIA = false;

          // Limpa o JSON da IA
          await fetch('scripts/atualizar-mensagem-ia.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }
      } catch (err) {
        console.warn('Erro ao escutar mensagem IA:', err);
      }
    }, 3000);
  }
}

function reverterMensagemIA() {
  document.getElementById('mensagemGrupos').value = originalMensagem;
  document.getElementById('btnReverterIA').style.display = 'none';

  const btn = document.getElementById('btnMelhorarIA');
  const icon = btn.querySelector('.icon');
  const text = btn.querySelector('.text');

  icon.textContent = '✨';
  text.textContent = 'Melhorar com IA';
  btn.classList.remove('success');
}

function abrirLightboxConfirmacao() {
  const instanciaSelecionada = document.getElementById('instanciaSelect').value;
  document.getElementById('instancia-lightbox').value = instanciaSelecionada;
  document.getElementById('lightbox-confirmacao').style.display = 'flex';
}

function fecharLightbox() {
  document.getElementById('lightbox-confirmacao').style.display = 'none';
}

function confirmarDisparoParaGrupos() {
  const novaInstancia = document.getElementById('instancia-lightbox').value;
  document.getElementById('instanciaSelect').value = novaInstancia; // Atualiza também o select principal
  fecharLightbox();
  dispararParaGrupos();
}

function abrirLightboxDescricao() {
  grupoIdDescricao = contextMenu.dataset.id; // <- salva o ID antes de fechar
  document.getElementById('novaDescricaoTexto').value = '';
  document.getElementById('lightbox-descricao').style.display = 'flex';
  contextMenu.style.display = 'none';
}

function fecharLightboxDescricao() {
  document.getElementById('lightbox-descricao').style.display = 'none';
}

function formatarTexto(tipo) {
  const textarea = document.getElementById('mensagemGrupos');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const textoSelecionado = textarea.value.substring(start, end);

  let simbolo = tipo === 'negrito' ? '*' : '_';
  const novoTexto = simbolo + textoSelecionado + simbolo;

  textarea.setRangeText(novoTexto, start, end, 'end');
  textarea.focus();
}

async function salvarMensagemAtual() {
  const mensagem = document.getElementById('mensagemGrupos').value.trim();
  if (!mensagem) return alert("Mensagem vazia.");

  const titulo = prompt("Dê um título para essa mensagem:");
  if (!titulo) return;

  const res = await fetch('scripts/mensagens-repositorio-grupos.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, mensagem })
  });

  const data = await res.json();
  if (data.ok) alert("Mensagem salva com sucesso!");
  else alert("Erro ao salvar.");
}

async function abrirLightboxMensagens() {
  const res = await fetch('scripts/mensagens-repositorio-grupos.php');
  const mensagens = await res.json();

  const container = document.getElementById('listaMensagensSalvas');
  container.innerHTML = '';

  if (mensagens.length === 0) {
    container.innerHTML = '<p style="color: #ccc;">Nenhuma mensagem salva ainda.</p>';
    return;
  }

  mensagens.forEach((item, index) => {
    const bloco = document.createElement('div');
    bloco.style = 'border: 1px solid #00ff88; border-radius: 8px; padding: 10px; margin-bottom: 12px; background: #2a2a2a;';

    bloco.innerHTML = `
      <strong style="color: #00ff88;">${item.titulo}</strong>
      <pre style="white-space: pre-wrap; color: #ddd; font-family: inherit;">${item.mensagem}</pre>
      <div style="display: flex; gap: 10px;">
        <button onclick="usarMensagemSalva('${encodeURIComponent(item.mensagem)}')" style="background: #00ff88; color: #000; font-weight: bold; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">Usar esta</button>
        <button onclick="excluirMensagemSalva(${index})" style="background: #ff4d4d; color: #fff; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">Excluir</button>
      </div>
    `;
    container.appendChild(bloco);
  });

  document.getElementById('lightbox-mensagens').style.display = 'block';
}

function fecharLightboxMensagens() {
  document.getElementById('lightbox-mensagens').style.display = 'none';
}

function usarMensagemSalva(mensagemEncoded) {
  const mensagem = decodeURIComponent(mensagemEncoded);
  document.getElementById('mensagemGrupos').value = mensagem;
  fecharLightboxMensagens();
}

async function excluirMensagemSalva(index) {
  const confirmacao = confirm("Tem certeza que deseja excluir esta mensagem?");
  if (!confirmacao) return;

  const res = await fetch('scripts/mensagens-repositorio-grupos.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index })
  });

  const data = await res.json();
  if (data.ok) {
    await abrirLightboxMensagens(); // atualiza a lista
  } else {
    alert("Erro ao excluir: " + (data.erro || 'desconhecido'));
  }
}


async function salvarDescricaoGrupo() {
  const btnSalvar = document.querySelector('#lightbox-descricao button');
  const novaDescricao = document.getElementById('novaDescricaoTexto').value.trim();
  const grupoId = grupoIdDescricao || '';
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

  if (!grupoId) {
    alert('❌ ID do grupo não foi detectado.');
    return;
  }

  // Feedback visual no botão
  btnSalvar.disabled = true;
  const originalText = btnSalvar.innerHTML;
  btnSalvar.innerHTML = `<i class="fas fa-spinner spinner"></i>`;

  try {
    const res = await fetch(WEBHOOKS.mudarDescricaoGrupo, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idGrupo: grupoId,
        novaDescricao,
        instancia,
        porta,
        systemURL: WEBHOOKS.systemURL
      })
    });

    const json = await res.json();
    if (json.status === 'sucesso') {
      alert('✅ Descrição alterada!');
    } else {
      alert('❌ Erro ao alterar descrição!');
    }
  } catch (err) {
    console.error('Erro ao salvar descrição:', err);
    alert('❌ Erro de comunicação com o servidor.');
  }

  // Restaurar botão e fechar lightbox
  btnSalvar.disabled = false;
  btnSalvar.innerHTML = originalText;
  fecharLightboxDescricao();
  grupoIdDescricao = ''; // limpa depois de usar
}

// Fecha o menu ao tocar fora ou rolar a tela
function fecharContextMenu() {
  contextMenu.style.display = 'none';
  contextMenu._targetCell = null;
  contextMenu.dataset.id = '';
  contextMenu.dataset.nome = '';
}

async function extrairContatosGrupo() {
  const idGrupo = contextMenu.dataset.id;
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

  try {
    const res = await fetch(WEBHOOKS.extrairContatos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idGrupo,
        porta,
        systemURL: WEBHOOKS.systemURL
      })
    });

    const data = await res.json();

    if (!data.status) throw new Error("Resposta inválida.");

    // Exibe na lightbox
    abrirLightboxContatos(data.contatos, data.quantidade || data.contatos.length);

  } catch (err) {
    alert("❌ Erro ao extrair contatos.");
    console.error(err);
  }

  fecharContextMenu();
}

let contatosExtraidos = [];

function abrirLightboxContatos(lista, quantidade) {
  contatosExtraidos = lista;
  document.getElementById('contatosQuantidade').innerText = `📱 ${quantidade} contato(s) extraído(s)`;
  const container = document.getElementById('contatosTabela');

  const porPagina = 15;
  let pagina = 1;

  function renderTabela() {
    const inicio = (pagina - 1) * porPagina;
    const fim = inicio + porPagina;
    const contatosPagina = contatosExtraidos.slice(inicio, fim);

    container.innerHTML = `
      <table style="width:100%; border-collapse: collapse;">
        <thead><tr><th style="text-align:left; border-bottom:1px solid #00ff88;">Telefone</th></tr></thead>
        <tbody>
          ${contatosPagina.map(c => `<tr><td style="padding:8px 0;">${c}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:10px; text-align:center;">
        ${Array.from({ length: Math.ceil(contatosExtraidos.length / porPagina) }, (_, i) => 
          `<button onclick="mudarPaginaContatos(${i + 1})" style="margin:0 4px; padding:4px 8px; border:1px solid #00ff88; background:${pagina === i + 1 ? '#00ff88' : '#1e1e1e'}; color:${pagina === i + 1 ? '#000' : '#00ff88'}; border-radius:4px;">${i + 1}</button>`
        ).join('')}
      </div>
    `;
  }

  window.mudarPaginaContatos = function(novaPagina) {
    pagina = novaPagina;
    renderTabela();
  }

  renderTabela();
  document.getElementById('lightbox-contatos').style.display = 'flex';
}

function fecharLightboxContatos() {
  document.getElementById('lightbox-contatos').style.display = 'none';
}

function exportarContatosCSV() {
  const csv = contatosExtraidos.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'contatos_extraidos.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function salvarContatosComoLista() {
  const nomeLista = prompt("Dê um nome para a nova lista:");
  if (!nomeLista || contatosExtraidos.length === 0) return;

  const payload = {
    nome: nomeLista,
    contatos: contatosExtraidos.map(telefone => ({
      nome: '',
      telefone
    }))
  };

  const res = await fetch('scripts/salvar-lista.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.ok) {
    alert("✅ Lista salva com sucesso!");
    fecharLightboxContatos();
  } else {
    alert("❌ Erro ao salvar lista.");
  }
}

function abrirLightboxAgendamento() {
  document.getElementById('lightbox-agendar').style.display = 'flex';
}
function fecharLightboxAgendar() {
  document.getElementById('lightbox-agendar').style.display = 'none';
}

async function salvarAgendamento() {
  const nome = document.getElementById('nomeAgendamento').value.trim();
  const dataHora = document.getElementById('dataHoraAgendamento').value;
  const mensagem = document.getElementById('mensagemGrupos').value.trim();
  const [instancia, porta] = document.getElementById('instanciaSelect').value.split('|');

  const rows = document.querySelectorAll('#tabelaDisparo tbody tr');
  const grupos = [...rows].map(row => ({
    nome: row.cells[1].innerText,
    id: row.cells[2].innerText
  }));

  if (!nome || !dataHora || !mensagem || grupos.length === 0) {
    alert("Preencha todos os campos e selecione os grupos.");
    return;
  }

  const payload = {
    nome,
    dataHora,
    grupos,
    mensagem,
    instancia,
    porta,
    systemURL: WEBHOOKS.systemURL
  };

  const res = await fetch('scripts/disparos-agendados.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (json.ok) {
    alert("✅ Agendamento salvo!");
    fecharLightboxAgendar();
  } else {
    alert("❌ Erro ao salvar agendamento.");
  }
}

function abrirLightboxAgendamentos() {
  fetch('scripts/disparos-agendados.php')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('listaAgendamentos');
      if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = "<p style='color:#ccc;'>Nenhum disparo agendado.</p>";
        return;
      }

      container.innerHTML = '';
      lista.forEach((item, index) => {
        const gruposHtml = item.grupos.map(g => `${g.nome} (${g.id})`).join('<br>');
        // Formatador de data para DD-MM-AAAA HH:MM
        const data = new Date(item.dataHora);
        const dataFormatada = data.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '');

        container.innerHTML += `
          <div style="border:1px solid #00ff88; border-radius:8px; padding:16px 20px; margin:16px 0; background:#1a1a1a; color:#eee;">
            <div style="font-weight:bold; color:#00ff88; font-size:16px;">
              📌 ${item.nome} | 📅 ${dataFormatada}
            </div>
            <div style="margin-top:10px;">
              👥 ${gruposHtml}
            </div>
            <div style="margin-top:10px;">
              📝 <strong>Mensagem:</strong><br>
              <pre style="white-space: pre-wrap; font-family: inherit; color: #ccc; margin-top: 4px;">${item.mensagem}</pre>
            </div>
            <div style="margin-top:10px; text-align:right;">
              <button onclick="excluirAgendamento(${index})" style="background:#ff4d4d; color:#fff; padding:6px 12px; border:none; border-radius:6px;">Excluir</button>
            </div>
          </div>`;

      });
      document.getElementById('lightbox-agendamentos').style.display = 'flex';
    });
}

function fecharLightboxAgendamentos() {
  document.getElementById('lightbox-agendamentos').style.display = 'none';
}

async function excluirAgendamento(index) {
  const confirma = confirm("Deseja excluir este agendamento?");
  if (!confirma) return;

  const res = await fetch('scripts/disparos-agendados.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index })
  });

  const json = await res.json();
  if (json.ok) abrirLightboxAgendamentos();
  else alert("❌ Erro ao excluir agendamento.");
}

document.addEventListener('click', fecharContextMenu);
document.addEventListener('scroll', fecharContextMenu, true); // true propaga até os scrolls internos
window.addEventListener('resize', fecharContextMenu);