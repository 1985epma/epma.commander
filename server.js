const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'epma_secret_change_in_production';

// -------------------------------------------------------------
// DATABASE SETUP
// -------------------------------------------------------------
const db = new Database(path.join(__dirname, 'epma.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        messages TEXT NOT NULL DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        model TEXT NOT NULL,
        icon TEXT,
        system_prompt TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

// Criar usuário demo se não existir
const demoExists = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');
if (!demoExists) {
    const hash = bcrypt.hashSync('demo', 10);
    db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run('demo', 'demo@epma.com', hash);
    console.log('Usuário demo criado: demo / demo');
}

// -------------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));

function requireAuth(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação ausente.' });
    }
    try {
        req.user = jwt.verify(header.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

// Servir arquivos estáticos, exceto proteger index.html via JWT no frontend
app.use(express.static(path.join(__dirname)));

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username.toLowerCase(), username.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user);
});

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.toLowerCase(), email || '');
    if (existing) {
        return res.status(409).json({ error: 'Usuário ou e-mail já cadastrado.' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username.toLowerCase(), email || null, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, username: username.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: username.toLowerCase() });
});

// -------------------------------------------------------------
// CONVERSATIONS ROUTES
// -------------------------------------------------------------
app.get('/api/conversations', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT id, title, messages, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
    res.json(rows.map(r => ({ ...r, messages: JSON.parse(r.messages) })));
});

app.post('/api/conversations', requireAuth, (req, res) => {
    const { id, title, messages } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'id e title são obrigatórios.' });
    db.prepare('INSERT OR REPLACE INTO conversations (id, user_id, title, messages, updated_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, req.user.id, title, JSON.stringify(messages || []));
    res.json({ ok: true });
});

app.put('/api/conversations/:id', requireAuth, (req, res) => {
    const { title, messages } = req.body;
    const result = db.prepare('UPDATE conversations SET title = COALESCE(?, title), messages = COALESCE(?, messages), updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?').run(title || null, messages ? JSON.stringify(messages) : null, req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Conversa não encontrada.' });
    res.json({ ok: true });
});

app.delete('/api/conversations/:id', requireAuth, (req, res) => {
    db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ ok: true });
});

// -------------------------------------------------------------
// AGENTS ROUTES
// -------------------------------------------------------------
app.get('/api/agents', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at ASC').all(req.user.id);
    res.json(rows.map(r => ({ ...r, systemPrompt: r.system_prompt })));
});

app.post('/api/agents', requireAuth, (req, res) => {
    const { id, name, description, model, icon, systemPrompt } = req.body;
    if (!id || !name || !systemPrompt) return res.status(400).json({ error: 'id, name e systemPrompt são obrigatórios.' });
    db.prepare('INSERT OR REPLACE INTO agents (id, user_id, name, description, model, icon, system_prompt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.user.id, name, description || '', model || 'meta-llama/llama-3.1-8b-instruct', icon || 'A', systemPrompt);
    res.status(201).json({ ok: true });
});

app.delete('/api/agents/:id', requireAuth, (req, res) => {
    db.prepare('DELETE FROM agents WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ ok: true });
});

// -------------------------------------------------------------
// CHAT PROXY → NOVITA AI
// -------------------------------------------------------------
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { messages, systemPrompt, model } = req.body;
        const apiKey = req.headers['x-user-api-key'] || process.env.NOVITA_API_KEY;

        if (!apiKey || apiKey === 'sua_chave_da_novita_ai_aqui') {
            return res.status(401).json({ error: 'Chave da Novita AI não configurada. Adicione NOVITA_API_KEY no .env ou em Configurações.' });
        }

        const activeModel = model || 'meta-llama/llama-3.1-8b-instruct';
        const activeSystemPrompt = systemPrompt || 'Você é o EPMA Commander, um assistente virtual especializado em engenharia, automação operacional e desenvolvimento de software. Responda em português de modo profissional e técnico.';

        const sanitizedMessages = messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));

        const response = await fetch('https://api.novita.ai/v3/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [{ role: 'system', content: activeSystemPrompt }, ...sanitizedMessages],
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Novita AI erro ${response.status}: ${errText}`);
        }

        res.json(await response.json());
    } catch (error) {
        console.error('Erro Novita AI:', error.message);
        res.status(500).json({ error: error.message || 'Erro interno no servidor.' });
    }
});

// -------------------------------------------------------------
// N8N PROXY — sem fallback mock
// -------------------------------------------------------------
app.post('/api/n8n/workflows', requireAuth, async (req, res) => {
    const N8N_URL = process.env.N8N_API_URL || 'http://epma-n8n:5678/api/v1/workflows';
    const N8N_API_KEY = process.env.N8N_API_KEY || '';

    try {
        const response = await fetch(N8N_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {})
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`n8n retornou ${response.status}: ${errText}`);
        }

        res.json(await response.json());
    } catch (error) {
        console.error('Erro n8n:', error.message);
        res.status(503).json({ error: `Não foi possível conectar ao n8n: ${error.message}` });
    }
});

// -------------------------------------------------------------
// START
// -------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 EPMA Commander rodando em http://localhost:${PORT}`);
    console.log(`🔐 Auth JWT ativo | 💾 SQLite: epma.db`);
    console.log(`===================================================`);
});
