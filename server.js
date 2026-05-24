const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON e servir arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint do chat proxying para a Novita AI
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, systemPrompt, model } = req.body;
        const apiKey = process.env.NOVITA_API_KEY;

        if (!apiKey || apiKey === 'sua_chave_da_novita_ai_aqui') {
            return res.status(401).json({
                error: 'Para usar a Novita AI, adicione sua chave de API real no arquivo .env como NOVITA_API_KEY=sua_chave'
            });
        }

        const activeModel = model || 'meta-llama/llama-3-8b-instruct';
        const activeSystemPrompt = systemPrompt || 'Você é o EPMA Commander, um assistente virtual ultra-inteligente, especializado em engenharia, automação operacional, desenvolvimento de software e telemetria. Responda em português de modo prestativo, profissional e técnico.';

        // Novita AI utiliza o padrão compatível com a biblioteca do OpenAI
        const response = await fetch('https://api.novita.ai/v3/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [
                    {
                        role: 'system',
                        content: activeSystemPrompt
                    },
                    ...messages
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Novita AI erro: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Erro na requisição para a Novita AI:', error);
        res.status(500).json({ error: error.message || 'Erro interno no servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 EPMA Commander rodando em http://localhost:${PORT}`);
    console.log(`💡 Novita AI integrada e configurada no backend.`);
    console.log(`===================================================`);
});
