// BACKEND DA API

// BIBLIOTECAS UTILIZADAS
const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// CONFIGURAÇÃO
const port = {{PORTA}};
const idClient = '{{NOME}}';
const gruposPath = path.join(__dirname, `grupos-${idClient}.json`);

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ debug: true }));
app.use("/", express.static(__dirname + "/"));

// Libera exibição via iframe (substitui X-Frame-Options e CSP)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // permite iframe de qualquer origem
  res.setHeader('Content-Security-Policy', "frame-ancestors *"); // CSP moderna
  next();
});

// ROTA INICIAL
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// CLIENT WHATSAPP
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: idClient
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

let isAuthenticated = false;
let isReady = false;

client.initialize();

// EVENTOS DE CONEXÃO SOCKET.IO
let connectedSockets = [];

function broadcast(event, payload) {
  connectedSockets.forEach(s => s.emit(event, payload));
}

// Eventos do WhatsApp Client (foram movidos pra fora do on connection)
client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.toDataURL(qr, (err, url) => {
    broadcast('qr', url);
    broadcast('message', '© WhatsApp API QRCode recebido, aponte a câmera do seu celular!');
  });
});

client.on('authenticated', () => {
  isAuthenticated = true;
  broadcast('authenticated', '© WhatsApp API Autenticado!');
  broadcast('message', '© WhatsApp API Autenticado!');
  console.log('© WhatsApp API Autenticado');
});

client.on('ready', async () => {
  isReady = true;
  broadcast('ready', '© WhatsApp API Dispositivo pronto!');
  broadcast('qr', './check.svg');
  broadcast('message', '© WhatsApp API Dispositivo pronto!');
  console.log(`✅ ${idClient} pronto e autenticado.`);

  // MANTÉM O SALVAMENTO DOS GRUPOS
  try {
    console.log(`📥 Obtendo grupos da instância ${idClient} via pupPage...`);
    if (!client.pupPage) {
      console.error(`❌ pupPage ainda não está disponível para ${idClient}.`);
      return;
    }

    const groups = await client.pupPage.evaluate(() => {
      if (!window.Store?.Chat) return [];
      return window.Store.Chat
        .filter(chat => chat.id?.server === 'g.us')
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name || '(sem nome)'
        }));
    });

    console.log(`📦 ${groups.length} grupo(s) encontrados na instância ${idClient}.`);

    fs.writeFileSync(gruposPath, JSON.stringify(groups, null, 2), 'utf-8');
    console.log(`💾 Grupos salvos em ${gruposPath}`);
  } catch (err) {
    console.error(`❌ Erro ao obter ou salvar grupos da instância ${idClient}:`, err.message);
  }
});

client.on('auth_failure', () => {
  isAuthenticated = false;
  isReady = false;
  broadcast('message', '© WhatsApp API Falha na autenticação, reiniciando...');
  console.error('© WhatsApp API Falha na autenticação');
});

client.on('change_state', (state) => {
  console.log('© WhatsApp API Status de conexão: ', state);
});

client.on('disconnected', async (reason) => {
  console.log('⚠️ Cliente desconectado:', reason);

  isAuthenticated = false;
  isReady = false;
  broadcast('message', '© WhatsApp API Cliente desconectado!');
  broadcast('qr', './icon.svg');

  // Destroi e cria novo client limpo
  setTimeout(() => {
    try {
      const sessionPath = path.join(__dirname, `.wwebjs_auth/session-${idClient}`);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Sessão de ${idClient} removida para forçar novo QR`);
      }

      // Reinstancia novo client do zero
      recreateClient();
    } catch (err) {
      console.error('Erro ao resetar sessão:', err.message);
    }
  }, 1000);
});

function recreateClient() {
  client.destroy().catch(() => {});
  const newClient = new Client({
    authStrategy: new LocalAuth({ clientId: idClient }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  // Reatribui eventos ao novo client
  bindClientEvents(newClient);
  newClient.initialize();
  global.client = newClient; // opcional, caso use em outros lugares
}

function bindClientEvents(newClient) {
  newClient.on('qr', qr => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      broadcast('qr', url);
      broadcast('message', '© WhatsApp API QRCode recebido, aponte a câmera do seu celular!');
    });
  });

  newClient.on('authenticated', () => {
    isAuthenticated = true;
    broadcast('authenticated', '© WhatsApp API Autenticado!');
    broadcast('message', '© WhatsApp API Autenticado!');
    console.log('© WhatsApp API Autenticado');
  });

  newClient.on('ready', async () => {
    isReady = true;
    broadcast('ready', '© WhatsApp API Dispositivo pronto!');
    broadcast('qr', './check.svg');
    broadcast('message', '© WhatsApp API Dispositivo pronto!');
    console.log(`✅ ${idClient} pronto e autenticado.`);

    // salva os grupos como sempre
    await atualizarEGravarGrupos(newClient);
  });

  newClient.on('auth_failure', () => {
    isAuthenticated = false;
    isReady = false;
    broadcast('message', '© WhatsApp API Falha na autenticação, reiniciando...');
    console.error('© WhatsApp API Falha na autenticação');
  });

  newClient.on('disconnected', reason => {
    isAuthenticated = false;
    isReady = false;
    broadcast('message', '© WhatsApp API Cliente desconectado!');
    broadcast('qr', './icon.svg');
    console.log('⚠️ Cliente desconectado:', reason);

    setTimeout(() => {
      const sessionPath = path.join(__dirname, `.wwebjs_auth/session-${idClient}`);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Sessão de ${idClient} removida para forçar novo QR`);
      }
      recreateClient();
    }, 1000);
  });
}

// Evento do Socket.IO
io.on('connection', (socket) => {
  connectedSockets.push(socket);
  console.log('🟢 Novo socket conectado');

  socket.on('disconnect', () => {
    connectedSockets = connectedSockets.filter(s => s !== socket);
    console.log('🔴 Socket desconectado');
  });

  socket.emit('message', '© WhatsApp API - Iniciado');

  if (isReady) {
    socket.emit('ready', '© WhatsApp API Dispositivo pronto!');
    socket.emit('qr', './check.svg');
  } else {
    socket.emit('qr', './icon.svg');
  }

});


// ROTA POST PARA ENVIO DE PDF VIA WHATSAPP
app.post('/send-pdf', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('filename').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number.replace(/\D/g, '');
  const caption = req.body.caption;
  const fileName = req.body.filename;

  const numberDDD = number.substr(0, 2);
  const numberUser = number.substr(-8, 8);
  const phoneNumber = (numberDDD <= 30)
    ? `55${numberDDD}9${numberUser}@c.us`
    : `55${numberDDD}${numberUser}@c.us`;

  const pdfPath = './pdfs/' + fileName;
  const mediaPdf = MessageMedia.fromFilePath(pdfPath);

  client.sendMessage(phoneNumber, mediaPdf, { caption })
    .then(response => {
      res.status(200).json({
        status: true,
        message: 'PDF enviado com sucesso',
        response
      });
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        message: 'Erro ao enviar PDF',
        response: err.text
      });
    });
});

// ROTA POST PARA ENVIO DE MENSAGEM SIMPLES
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const rawNumber = req.body.number;
  const message = req.body.message;
  const linkPreview = String(req.body.linkPreview).toLowerCase() !== 'false';

  // Remove todos os caracteres não numéricos (ex: +, espaço, traços, parênteses)
  let number = rawNumber.replace(/\D/g, '');

  // Se o número tem 11 ou menos dígitos, assumimos que é nacional e adicionamos o DDI 55
  if (number.length <= 11) {
    number = '55' + number;
  }

  // Validação simples de tamanho final (mínimo 11, máximo 15 dígitos com DDI)
  if (number.length < 11 || number.length > 15) {
    return res.status(400).json({
      status: false,
      message: 'Número de telefone inválido.'
    });
  }

  // 🔥 NOVO TRECHO: Se o número for do Brasil (começar com 55), aplica a correção do 9
  if (number.startsWith('55')) {
    const ddd = number.substring(2, 4);
    const restante = number.substring(4);

    // Se o DDD for menor ou igual a 30, e o número restante tiver 8 dígitos apenas (sem o 9)
    if (ddd <= 30) {
      if (restante.length === 8) {
        number = `55${ddd}9${restante}`;
      }
    }
  }

  // Formato final do número para envio via WhatsApp Web.js
  const phoneNumber = `${number}@c.us`;

  try {
    const response = await client.sendMessage(phoneNumber, message, { linkPreview });
    res.status(200).json({
      status: true,
      message: 'WhatsApp API Mensagem enviada',
      response
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'WhatsApp API Mensagem não enviada',
      response: err?.message || err
    });
  }
});


// EVENTO DE RECEBIMENTO DE MENSAGEM
client.on('message', async msg => {
  
  // TESTES E INTERAÇÕES
  if (msg.body === 'Testar API') {
    msg.reply('✅ API ativa!');
  }

});

//ENVIAR MENSAGEM NO GRUPO
app.post('/send-message-group', [
  body('groupId').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const groupId = req.body.groupId.endsWith('@g.us') ? req.body.groupId : req.body.groupId + '@g.us';
  const message = req.body.message;

  try {
    if (!client.pupPage) {
      return res.status(503).json({
        status: false,
        message: 'Página do cliente ainda não está disponível. Aguarde a inicialização.'
      });
    }

    const chat = await client.pupPage.evaluate(groupId => {
      if (!window.Store || !window.Store.Chat) return null;
      const storeChat = window.Store.Chat.get(groupId);
      if (!storeChat || !storeChat.groupMetadata?.participants) return null;
      return storeChat.groupMetadata.participants.map(p => p.id._serialized);
    }, groupId);

    if (!chat || chat.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Não foi possível obter os participantes do grupo.'
      });
    }

    const mentions = await Promise.all(
      chat.map(async id => await client.getContactById(id))
    );

    await client.sendMessage(groupId, message, { mentions });

    console.log(`📤 Mensagem enviada no grupo ${groupId} com ${mentions.length} menções`);

    return res.status(200).json({
      status: true,
      message: 'Mensagem enviada com menções aos participantes!'
    });

  } catch (err) {
    console.error('Erro ao enviar mensagem com menções:', err.message);
    return res.status(500).json({
      status: false,
      message: 'Erro ao enviar mensagem para o grupo',
      error: err.message
    });
  }
});


// ENDPOINT PARA ALTERAR O NOME DO GRUPO
app.post('/mudar-nome-grupo', [
  body('groupId').notEmpty(),
  body('newName').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);
  if (!errors.isEmpty()) {
    return res.status(422).json({ status: false, message: errors.mapped() });
  }

  const groupId = req.body.groupId.endsWith('@g.us') ? req.body.groupId : req.body.groupId + '@g.us';
  const newName = req.body.newName;

  try {
    const chat = await client.getChatById(groupId);

    if (!chat.isGroup) {
      return res.status(400).json({
        status: false,
        message: 'O chat especificado não é um grupo.'
      });
    }

    await chat.setSubject(newName);

    return res.status(200).json({
      status: true,
      message: `Nome do grupo alterado para: ${newName}`
    });

  } catch (err) {
    console.error('Erro ao alterar o nome do grupo:', err.message);
    return res.status(500).json({
      status: false,
      message: 'Erro ao alterar o nome do grupo',
      error: err.message
    });
  }
});

//MUDAR DESCRIÇÃO DO GRUPO
app.post('/mudar-descricao-grupo', [
  body('groupId').notEmpty(),
  body('newDescription').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);
  if (!errors.isEmpty()) {
    return res.status(422).json({ status: false, message: errors.mapped() });
  }

  const groupId = req.body.groupId.endsWith('@g.us') ? req.body.groupId : req.body.groupId + '@g.us';
  const newDescription = req.body.newDescription;

  try {
    const chat = await client.getChatById(groupId);

    if (!chat.isGroup || !chat.setDescription) {
      return res.status(400).json({
        status: false,
        message: 'O chat especificado não é um grupo válido ou método indisponível.'
      });
    }

    await chat.setDescription(newDescription);

    return res.status(200).json({
      status: true,
      message: `Descrição do grupo alterada com sucesso!`
    });

  } catch (err) {
    console.error('Erro ao alterar a descrição do grupo:', err.message);
    return res.status(500).json({
      status: false,
      message: 'Erro ao alterar a descrição do grupo',
      error: err.message
    });
  }
});


//EXTRAIR CONTATOS DO GRUPO
app.post('/extrair-contatos-grupo', [
  body('groupId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);
  if (!errors.isEmpty()) {
    return res.status(422).json({ status: false, message: errors.mapped() });
  }

  const groupId = req.body.groupId.endsWith('@g.us') ? req.body.groupId : req.body.groupId + '@g.us';

  try {
    const page = await client.pupPage;

    const participantIds = await page.evaluate((groupId) => {
      const chat = window.Store?.Chat?.get(groupId);
      if (!chat || !chat.groupMetadata?.participants) return null;
      return chat.groupMetadata.participants.map(p => p.id._serialized);
    }, groupId);

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Não foi possível obter os participantes do grupo.'
      });
    }

    const contatosFormatados = participantIds.map(id => id.replace('@c.us', '').replace(/^55/, ''));

    return res.status(200).json({
      status: true,
      quantidade: contatosFormatados.length,
      contatos: contatosFormatados
    });

  } catch (err) {
    console.error('Erro ao extrair contatos do grupo:', err.message);
    return res.status(500).json({
      status: false,
      message: 'Erro ao extrair contatos do grupo',
      error: err.message
    });
  }
});

async function atualizarEGravarGrupos() {
  console.log(`🔍 [${idClient}] Chamando atualizarEGravarGrupos (pupPage + refresh leve)`);

  if (!client.pupPage) {
    console.error(`❌ pupPage ainda não disponível`);
    return null;
  }

  try {
    // Simula abertura de até 5 grupos para forçar refresh dos metadados
    await client.pupPage.evaluate(() => {
      const chats = window.Store?.Chat?.models;
      if (!chats || chats.length === 0) return;

      let i = 0;
      for (const chat of chats) {
        if (chat.id.server === 'g.us') {
          chat.sendMessage?.(''); // Trigger leve
          i++;
        }
        if (i >= 5) break;
      }
    });

    // Aguarda breve momento pro WhatsApp atualizar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Captura os grupos
    const groups = await client.pupPage.evaluate(() => {
      if (!window.Store?.Chat) return [];
      return window.Store.Chat
        .filter(chat => chat.id?.server === 'g.us')
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name || '(sem nome)'
        }));
    });

    console.log(`📦 [${idClient}] ${groups.length} grupo(s) encontrados`);
    fs.writeFileSync(gruposPath, JSON.stringify(groups, null, 2), 'utf-8');
    console.log(`💾 [${idClient}] grupos-${idClient}.json atualizado com sucesso`);

    return groups;

  } catch (err) {
    console.error(`❌ [${idClient}] Erro ao atualizar grupos:`, err.message);
    return null;
  }
}

// ROTA GET PARA LISTAR GRUPOS DO ARQUIVO grupos.json
app.get('/listar-grupos', async (req, res) => {
  const nomeInstancia = req.query.nome;
  if (!nomeInstancia) {
    return res.status(400).json({
      status: false,
      message: 'Parâmetro "nome" da instância é obrigatório (ex: ?nome=JapaZap)'
    });
  }

  try {
    const gruposAtualizados = await atualizarEGravarGrupos();

    if (!gruposAtualizados) {
      return res.status(500).json({
        status: false,
        message: 'Erro ao atualizar os grupos. Verifique se a instância está pronta.'
      });
    }

    return res.status(200).json({
      status: true,
      grupos: gruposAtualizados
    });

  } catch (err) {
    console.error(`Erro ao atualizar grupos da instância ${nomeInstancia}:`, err.message);
    return res.status(500).json({
      status: false,
      message: 'Erro interno ao atualizar o arquivo',
      error: err.message
    });
  }
});

// INICIALIZAÇÃO DO SERVIDOR
server.listen(port, function () {
  console.log('© WhatsApp API - Aplicativo rodando na porta *:' + port);
});
