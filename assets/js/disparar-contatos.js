let escutandoIA = false;
let originalMensagem = '';
let intervalIA = null;

function toggleMenu() {
  const menu = document.getElementById('menuDropdown');
  menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
}
function closeMenu() {
  document.getElementById('menuDropdown').style.display = 'none';
}
document.addEventListener('click', function (event) {
  const menu = document.getElementById('menuDropdown');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu.contains(event.target) && !toggle.contains(event.target)) {
    closeMenu();
  }
});

function handlePaste(e) {
  e.preventDefault();
  const clipboard = (e.clipboardData || window.clipboardData).getData('text');
  const linhas = clipboard.trim().split('\n');

  // Remove linhas completamente vazias da tabela ANTES de colar
  const tbody = document.querySelector('#planilha tbody');
  const linhasExistentes = Array.from(tbody.querySelectorAll('tr'));

  const linhasComDados = linhasExistentes.filter(tr => {
    const nome = tr.cells[1].innerText.trim();
    const telefone = tr.cells[2].innerText.trim();
    return nome || telefone;
  });

  if (linhasComDados.length === 0) {
    tbody.innerHTML = ''; // Limpa todas se não houver dados úteis
  }

  linhas.forEach(linha => {
    const colunas = linha.split('\t');
    const nome = colunas.length === 2 ? colunas[0].trim() : '';
    const telefone = colunas.length === 2 ? colunas[1].trim() : colunas[0].trim();
    addRow(nome, telefone);
  });
}

function addRow(nome = '', telefone = '') {
  const tbody = document.querySelector('#planilha tbody');
  const linha = document.createElement('tr');

  linha.innerHTML = `
    <td class="delete-row" onclick="this.parentElement.remove()">✖</td>
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td class="status">—</td>
  `;
  tbody.appendChild(linha);

  const cells = linha.querySelectorAll('td[contenteditable="true"]');

  if (nome) cells[0].innerText = nome;
  if (telefone) cells[1].innerText = telefone;

  // Evento de Enter no campo Nome → vai pro campo Telefone
  cells[0].addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      cells[1].focus();
    }
  });

  // Evento de Enter no campo Telefone → cria nova linha e foca no próximo Nome
  cells[1].addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRow();
      const novasLinhas = document.querySelectorAll('#planilha tbody tr');
      const ultima = novasLinhas[novasLinhas.length - 1];
      const novoNome = ultima.querySelectorAll('td[contenteditable="true"]')[0];
      novoNome.focus();
    }
  });

  // Foca no campo nome recém criado (se não for preenchido por paste)
  if (!nome && !telefone) {
    cells[0].focus();
  }
}

function limpar() {
  document.querySelector('#planilha tbody').innerHTML = '';
  addRow();

  // Reseta a mensagem da IA
  fetch('scripts/atualizar-mensagem-ia.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Reseta o status do usuário via PHP
  fetch(`scripts/atualizar-status.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: USUARIO_LOGADO, reset: true })
  });

  // Reseta a sessão persistente
  fetch('scripts/limpar-sessao.php', {
    method: 'POST'
  });
}


async function disparar() {
  const [nomeInstancia, porta] = document.getElementById('instancia').value.split('|');
  const mensagemBruta = document.getElementById('mensagem').value.trim();
  const erroMensagem = document.getElementById('mensagem-erro');

  // Verifica se a mensagem está vazia
  if (!mensagemBruta) {
    erroMensagem.textContent = '⚠️ A mensagem não pode estar vazia.';
    erroMensagem.style.display = 'block';
    return;
  }

  const rows = document.querySelectorAll('#planilha tbody tr');
  const contatos = [];

  for (const row of rows) {
    const nome = row.cells[1].innerText.trim();

    const telefone = row.cells[2].innerText
    .replace(/[^\d]/g, '')
    .normalize('NFKD')
    .trim();

    const statusCell = row.cells[3];

    if (!telefone) continue;

    contatos.push({ nome, telefone, statusCell });
    statusCell.textContent = 'Enviando...';
    statusCell.className = 'status status-enviando';
  }

  // Verifica se não há nenhum número válido
  if (contatos.length === 0) {
    erroMensagem.textContent = '⚠️ Nenhum número foi preenchido na planilha.';
    erroMensagem.style.display = 'block';
    return;
  } else {
    erroMensagem.style.display = 'none';
  }

  try {
    const payload = {
      instancia: nomeInstancia,
      porta: porta,
      mensagem: mensagemBruta,
      usuario: USUARIO_LOGADO,
      contatos: contatos.map(({ nome, telefone }) => ({
        nome,
        telefone
      })),
      systemURL: WEBHOOKS.systemURL
    };

    await fetch(WEBHOOKS.disparoContatos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Salvar sessão automaticamente após o disparo
    await fetch('scripts/salvar-sessao.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: USUARIO_LOGADO,
        mensagem: mensagemBruta,
        contatos: contatos.map(({ nome, telefone }) => ({
          nome,
          telefone
        }))
      })
    });

  } catch (err) {
    contatos.forEach(c => {
      c.statusCell.textContent = 'Erro de rede';
      c.statusCell.className = 'status status-erro';
    });
  }

}

// Esconde erro ao digitar na mensagem
document.getElementById('mensagem').addEventListener('input', () => {
  const erroMensagem = document.getElementById('mensagem-erro');
  if (erroMensagem.textContent.includes('mensagem')) {
    erroMensagem.style.display = 'none';
  }
});

// Esconde erro ao digitar número
document.addEventListener('input', (e) => {
  const erroMensagem = document.getElementById('mensagem-erro');
  if (
    erroMensagem.textContent.includes('número') &&
    e.target &&
    e.target.closest('td') &&
    e.target.closest('td').cellIndex === 2
  ) {
    erroMensagem.style.display = 'none';
  }
});

function abrirLightboxConfirmacao() {
  const instanciaSelecionada = document.getElementById('instancia').value;
  const selectLightbox = document.getElementById('instancia-lightbox');
  selectLightbox.value = instanciaSelecionada;
  document.getElementById('lightbox-confirmacao').style.display = 'flex';
}

function fecharLightbox() {
  document.getElementById('lightbox-confirmacao').style.display = 'none';
}

function confirmarDisparo() {
  const novaInstancia = document.getElementById('instancia-lightbox').value;
  document.getElementById('instancia').value = novaInstancia; // atualiza o select principal também
  fecharLightbox();
  disparar();
}

async function melhorarComIA() {
  const mensagem = document.getElementById('mensagem').value;
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
          document.getElementById('mensagem').value = data.mensagem;
          sincronizarMensagem();

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

function sincronizarMensagem() {
  const msg = document.getElementById('mensagem').value;
  if (originalMensagem && msg.trim() !== originalMensagem.trim()) {
    document.getElementById('btnReverterIA').style.display = 'none';
  }
}

function reverterIA() {
  document.getElementById('mensagem').value = originalMensagem;
  sincronizarMensagem();

  const btn = document.getElementById('btnMelhorarIA');
  const icon = btn.querySelector('.icon');
  const text = btn.querySelector('.text');

  icon.textContent = '✨';
  text.textContent = 'Melhorar com IA';
  btn.classList.remove('success');

  document.getElementById('btnReverterIA').style.display = 'none';
}

async function carregarMensagemIA() {
  try {
    const res = await fetch('scripts/mensagem_ia.json?nocache=' + Date.now());
    const data = await res.json();

  } catch (err) {
    console.warn('Não foi possível carregar a mensagem da IA:', err);
  }
}

function inserirNoCursor(texto) {
  const textarea = document.getElementById('mensagem');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const antes = textarea.value.substring(0, start);
  const depois = textarea.value.substring(end);
  textarea.value = antes + texto + depois;
  textarea.selectionStart = textarea.selectionEnd = start + texto.length;
  textarea.focus();
  sincronizarMensagem();
}

function formatarTexto(tipo) {
  const textarea = document.getElementById('mensagem');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const textoSelecionado = textarea.value.substring(start, end);

  let simbolo = '';
  if (tipo === 'negrito') simbolo = '*';
  if (tipo === 'italico') simbolo = '_';

  const novoTexto = simbolo + textoSelecionado + simbolo;

  textarea.setRangeText(novoTexto, start, end, 'end');
  textarea.focus();
  sincronizarMensagem();
}


function atualizarStatusAutomatico() {
  setInterval(async () => {
    try {
      const res = await fetch(`scripts/status/status-${USUARIO_LOGADO}.json?nocache=` + Date.now());
      const data = await res.json();
      const rows = document.querySelectorAll('#planilha tbody tr');

      rows.forEach(row => {
        const telefone = row.cells[2].innerText.replace(/[^\d]/g, '').trim();
        const statusCell = row.cells[3];

        if (!telefone || !data[telefone]) return;

        const status = data[telefone];
        if (status === 'enviado') {
          statusCell.textContent = 'Enviado';
          statusCell.className = 'status status-enviado';
        } else if (status === 'erro') {
          statusCell.textContent = 'Erro';
          statusCell.className = 'status status-erro';
        } else if (status === 'enviando') {
          statusCell.textContent = 'Enviando...';
          statusCell.className = 'status status-enviando';
        }
      });
    } catch (err) {
      console.error('Erro ao buscar status do usuário:', err);
    }
  }, 3000);
}

async function salvarSessaoAtual() {
  const mensagem = document.getElementById('mensagem').value.trim();
  const rows = document.querySelectorAll('#planilha tbody tr');

  const contatos = [];

  for (const row of rows) {
    const nome = row.cells[1].innerText.trim();
    const telefone = row.cells[2].innerText.replace(/[^\d]/g, '').trim();
    if (!telefone) continue;
    contatos.push({ nome, telefone });
  }

  if (contatos.length === 0 && !mensagem) {
    alert("Nada para salvar.");
    return;
  }

  try {
    const res = await fetch('scripts/salvar-sessao.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: USUARIO_LOGADO,
        mensagem: mensagem,
        contatos: contatos
      })
    });

    const data = await res.json();

    if (data.ok) {
      alert('Sessão salva com sucesso!');
    } else {
      alert('Erro ao salvar sessão: ' + (data.erro || 'desconhecido'));
    }
  } catch (err) {
    alert('Erro ao salvar sessão: ' + err.message);
  }
}

async function carregarListasSalvas() {
  try {
    const res = await fetch('scripts/listar-listas.php');
    const listas = await res.json();

    const select = document.getElementById('selectListaSalva');
    select.innerHTML = '<option value="">📂 Carregar lista salva...</option>';
    listas.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });
  } catch (err) {
    console.warn('Erro ao carregar listas salvas:', err);
  }
}

async function carregarListaSelecionada() {
  const nome = document.getElementById('selectListaSalva').value;
  if (!nome) return;

  try {
    const res = await fetch(`scripts/carregar-lista.php?nome=${encodeURIComponent(nome)}`);
    const data = await res.json();

    document.querySelector('#planilha tbody').innerHTML = '';
    (data || []).forEach(contato => {
      addRow(contato.nome, contato.telefone);
    });
  } catch (err) {
    alert('Erro ao carregar a lista selecionada.');
  }
}

async function salvarComoLista() {
  const nomeLista = prompt("Digite um nome para salvar esta lista:");
  if (!nomeLista) return;

  const contatos = [];
  const rows = document.querySelectorAll('#planilha tbody tr');
  for (const row of rows) {
    const nome = row.cells[1].innerText.trim();
    const telefone = row.cells[2].innerText.replace(/[^\d]/g, '').trim();
    if (telefone) contatos.push({ nome, telefone });
  }

  if (contatos.length === 0) {
    alert("A lista está vazia.");
    return;
  }

  try {
    const res = await fetch('scripts/salvar-lista.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeLista, contatos })
    });

    const data = await res.json();
    if (data.ok) {
      alert("Lista salva com sucesso!");
      await carregarListasSalvas();
    } else {
      alert("Erro ao salvar a lista.");
    }
  } catch (err) {
    alert("Erro ao salvar a lista.");
  }
}

async function salvarMensagemAtual() {
  const mensagem = document.getElementById('mensagem').value.trim();
  if (!mensagem) {
    alert("Mensagem vazia.");
    return;
  }

  const titulo = prompt("Dê um título para essa mensagem:");
  if (!titulo) return;

  const res = await fetch('scripts/mensagens-repositorio.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, mensagem })
  });

  const data = await res.json();
  if (data.ok) {
    alert("Mensagem salva com sucesso!");
  } else {
    alert("Erro ao salvar: " + (data.erro || 'desconhecido'));
  }
}

async function abrirLightboxMensagens() {
  const res = await fetch('scripts/mensagens-repositorio.php');
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
  document.getElementById('mensagem').value = mensagem;
  sincronizarMensagem();
  fecharLightboxMensagens();
}

async function excluirMensagemSalva(index) {
  const confirmacao = confirm("Tem certeza que deseja excluir esta mensagem?");
  if (!confirmacao) return;

  const res = await fetch('scripts/mensagens-repositorio.php', {
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

function abrirLightboxAgendamentosContatos() {
  fetch('scripts/disparos-agendados-contatos.php')
    .then(res => res.json())
    .then(lista => {
      const container = document.getElementById('listaAgendamentosContatos');
      if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = "<p style='color:#ccc;'>Nenhum disparo agendado.</p>";
        return;
      }

      lista.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

      container.innerHTML = '';
      lista.forEach((item, index) => {
        const contatosHtml = item.contatos.map(c => `${c.nome || 'Sem nome'} (${c.telefone})`).join('<br>');
        const dataFormatada = new Date(item.dataHora).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).replace(',', '');

        container.innerHTML += `
          <div style="border:1px solid #00ff88; border-radius:8px; padding:10px; margin:10px 0; position:relative;">
            <div style="position:absolute; top:10px; right:10px; font-size:12px; color:#aaa;">
              🔧 ${item.instancia}
            </div>
            <strong style="color:#00ff88;">📌 ${item.nome}</strong> | <span style="color:#00c8ff;">📅 ${dataFormatada}</span><br>
            <span style="color:#ccc;">📱 ${contatosHtml}</span><br><br>
            <span style="color:#fff;">📄 <strong>Mensagem:</strong><br>${item.mensagem}</span>
            <div style="margin-top:10px; text-align:right;">
              <button onclick="excluirAgendamentoContatos(${index})" style="background:#ff4d4d; color:#fff; padding:6px 12px; border:none; border-radius:6px;">Excluir</button>
            </div>
          </div>`;
      });

      document.getElementById('lightbox-agendamentos-contatos').style.display = 'flex';
    });
}

async function excluirAgendamentoContatos(index) {
  const confirma = confirm("Deseja excluir este agendamento?");
  if (!confirma) return;

  const res = await fetch('scripts/disparos-agendados-contatos.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index })
  });

  const json = await res.json();
  if (json.ok) abrirLightboxAgendamentosContatos();
  else alert("❌ Erro ao excluir agendamento.");
}

function fecharLightboxAgendamentosContatos() {
  document.getElementById('lightbox-agendamentos-contatos').style.display = 'none';
}


window.addEventListener('DOMContentLoaded', async () => {
  atualizarStatusAutomatico();
  await carregarListasSalvas();

  try {
    const res = await fetch('scripts/carregar-sessao.php');
    const data = await res.json();

    document.getElementById('mensagem').value = data.mensagem || '';

    const contatos = data.contatos || [];
    const tbody = document.querySelector('#planilha tbody');
    tbody.innerHTML = '';

    if (contatos.length > 0) {
      contatos.forEach(contato => addRow(contato.nome, contato.telefone));
    } else {
      addRow(); // Cria linha vazia
    }

  } catch (err) {
    console.warn('Erro ao carregar sessão:', err);
    addRow(); // Garante pelo menos 1 linha vazia
  }

  // Resetar IA
  fetch('scripts/atualizar-mensagem-ia.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
});
