// app.js
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');

const { renderAdminView } = require('./public/js/adminView');
const { renderClientView } = require('./public/js/clientView');
const { renderLoginView } = require('./public/js/loginView'); // NOVO
const { renderRegisterAdminView } = require('./public/js/registerAdminView');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sessão (memória – para produção use store persistente)
const sessionMiddleware = session({
    secret: 'chave-secreta-barbeiria', // troque por algo forte
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        // secure: true, // habilite atrás de HTTPS
        maxAge: 1000 * 60 * 60 * 8 // 8h
    }
});

// <<< COLE SUAS CHAVES AQUI
const VAPID_PUBLIC_KEY = 'BF4c7cilntQPLOe4dJ5si9-0gz5rhm1OKMloaCyLDI4kCTTsBWY4OjdLMhsQDZmEOu4lb9hRAeUzjRhv_yZKSKc';
const VAPID_PRIVATE_KEY = 'RpAFXYo0ATDFppI-H0JirySCx54oIkMtesXJKQ96mQ0';

webpush.setVapidDetails(
    'mailto:admin@barbearia.local',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// Compartilhar sessão com sockets
io.engine.use((req, res, next) => {
    sessionMiddleware(req, {}, next);
});

app.use(express.json());
app.use(sessionMiddleware);

// Static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

// --- Auth guards ---
function requireLoginHtml(req, res, next) {
    if (req.session && req.session.user) return next();
    // para páginas HTML, redireciona pro login
    return res.redirect('/login');
}

function requireAdminHtml(req, res, next) {
    if (req.session && req.session.user && req.session.user.tipo === 'admin') return next();
    // sem sessão ou não-admin -> login
    return res.redirect('/login');
}

// Para APIs (JSON): não redireciona; responde com status
function requireLoginApi(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ ok: false, message: 'Não autenticado' });
}

function requireAdminApi(req, res, next) {
    if (req.session && req.session.user && req.session.user.tipo === 'admin') return next();
    const status = req.session && req.session.user ? 403 : 401;
    return res.status(status).json({ ok: false, message: 'Acesso negado' });
}


// Helpers
const HORAINI = 10;
const HORAFIM = 20; // inclusive
function gerarSlots() {
    const arr = [];
    for (let h = HORAINI; h <= HORAFIM; h++) arr.push(`${String(h).padStart(2, '0')}:00`);
    return arr;
}

async function getUserByEmail(email) {
    const [rows] = await pool.query(`SELECT id, nome, email, senha_hash, tipo FROM usuarios WHERE email = ? LIMIT 1`, [email]);
    return rows[0] || null;
}

function requireAdminWeb(req, res, next) {
    if (req.session && req.session.user && req.session.user.tipo === 'admin') return next();
    return res.redirect('/login');
}
// Obtém admin autenticado do request/session (já existente na sua app)
function getReqAdmin(req) {
    return req.session && req.session.user && req.session.user.tipo === 'admin' ? req.session.user : null;
}

// Salva assinatura de push para o admin logado
async function savePushSubscription(adminId, sub) {
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!endpoint || !p256dh || !auth) return;

    await pool.query(
        `INSERT INTO push_subscriptions (admin_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)`,
        [adminId, endpoint, p256dh, auth]
    );
}

async function deletePushSubscription(adminId, endpoint) {
    await pool.query(
        `DELETE FROM push_subscriptions WHERE admin_id = ? AND endpoint = ?`,
        [adminId, endpoint]
    );
}

async function getAllAdminSubscriptions() {
    const [rows] = await pool.query(
        `SELECT admin_id, endpoint, p256dh, auth FROM push_subscriptions`
    );
    return rows.map(r => ({
        adminId: r.admin_id,
        subscription: {
            endpoint: r.endpoint,
            keys: { p256dh: r.p256dh, auth: r.auth }
        }
    }));
}

async function notifyAdmins({ title, body, tag = 'barbearia', clickUrl = '/admin' }) {
    const subs = await getAllAdminSubscriptions();
    const payload = JSON.stringify({ title, body, tag, clickUrl, icon: '/img/Logo.png' });

    // dispara para todos (em paralelo)
    await Promise.all(subs.map(async ({ subscription }) => {
        try {
            await webpush.sendNotification(subscription, payload);
        } catch (e) {
            // Se 410/404, assinatura inválida => pode remover
            if (e?.statusCode === 410 || e?.statusCode === 404) {
                try {
                    await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [subscription.endpoint]);
                } catch { }
            }
        }
    }));
}


async function consultarEstadoDoDia(dataISO) {
    await concluirAgendamentosPassados();
    const conn = await pool.getConnection();
    try {
        const [bloqs] = await conn.query(
            'SELECT hora_ref FROM bloqueios_admin WHERE data_ref = ?',
            [dataISO]
        );
        const bloqueios = new Set(bloqs.map(r => r.hora_ref.slice(0, 5)));

        const [ags] = await conn.query(
            `SELECT a.id,
          a.hora_ref,
          u.nome AS cliente_nome,
          b.nome AS barbeiro_nome,
          fp.nome AS forma_nome,            -- << NOVO
          a.status,
          a.presenca,
          a.is_ativo
     FROM agendamentos a
     JOIN usuarios u        ON u.id  = a.cliente_id
LEFT JOIN usuarios b        ON b.id  = a.barbeiro_id
LEFT JOIN formas_pagamento fp ON fp.id = a.forma_pagamento_id   -- << NOVO
    WHERE a.data_ref = ?
      AND a.is_ativo = 1`,
            [dataISO]
        );


        const porHora = new Map();
        ags.forEach(a => {
            const hhmm = a.hora_ref.slice(0, 5);
            porHora.set(hhmm, {
                agendamentoId: a.id,
                clienteNome: a.cliente_nome,
                barbeiroNome: a.barbeiro_nome,   // <<< adicionado
                formaNome: a.forma_nome || null,
                presenca: a.presenca
            });
        });

        const slots = gerarSlots().map(hora => {
            const infoAg = porHora.get(hora);
            const hasBloq = bloqueios.has(hora);
            const hasAg = !!infoAg;
            return {
                hora,
                disponivel: !(hasBloq || hasAg),
                clienteNome: infoAg ? infoAg.clienteNome : null,
                barbeiroNome: infoAg ? infoAg.barbeiroNome : null, // <<< adicionado
                formaNome: infoAg ? infoAg.formaNome : null,
                agendamentoId: infoAg ? infoAg.agendamentoId : null,
                presenca: infoAg ? infoAg.presenca : null
            };
        });

        return { dataISO, slots };
    } finally {
        conn.release();
    }
}

function formatarDataBR(dataLike) {
    // aceita 'YYYY-MM-DD' ou Date
    if (typeof dataLike === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataLike)) {
        const [y, m, d] = dataLike.split('-');
        return `${d}/${m}/${y}`;
    }
    const dt = new Date(dataLike);
    return dt.toLocaleDateString('pt-BR');
}


// Helper para ler admin do socket
function getSocketAdmin(socket) {
    const sess = socket.request.session;
    if (sess && sess.user && sess.user.tipo === 'admin') return sess.user;
    return null;
}

function brDate(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}


async function bloquearSlot(dataISO, hora, adminId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query(
            `SELECT 1 FROM agendamentos
              WHERE data_ref = ? AND hora_ref = ? AND is_ativo = 1
              LIMIT 1`,
            [dataISO, hora]
        );
        if (rows.length) { await conn.rollback(); return { ok: false, message: 'Slot ocupado.' }; }

        await conn.query(
            `INSERT IGNORE INTO bloqueios_admin (data_ref, hora_ref, criado_por)
             VALUES (?, ?, ?)`,
            [dataISO, hora, adminId]
        );
        await conn.commit();
        return { ok: true };
    } catch (e) {
        await conn.rollback();
        return { ok: false, message: 'Erro ao bloquear.' };
    } finally {
        conn.release();
    }
}
async function liberarSlot(dataISO, hora) {
    const [r] = await pool.query(
        `DELETE FROM bloqueios_admin WHERE data_ref = ? AND hora_ref = ?`,
        [dataISO, hora]
    );
    return { ok: true, affected: r.affectedRows };
}

// Marca como concluídos todos os agendamentos cujo horário já passou
async function concluirAgendamentosPassados() {
    // Usa o relógio do MySQL (CURDATE/CURTIME). Ajuste o timezone do servidor MySQL se necessário.
    const [r] = await pool.query(
        `UPDATE agendamentos
        SET status = 'concluido'
      WHERE is_ativo = 1
        AND (
              data_ref < CURDATE()
           OR (data_ref = CURDATE() AND hora_ref < CURTIME())
        )`
    );
    return { ok: true, affected: r.affectedRows };
}


// Remove quaisquer agendamentos ATIVOS (pendente/confirmado) para um dia/horário
async function removerAgendamentosDoSlot(dataISO, hora) {
    // is_ativo = 1 => status pendente/confirmado (coluna gerada)
    const [r] = await pool.query(
        `DELETE FROM agendamentos
      WHERE data_ref = ? AND hora_ref = ? AND is_ativo = 1`,
        [dataISO, hora]
    );
    return { ok: true, removed: r.affectedRows };
}


// ------------ CATÁLOGOS (SERVIÇOS / FORMAS) ------------
async function salvarServico({ nome, preco }) {
    try {
        await pool.query(`INSERT INTO servicos (nome, preco, ativo) VALUES (?, ?, 1)`, [nome, preco]);
        return { ok: true, message: 'Serviço cadastrado com sucesso.' };
    } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') return { ok: false, message: 'Já existe um serviço com esse nome.' };
        return { ok: false, message: 'Erro ao salvar serviço.' };
    }
}
async function salvarFormaPagamento({ nome, taxa }) {
    try {
        await pool.query(`INSERT INTO formas_pagamento (nome, taxa_pct, ativo) VALUES (?, ?, 1)`, [nome, taxa]);
        return { ok: true, message: 'Forma de pagamento cadastrada com sucesso.' };
    } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') return { ok: false, message: 'Já existe uma forma com esse nome.' };
        return { ok: false, message: 'Erro ao salvar forma de pagamento.' };
    }
}

// NOVO: listar ativos para preencher as tabelas dos modais
async function listarServicosAtivos() {
    const [rows] = await pool.query(
        `SELECT id, nome, preco FROM servicos WHERE ativo = 1 ORDER BY nome`
    );
    return rows;
}
async function listarFormasAtivas() {
    const [rows] = await pool.query(
        `SELECT id, nome, taxa_pct FROM formas_pagamento WHERE ativo = 1 ORDER BY nome`
    );
    return rows;
}

// NOVO: editar
async function atualizarServico({ id, nome, preco }) {
    try {
        const [r] = await pool.query(
            `UPDATE servicos SET nome = ?, preco = ? WHERE id = ?`,
            [nome, preco, id]
        );
        return r.affectedRows ? { ok: true, message: 'Serviço atualizado.' }
            : { ok: false, message: 'Serviço não encontrado.' };
    } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') return { ok: false, message: 'Já existe um serviço com esse nome.' };
        return { ok: false, message: 'Erro ao atualizar serviço.' };
    }
}
async function atualizarFormaPagamento({ id, nome, taxa }) {
    try {
        const [r] = await pool.query(
            `UPDATE formas_pagamento SET nome = ?, taxa_pct = ? WHERE id = ?`,
            [nome, taxa, id]
        );
        return r.affectedRows ? { ok: true, message: 'Forma de pagamento atualizada.' }
            : { ok: false, message: 'Forma de pagamento não encontrada.' };
    } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') return { ok: false, message: 'Já existe uma forma com esse nome.' };
        return { ok: false, message: 'Erro ao atualizar forma de pagamento.' };
    }
}

// app.js — SUBSTITUA a função removerServico por esta
async function removerServico({ id }) {
    try {
        const [r] = await pool.query(`DELETE FROM servicos WHERE id = ?`, [id]);
        return r.affectedRows
            ? { ok: true, message: 'Serviço excluído do banco.' }
            : { ok: false, message: 'Serviço não encontrado.' };
    } catch (e) {
        // Se existir agendamento referenciando este serviço (FK RESTRICT), o MySQL lança erro 1451
        if (e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)) {
            return {
                ok: false,
                message: 'Não é possível excluir: existem agendamentos vinculados a este serviço.'
            };
        }
        return { ok: false, message: 'Erro ao excluir serviço.' };
    }
}

async function removerFormaPagamento({ id }) {
    try {
        const [r] = await pool.query(`DELETE FROM formas_pagamento WHERE id = ?`, [id]);
        return r.affectedRows
            ? { ok: true, message: 'Forma de pagamento excluída do banco.' }
            : { ok: false, message: 'Forma de pagamento não encontrada.' };
    } catch (e) {
        // Caso sua FK esteja como RESTRICT, o MySQL lança 1451
        if (e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)) {
            return { ok: false, message: 'Não é possível excluir: existem agendamentos vinculados a esta forma.' };
        }
        return { ok: false, message: 'Erro ao excluir forma de pagamento.' };
    }
}


// ------------ PRESENÇA ------------
async function definirPresenca(agendamentoId, presenca) {
    if (!['presente', 'falta'].includes(presenca)) return { ok: false, message: 'Presença inválida.' };
    await pool.query(`UPDATE agendamentos SET presenca = ? WHERE id = ?`, [presenca, agendamentoId]);
    return { ok: true };
}

// Cria/obtém usuário cliente “guest” com base no guid
async function ensureGuestUser(clientGuid, nome) {
    const email = `${clientGuid}@guest.local`;
    const [rows] = await pool.query(`SELECT id FROM usuarios WHERE email = ?`, [email]);
    if (rows.length) {
        // opcional: atualizar nome
        await pool.query(`UPDATE usuarios SET nome = ?, tipo='cliente' WHERE id = ?`, [nome || 'Cliente', rows[0].id]);
        return rows[0].id;
    } else {
        const [res] = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, tipo)
             VALUES (?, ?, 'guest', 'cliente')`,
            [nome || 'Cliente', email]
        );
        return res.insertId;
    }
}

// Lista fila: se dataISO vier, lista daquele dia; se não vier, lista TODOS os futuros (ordenados por data+hora)
async function listarFila(dataISO) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const horaNow = `${hh}:${mm}:00`;

    let sql, params;

    if (dataISO) {
        sql = `
      SELECT a.id, a.data_ref, a.hora_ref, a.valor_aplicado, a.cliente_guid,
             s.nome AS servico_nome, u.nome AS cliente_nome, b.nome AS barbeiro_nome
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.cliente_id
        JOIN servicos s ON s.id = a.servico_id
        LEFT JOIN usuarios b ON b.id = a.barbeiro_id
       WHERE a.data_ref = ?
         AND a.is_ativo = 1
         AND (a.data_ref > CURDATE()
              OR (a.data_ref = CURDATE() AND a.hora_ref >= ?))
       ORDER BY a.hora_ref ASC`;
        params = [dataISO, horaNow];
    } else {
        // TODOS os futuros a partir de agora, ordenados por data e hora
        sql = `
      SELECT a.id, a.data_ref, a.hora_ref, a.valor_aplicado, a.cliente_guid,
             s.nome AS servico_nome, u.nome AS cliente_nome, b.nome AS barbeiro_nome
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.cliente_id
        JOIN servicos s ON s.id = a.servico_id
        LEFT JOIN usuarios b ON b.id = a.barbeiro_id
       WHERE a.is_ativo = 1
         AND (a.data_ref > CURDATE()
              OR (a.data_ref = CURDATE() AND a.hora_ref >= ?))
       ORDER BY a.data_ref ASC, a.hora_ref ASC`;
        params = [horaNow];
    }

    const [rows] = await pool.query(sql, params);
    return rows;
}


// Relatórios diários: últimos N dias (padrão 30)
async function getDailyReports(days = 30) {
    const [rows] = await pool.query(
        `SELECT 
        data_ref AS dia,
        SUM(CASE WHEN presenca = 'presente' THEN 1 ELSE 0 END) AS atendidos,
        COALESCE(SUM(CASE WHEN presenca = 'presente' THEN valor_aplicado ELSE 0 END), 0) AS total
     FROM agendamentos
     WHERE data_ref BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND CURDATE()
     GROUP BY data_ref
     ORDER BY data_ref DESC`,
        [days]
    );
    return rows;
}


// Disponibilidade do cliente (reutiliza regra do admin)
async function slotsDisponiveisCliente(dataISO) {
    const { slots } = await consultarEstadoDoDia(dataISO);
    return slots; // mesmo formato
}

app.get('/push/public-key', (req, res) => {
    try {
        const clean = VAPID_PUBLIC_KEY.trim().replace(/\s+/g, '');
        const padding = '='.repeat((4 - (clean.length % 4)) % 4);
        const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
        const buf = Buffer.from(base64, 'base64'); // Node faz a decodificação
        res.json({
            key: VAPID_PUBLIC_KEY,
            serverDecodedLength: buf.length,          // deve ser 65
            head: VAPID_PUBLIC_KEY.slice(0, 10),
            tail: VAPID_PUBLIC_KEY.slice(-10)
        });
    } catch (e) {
        res.status(500).json({ ok: false, message: 'Invalid server key' });
    }
});

// View de login
app.get('/login', (req, res) => {
    if (req.session?.user?.tipo === 'admin') return res.redirect('/admin');
    const html = renderLoginView();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

// POST /login (JSON: {email, senha})
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body || {};
        if (!email || !senha) return res.status(400).json({ ok: false, message: 'Informe e-mail e senha.' });

        const user = await getUserByEmail(email);
        if (!user || user.tipo !== 'admin') {
            return res.status(401).json({ ok: false, message: 'Acesso negado.' });
        }

        const ok = user.senha_hash === 'guest' ? false : await bcrypt.compare(String(senha), String(user.senha_hash || ''));
        if (!ok) return res.status(401).json({ ok: false, message: 'Credenciais inválidas.' });

        // cria sessão
        req.session.user = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ ok: false, message: 'Erro no login.' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

// Protege /admin
app.get('/admin', requireAdminWeb, (req, res) => {
    const html = renderAdminView({ user: { nome: req.session.user.nome } });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

// Rota pública segue igual
app.get('/', (req, res) => res.redirect('/client/intro'));

app.get('/client', (req, res) => {
    const html = renderClientView();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

// Nova rota de introdução
app.get('/client/intro', (req, res) => {
    const { renderClientIntroView } = require('./public/js/clientView');
    const html = renderClientIntroView();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

app.get('/admin/new', (req, res) => {
    const { renderRegisterAdminView } = require('./public/js/registerAdminView');
    const html = renderRegisterAdminView();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});


// Criação do admin/barbeiro
app.post('/admin/new', async (req, res) => {
    try {
        const { nome, email, senha } = req.body || {};
        // Sem verificações adicionais (conforme solicitado)
        const hash = await bcrypt.hash(String(senha || ''), 10);
        await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, 'admin')`,
            [String(nome || ''), String(email || ''), hash]
        );
        return res.json({ ok: true });
    } catch (e) {
        // caso haja UNIQUE(email) no DB, pode disparar erro — retornamos msg genérica
        return res.status(400).json({ ok: false, message: 'Não foi possível cadastrar.' });
    }
});

// LISTAR todos os admins/barbeiros
app.get('/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                nome,
                email,
                SUBSTRING_INDEX(TRIM(nome), ' ', 1) AS primeiro_nome
                FROM usuarios
                WHERE tipo = 'admin'
                ORDER BY nome;
`
        );
        res.json({ ok: true, users: rows });
    } catch (e) {
        res.status(500).json({ ok: false, message: 'Erro ao listar.' });
    }
});

// ATUALIZAR admin por ID (nome, email, senha opcional)
app.put('/admin/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email, senha } = req.body || {};

        // monta query dinamicamente
        const fields = [];
        const values = [];

        if (nome !== undefined) { fields.push('nome = ?'); values.push(String(nome)); }
        if (email !== undefined) { fields.push('email = ?'); values.push(String(email)); }
        if (senha !== undefined && senha !== null && String(senha).length > 0) {
            const hash = await bcrypt.hash(String(senha), 10);
            fields.push('senha_hash = ?');
            values.push(hash);
        }

        if (fields.length === 0) {
            return res.status(400).json({ ok: false, message: 'Nada para atualizar.' });
        }
        values.push(id);

        const [r] = await pool.query(
            `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ? AND tipo = 'admin'`
            , values
        );
        if (!r.affectedRows) {
            return res.status(404).json({ ok: false, message: 'Admin não encontrado.' });
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ ok: false, message: 'Erro ao atualizar.' });
    }
});

// EXCLUIR admin por ID
app.delete('/admin/users/:id', requireAdminApi, async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Importante: se houver FK de agendamentos.barbeiro_id -> usuarios.id,
        // recomendo ON DELETE SET NULL. Caso seja RESTRICT, capturamos 1451.
        const [r] = await pool.query(
            `DELETE FROM usuarios WHERE id = ? AND tipo = 'admin'`
            , [id]
        );
        if (!r.affectedRows) {
            return res.status(404).json({ ok: false, message: 'Admin não encontrado.' });
        }
        res.json({ ok: true });
    } catch (e) {
        if (e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)) {
            return res.status(409).json({ ok: false, message: 'Não é possível excluir: existem registros vinculados.' });
        }
        res.status(400).json({ ok: false, message: 'Erro ao excluir.' });
    }
});



// Ver assinaturas salvas
app.get('/push/debug', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT admin_id, LEFT(endpoint,64) ep FROM push_subscriptions`);
        res.json({ ok: true, count: rows.length, subs: rows });
    } catch (e) { res.status(500).json({ ok: false }); }
});

// Disparar teste de notificação manualmente
app.post('/push/test', async (req, res) => {
    try {
        const hr = hora.slice(0, 5);
        await notifyAdmins({
            title: 'Novo agendamento',
            body: `${nome} agendou para ${formatarDataBR(dataISO)} às ${hr}.`,
            tag: `ag-${dataISO}-${hr}`,
            clickUrl: '/admin'
        });
    } catch (e) { res.status(500).json({ ok: false }); }
});



// Sockets
io.on('connection', (socket) => {
    // ===================== ADMIN (protegido) =====================
    socket.on('admin/getDay', async ({ dataISO }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        try {
            const payload = await consultarEstadoDoDia(dataISO);
            socket.emit('admin/dayState', payload);
        } catch (e) {
            socket.emit('admin/dayState', { dataISO, slots: [], error: 'Erro ao consultar o dia.' });
        }
    });

    socket.on('admin/toggleSlot', async ({ dataISO, hora, disponivel }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (disponivel === false) {
            await bloquearSlot(dataISO, hora, admin.id);
        } else {
            await liberarSlot(dataISO, hora);
            // Se você implementou a remoção de agendamento ao marcar disponível:
            if (typeof removerAgendamentosDoSlot === 'function') {
                await removerAgendamentosDoSlot(dataISO, hora);
                const rows = await listarFila(dataISO);
                io.emit('client/queue', { dataISO, items: rows });
            }
        }
        const payload = await consultarEstadoDoDia(dataISO);
        io.emit('admin/slotUpdated', payload);
    });

    socket.on('admin/addService', async ({ nome, preco }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!nome || isNaN(preco) || Number(preco) < 0) {
            return socket.emit('admin/serviceSaved', { ok: false, message: 'Dados inválidos.' });
        }
        socket.emit('admin/serviceSaved', await salvarServico({ nome: String(nome).trim(), preco: Number(preco) }));
    });

    socket.on('admin/addPaymentMethod', async ({ nome, taxa }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!nome) return socket.emit('admin/paymentSaved', { ok: false, message: 'Informe o nome.' });
        let taxaVal = null;
        if (taxa !== null && taxa !== undefined && String(taxa).trim() !== '') {
            if (isNaN(taxa) || Number(taxa) < 0) return socket.emit('admin/paymentSaved', { ok: false, message: 'Taxa inválida.' });
            taxaVal = Number(taxa);
        }
        socket.emit('admin/paymentSaved', await salvarFormaPagamento({ nome: String(nome).trim(), taxa: taxaVal }));
    });

    socket.on('admin/setPresence', async ({ agendamentoId, presenca, dataISO }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        const out = await definirPresenca(agendamentoId, presenca);
        if (!out.ok) return socket.emit('admin/error', { message: out.message });

        const payload = await consultarEstadoDoDia(dataISO);
        io.emit('admin/slotUpdated', payload);
    });

    // ----- Catálogos: listar/editar/remover Serviços & Formas -----
    socket.on('admin/getCatalogs', async () => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        const servicos = await listarServicosAtivos();
        const formas = await listarFormasAtivas();
        socket.emit('admin/catalogs', { servicos, formas });
    });

    socket.on('admin/updateService', async ({ id, nome, preco }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!id || !nome || isNaN(preco) || Number(preco) < 0) {
            return socket.emit('admin/serviceUpdated', { ok: false, message: 'Dados inválidos.' });
        }
        const out = await atualizarServico({ id: Number(id), nome: String(nome).trim(), preco: Number(preco) });
        socket.emit('admin/serviceUpdated', out);

        // reenviar catálogos
        const servicos = await listarServicosAtivos();
        const formas = await listarFormasAtivas();
        socket.emit('admin/catalogs', { servicos, formas });
    });

    socket.on('admin/deleteService', async ({ id }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!id) return socket.emit('admin/serviceDeleted', { ok: false, message: 'ID inválido.' });
        const out = await removerServico({ id: Number(id) });
        socket.emit('admin/serviceDeleted', out);

        const servicos = await listarServicosAtivos();
        const formas = await listarFormasAtivas();
        socket.emit('admin/catalogs', { servicos, formas });
    });

    socket.on('admin/updatePaymentMethod', async ({ id, nome, taxa }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!id || !nome) return socket.emit('admin/paymentUpdated', { ok: false, message: 'Dados inválidos.' });
        let taxaVal = null;
        if (taxa !== null && taxa !== undefined && String(taxa).trim() !== '') {
            if (isNaN(taxa) || Number(taxa) < 0) return socket.emit('admin/paymentUpdated', { ok: false, message: 'Taxa inválida.' });
            taxaVal = Number(taxa);
        }
        const out = await atualizarFormaPagamento({ id: Number(id), nome: String(nome).trim(), taxa: taxaVal });
        socket.emit('admin/paymentUpdated', out);

        const servicos = await listarServicosAtivos();
        const formas = await listarFormasAtivas();
        socket.emit('admin/catalogs', { servicos, formas });
    });

    socket.on('admin/deletePaymentMethod', async ({ id }) => {
        const admin = getSocketAdmin(socket);
        if (!admin) return socket.emit('admin/error', { message: 'Não autorizado.' });

        if (!id) return socket.emit('admin/paymentDeleted', { ok: false, message: 'ID inválido.' });
        const out = await removerFormaPagamento({ id: Number(id) });
        socket.emit('admin/paymentDeleted', out);

        const servicos = await listarServicosAtivos();
        const formas = await listarFormasAtivas();
        socket.emit('admin/catalogs', { servicos, formas });
    });

    // Resumo: últimos N dias (inclui hoje)
    socket.on('admin/getDailyReports', async ({ days = 30 } = {}) => {
        try {
            const [rows] = await pool.query(
                `
      SELECT
        a.data_ref AS dia,
        SUM(CASE WHEN a.presenca = 'presente' THEN 1 ELSE 0 END)        AS atendidos,
        SUM(CASE WHEN a.presenca = 'presente' THEN a.valor_aplicado ELSE 0 END) AS total
      FROM agendamentos a
      WHERE a.data_ref BETWEEN (CURDATE() - INTERVAL ? DAY) AND CURDATE()
        AND a.is_ativo = 1
        AND a.status <> 'cancelado'
      GROUP BY a.data_ref
      ORDER BY a.data_ref DESC
      `,
                [days - 1] // ex.: 30 dias -> hoje e 29 anteriores
            );

            socket.emit('admin/dailyReports', { reports: rows });
        } catch (e) {
            socket.emit('admin/dailyReports', { reports: [], error: 'Erro ao carregar relatórios.' });
        }
    });


    // ===== Relatórios: detalhe do dia =====
    socket.on('admin/getDailyReportDetail', async ({ dataISO }) => {
        try {
            const [rows] = await pool.query(
                `SELECT a.id, a.hora_ref, a.valor_aplicado, a.presenca,
              u.nome AS cliente_nome,
              s.nome AS servico_nome,
              b.nome AS barbeiro_nome
         FROM agendamentos a
         JOIN usuarios u ON u.id = a.cliente_id
         JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN usuarios b ON b.id = a.barbeiro_id
        WHERE a.data_ref = ?
          AND a.is_ativo = 1
          AND a.status <> 'cancelado'
          AND a.presenca IN ('presente','falta')
        ORDER BY a.hora_ref ASC`,
                [dataISO]
            );
            socket.emit('admin/dailyReportDetail', { dataISO, items: rows });
        } catch (e) {
            socket.emit('admin/dailyReportDetail', { dataISO, items: [], error: 'Erro ao buscar detalhes.' });
        }
    });

    // ===== Relatórios: corrigir atendimento (presença/valor) =====
    socket.on('admin/correctAttendance', async ({ id, valor, presenca, dataISO }) => {
        try {
            // valida presença
            let presencaVal = null;
            if (presenca) {
                if (!['presente', 'falta'].includes(presenca)) {
                    return socket.emit('admin/attendanceUpdated', { ok: false, message: 'Presença inválida.' });
                }
                presencaVal = presenca;
            }
            await pool.query(
                `UPDATE agendamentos
          SET valor_aplicado = ?, presenca = ?
        WHERE id = ?`,
                [Number(valor), presencaVal, Number(id)]
            );
            socket.emit('admin/attendanceUpdated', { ok: true, dataISO });
        } catch (e) {
            socket.emit('admin/attendanceUpdated', { ok: false, message: 'Erro ao salvar.', dataISO });
        }
    });

    // ===== Relatórios: excluir atendimento =====
    socket.on('admin/deleteAttendance', async ({ id, dataISO }) => {
        try {
            // marca como inativo (histórico) e cancela
            await pool.query(
                `UPDATE agendamentos SET is_ativo = 0, status = 'cancelado' WHERE id = ?`,
                [Number(id)]
            );
            socket.emit('admin/attendanceDeleted', { ok: true, dataISO });
        } catch (e) {
            socket.emit('admin/attendanceDeleted', { ok: false, message: 'Erro ao excluir.', dataISO });
        }
    });


    // ===================== CLIENT (público) =====================
    socket.on('client/getCatalogs', async () => {
        const [servicos] = await pool.query(`SELECT id, nome, preco FROM servicos WHERE ativo = 1 ORDER BY nome`);
        const [formas] = await pool.query(`SELECT id, nome FROM formas_pagamento WHERE ativo = 1 ORDER BY nome`);
        const [barbs] = await pool.query(`SELECT id, nome FROM usuarios WHERE tipo='admin' ORDER BY nome`);
        socket.emit('client/catalogs', { servicos, formas, barbeiros: barbs });
    });

    socket.on('client/getAvailableSlots', async ({ dataISO }) => {
        const slots = await slotsDisponiveisCliente(dataISO);
        socket.emit('client/availableSlots', { dataISO, slots });
    });

    socket.on('client/listQueue', async ({ dataISO } = {}) => {
        const rows = await listarFila(dataISO || null); // null => todos
        socket.emit('client/queue', { dataISO: dataISO || null, items: rows });
    });


    socket.on('client/createBooking', async (payload) => {
        try {
            const { clientGuid, nome, dataISO, hora, servicoId, formaPagamentoId, barbeiroId } = payload || {};
            if (!clientGuid || !nome || !dataISO || !hora || !servicoId || !formaPagamentoId || !barbeiroId) {
                return socket.emit('client/bookingCreated', { ok: false, message: 'Preencha todos os campos.' });
            }

            // valida disponibilidade
            const { slots } = await consultarEstadoDoDia(dataISO);
            const slot = slots.find(s => s.hora === hora);
            if (!slot || !slot.disponivel) {
                return socket.emit('client/bookingCreated', { ok: false, message: 'Horário indisponível.' });
            }

            // resolve cliente
            const clienteId = await ensureGuestUser(clientGuid, nome);

            // pega preço do serviço (snapshot)
            const [[srv]] = await pool.query(`SELECT preco FROM servicos WHERE id = ? AND ativo = 1`, [servicoId]);
            if (!srv) return socket.emit('client/bookingCreated', { ok: false, message: 'Serviço inválido.' });

            // insere
            await pool.query(
                `INSERT INTO agendamentos
          (cliente_id, servico_id, barbeiro_id, data_ref, hora_ref, status, valor_aplicado, forma_pagamento_id, cliente_guid)
         VALUES
          (?, ?, ?, ?, ?, 'pendente', ?, ?, ?)`,
                [clienteId, servicoId, barbeiroId, dataISO, hora, srv.preco, formaPagamentoId, clientGuid]
            );

            // Notificar admins
            try {
                const hr = hora.slice(0, 5);
                await notifyAdmins({
                    title: 'Novo agendamento',
                    body: `${nome} agendou para ${formatarDataBR(dataISO)} às ${hr}.`,
                    tag: `ag-${dataISO}-${hr}`,
                    clickUrl: '/admin'
                });
            } catch { }



            socket.emit('client/bookingCreated', { ok: true, message: 'Agendamento criado!' });

            // avisa todo mundo
            const payloadDay = await consultarEstadoDoDia(dataISO);
            io.emit('admin/slotUpdated', payloadDay);

            // atualizar fila completa (todos os dias futuros)
            const rows = await listarFila(null);
            io.emit('client/queue', { dataISO: null, items: rows });


            io.emit('admin/refreshDay', { dataISO });

        } catch (e) {
            socket.emit('client/bookingCreated', { ok: false, message: 'Erro ao criar agendamento.' });
        }
    });

    socket.on('client/cancelBooking', async ({ agendamentoId, clientGuid, dataISO }) => {
        try {
            if (!agendamentoId || !clientGuid) {
                return socket.emit('client/bookingCanceled', { ok: false, message: 'Requisição inválida.' });
            }

            // 1) Busque o agendamento primeiro (vamos usar a data do próprio registro se o cliente não mandar)
            const [[agRow]] = await pool.query(
                `SELECT a.id, a.cliente_guid, a.status, a.data_ref, a.hora_ref, u.nome AS cliente_nome
         FROM agendamentos a
         JOIN usuarios u ON u.id = a.cliente_id
        WHERE a.id = ?`,
                [agendamentoId]
            );

            if (!agRow) {
                return socket.emit('client/bookingCanceled', { ok: false, message: 'Agendamento não encontrado.' });
            }
            if (agRow.cliente_guid !== clientGuid) {
                return socket.emit('client/bookingCanceled', { ok: false, message: 'Você não pode desmarcar este horário.' });
            }

            // 2) Idempotência
            if (agRow.status === 'cancelado') {
                socket.emit('client/bookingCanceled', { ok: true, message: 'Este agendamento já estava cancelado.' });
            } else {
                await pool.query(`UPDATE agendamentos SET status='cancelado' WHERE id = ?`, [agendamentoId]);
                socket.emit('client/bookingCanceled', { ok: true, message: 'Agendamento cancelado.' });
            }

            // 3) Defina a data ISO final sempre a partir do registro (fallback robusto)
            const finalDataISO = dataISO || agRow.data_ref;

            // 4) Atualize admin e clientes usando sempre finalDataISO
            const payloadDay = await consultarEstadoDoDia(finalDataISO);
            io.emit('admin/slotUpdated', payloadDay);

            // Notificar admins (usa os dados já buscados)
            try {
                const nm = agRow.cliente_nome || 'Cliente';
                const dataBR = formatarDataBR(agRow.data_ref || finalDataISO);
                const hr = (agRow.hora_ref || '').slice(0, 5);

                await notifyAdmins({
                    title: 'Agendamento cancelado',
                    body: `${nm} cancelou ${dataBR} às ${hr}.`,
                    tag: `ag-cancel-${agRow.data_ref || finalDataISO}-${hr}`,
                    clickUrl: '/admin'
                });
            } catch { }

            const rows = await listarFila(null);
            io.emit('client/queue', { dataISO: null, items: rows });


            io.emit('admin/refreshDay', { dataISO: finalDataISO });
        } catch (e) {
            const msg = (e && (e.sqlMessage || e.message)) ? e.sqlMessage || e.message : 'Erro ao desmarcar.';
            socket.emit('client/bookingCanceled', { ok: false, message: msg });
        }
    });

});

// Assinar push (apenas admin logado; se quiser deixar aberto, remova a verificação)
app.post('/push/subscribe', async (req, res) => {
    try {
        const admin = getReqAdmin(req);
        if (!admin) return res.status(401).json({ ok: false, message: 'Não autorizado' });

        await savePushSubscription(admin.id, req.body);
        res.json({ ok: true, publicKey: VAPID_PUBLIC_KEY });
    } catch (e) {
        res.status(500).json({ ok: false });
    }
});

// Desinscrever (opcional)
app.post('/push/unsubscribe', async (req, res) => {
    try {
        const admin = getReqAdmin(req);
        if (!admin) return res.status(401).json({ ok: false });

        const { endpoint } = req.body || {};
        if (endpoint) await deletePushSubscription(admin.id, endpoint);
        res.json({ ok: true });
    } catch { res.status(500).json({ ok: false }); }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log('Servidor em http://localhost:' + PORT));