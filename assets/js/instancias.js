let menuOpen = false;

function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu.style.display = menuOpen ? 'none' : 'flex';
    menuOpen = !menuOpen;
}

function closeMenu() {
    document.querySelector('.menu').style.display = 'none';
    menuOpen = false;
}

document.addEventListener('click', function (e) {
    const menu = document.querySelector('.menu');
    const toggle = document.querySelector('.menu-toggle');
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
    }
});

document.getElementById('createForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch(e.target.action, {
        method: 'POST',
        body: formData
    });

    const result = await response.text();
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = result;
    statusDiv.style.display = 'block';

    if (result.includes('✅')) {
        setTimeout(() => window.location.reload(), 2000);
    }
});

document.getElementById('nome').addEventListener('input', function(e) {
    this.value = this.value.replace(/\s+/g, '-');
});

function toggleQRCode(porta, el) {
    const iframe = document.getElementById(`qr-${porta}`);
    if (iframe.style.display === 'block') {
        iframe.style.display = 'none';
        el.textContent = '📷 Ver QR Code';
    } else {
        iframe.src = `https://${porta}.bravosdigital.com.br/`;
        iframe.style.display = 'block';
        el.textContent = '❌ Ocultar QR Code';
    }
}

document.querySelectorAll('.delete-form').forEach(form => {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!confirm('Tem certeza que deseja deletar esta instância?')) return;

        const nome = form.dataset.nome;
        const porta = form.dataset.porta;
        const instanciaDiv = form.closest('.instancia');
        const statusDiv = instanciaDiv.querySelector('.delete-status');

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('porta', porta);

        try {
            const response = await fetch('scripts/delete_instancia.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.text();

            if (response.ok && result.includes('✅')) {
                statusDiv.style.color = '#00ff88';
                statusDiv.textContent = result;
                setTimeout(() => instanciaDiv.remove(), 1500);
            } else {
                statusDiv.style.color = 'red';
                statusDiv.textContent = result || '❌ Erro ao deletar.';
            }
        } catch (err) {
            statusDiv.style.color = 'red';
            statusDiv.textContent = '❌ Erro de conexão.';
        }
    });
});

function mostrarEndpoints(porta) {
    // Obter nome real da instância via DOM
    const instanciaElement = document.querySelector(`.instancia-header [onclick*="${porta}"]`)?.closest('.instancia')?.querySelector('.instancia-name');
    const nomeInstancia = instanciaElement ? instanciaElement.textContent.trim() : porta;

    const endpoints = [
        { nome: "Enviar mensagem particular (POST)", url: `/send-message`, body: "number, message" },
        { nome: "Enviar mensagem grupo (POST)", url: `/send-message-group`, body: "groupId, message" },
        { nome: "Mudar nome grupo (POST)", url: `/mudar-nome-grupo`, body: "groupId, newName" },
        { nome: "Mudar descrição grupo (POST)", url: `/mudar-descricao-grupo`, body: "groupId, newDescription" },
        { nome: "Extrair contatos grupo (POST)", url: `/extrair-contatos-grupo`, body: "groupId" },
        { nome: "Listar ID de grupos (GET)", url: `/listar-grupos?nome=${nomeInstancia}`, body: "" }
    ];

    let lista = endpoints.map(ep =>
        `🔹 <strong>${ep.nome}</strong><br>` +
        `📎 <code data-url="https://${porta}.bravosdigital.com.br${ep.url}">https://${porta}.bravosdigital.com.br${ep.url}</code><br>` +
        (ep.body ? `📦 <em>Body:</em> ${ep.body}<br><br>` : `<br>`)
    ).join('');

    const overlay = document.createElement('div');
    overlay.setAttribute('data-overlay-endpoints', '');
    overlay.innerHTML = `
        <div class="overlay-inner">
            <h3>📘 Endpoints da Instância 
                <code data-copy="${nomeInstancia}" style="font-size:16px;">${nomeInstancia}</code>
            </h3>
            ${lista}
            <div style="text-align: right;">
                <button onclick="document.querySelector('[data-overlay-endpoints]').remove()">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Copiar ao clicar nas URLs
    overlay.querySelectorAll('[data-url]').forEach(code => {
        code.addEventListener('click', function () {
            const texto = this.getAttribute('data-url');
            navigator.clipboard.writeText(texto).then(() => {
                this.classList.add('copied');
                mostrarToast('Copiado para a área de transferência ✅');
                setTimeout(() => this.classList.remove('copied'), 1000);
            });
        });
    });

    // Copiar ao clicar no nome da instância
    overlay.querySelectorAll('[data-copy]').forEach(code => {
        code.addEventListener('click', function () {
            const texto = this.getAttribute('data-copy');
            navigator.clipboard.writeText(texto).then(() => {
                this.classList.add('copied');
                mostrarToast('Nome da instância copiado ✅');
                setTimeout(() => this.classList.remove('copied'), 1000);
            });
        });
    });

    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        const inner = overlay.querySelector('.overlay-inner');
        if (!inner.contains(e.target)) {
            overlay.remove();
        }
    });
}

// Função Toast (adicione esta também no seu JS se ainda não adicionou)
function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-copiado';
    toast.innerText = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}


