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

  // Reseta o status.json via PHP
  fetch('scripts/atualizar-status.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
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


window.addEventListener('DOMContentLoaded', async () => {
  atualizarStatusAutomatico();

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
