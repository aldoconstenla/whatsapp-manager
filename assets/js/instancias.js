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

function toggleQRCode(porta, el) {
    const iframe = document.getElementById(`qr-${porta}`);
    if (iframe.style.display === 'block') {
        iframe.style.display = 'none';
        el.textContent = '📷 Ver QR Code';
    } else {
        iframe.src = `http://5.189.148.139:${porta}`;
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