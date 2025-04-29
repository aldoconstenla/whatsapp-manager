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
    const endpoints = [
        { nome: "Enviar mensagem particular (POST)", url: `/send-message`, body: "number, message" },
        { nome: "Enviar mensagem grupo (POST)", url: `/send-message-group`, body: "groupId, message" },
        { nome: "Mudar nome grupo (POST)", url: `/mudar-nome-grupo`, body: "groupId, newName" },
        { nome: "Mudar descrição grupo (POST)", url: `/mudar-descricao-grupo`, body: "groupId, newDescription" },
        { nome: "Extrair contatos grupo (POST)", url: `/extrair-contatos-grupo`, body: "groupId" },
        { nome: "Listar ID de grupos (GET)", url: `/listar-grupos?nome=NOME_DA_INSTANCIA`, body: "" }
    ];

    let lista = endpoints.map(ep =>
        `🔹 <strong>${ep.nome}</strong><br>` +
        `📎 <code>https://${porta}.bravosdigital.com.br${ep.url}</code><br>` +
        (ep.body ? `📦 <em>Body:</em> ${ep.body}<br><br>` : `<br>`)
    ).join('');

    const box = document.createElement('div');
    box.setAttribute('data-overlay-endpoints', ''); // <- marcador para facilitar remoção
    box.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7); z-index: 9999; display: flex; 
                    justify-content: center; align-items: center;"
             data-overlay-endpoints>
            <div style="background: #1e1e1e; color: #fff; padding: 20px; border-radius: 10px; 
                        max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">📘 Endpoints da Instância</h3>
                ${lista}
                <div style="text-align: right;">
                    <button onclick="this.closest('[data-overlay-endpoints]').remove()" 
                            style="margin-top: 10px; padding: 6px 14px; background: #00ff88; 
                                   border: none; color: #000; border-radius: 6px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(box);
    // Fecha se clicar fora da caixa interna
    const overlay = box.querySelector('[data-overlay-endpoints]');
    const caixaInterna = overlay.querySelector('div'); // primeira div interna é a caixa

    overlay.addEventListener('click', (e) => {
      if (!caixaInterna.contains(e.target)) {
        overlay.remove();
      }
    });

}
