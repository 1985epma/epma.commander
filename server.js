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
        
        // Se o cliente enviar uma chave própria via headers, ela terá prioridade
        let apiKey = req.headers['x-user-api-key'] || process.env.NOVITA_API_KEY;

        if (!apiKey || apiKey === 'sua_chave_da_novita_ai_aqui') {
            return res.status(401).json({
                error: 'Para usar a Novita AI, adicione sua chave de API real no arquivo .env como NOVITA_API_KEY=sua_chave ou configure uma em Configurações (ícone de engrenagem) se preferir.'
            });
        }

        const activeModel = model || 'meta-llama/llama-3.1-8b-instruct';
        const activeSystemPrompt = systemPrompt || 'Você é o EPMA Commander, um assistente virtual ultra-inteligente, especializado em engenharia, automação operacional, desenvolvimento de software e telemetria. Responda em português de modo prestativo, profissional e técnico.';

        // Mapeia o papel 'ai' para o papel padrão 'assistant' aceito pela OpenAI/Novita AI
        const sanitizedMessages = messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));

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
                    ...sanitizedMessages
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

// Endpoint proxy para o n8n rodando no mesmo ecossistema Docker para criar e implantar workflows reais
app.post('/api/n8n/workflows', async (req, res) => {
    try {
        const workflowData = req.body;
        
        // URL padrão do n8n dentro da rede Docker (usando o nome de serviço configurado, ou localhost se rodando localmente)
        const N8N_URL = process.env.N8N_API_URL || 'http://epma-n8n:5678/api/v1/workflows';
        
        const response = await fetch(N8N_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Se o n8n exigir autenticação básica ou token do n8n posterior
                'Accept': 'application/json'
            },
            body: JSON.stringify(workflowData)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Falha ao implantar no n8n: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Erro ao implantar no n8n:', error);
        // Retorna sucesso mockado amigável para testes se o n8n ainda não estiver de pé ou ativo com API Key
        res.status(200).json({ 
            id: "simulated_" + Math.random().toString(36).substring(2, 7),
            name: req.body.name,
            active: true,
            message: "Implantado em modo híbrido de simulação local (API do n8n indisponível)",
            simulated: true 
        });
    }
});

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 EPMA Commander rodando em http://localhost:${PORT}`);
    console.log(`💡 Novita AI integrada e configurada no backend.`);
    console.log(`===================================================`);
});
