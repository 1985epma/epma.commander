// Conversation storage structures
let conversations = JSON.parse(localStorage.getItem('epma_chats')) || [];
let currentChatId = null;

// Agents Storage / Configuration list (Extensiva com papéis especialistas corporativos do EPMA Commander)
const defaultAgents = [
    {
        id: 'agent_general',
        name: 'Geral (Llama 3)',
        description: 'Assistente padrão para automações de engenharia generalista',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'G',
        systemPrompt: 'Você é o EPMA Commander, um assistente virtual ultra-inteligente, especializado em engenharia, automação operacional, desenvolvimento de software e telemetria. Responda em português de modo prestativo, profissional e técnico.'
    },
    {
        id: 'agent_devops',
        name: 'DevOps Specialist',
        description: 'Focado em CI/CD, pipelines, conteinerização Docker, Kubernetes e infraestrutura',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'O',
        systemPrompt: 'Você é um Engenheiro DevOps Sênior focado na infraestrutura do EPMA. Especialista em empacotamento Docker, arquivos de implantação Kubernetes, Terraform, Bicep, esteiras de CI/CD (Azure DevOps/GitHub Actions) e scripts de automação Bash. Dê respostas estritamente voltadas para automação de infraestrutura declarativa e eficiente.'
    },
    {
        id: 'agent_observability',
        name: 'Observabilidade & SRE',
        description: 'Especialista em Prometheus, Grafana, OpenTelemetry, logs e alertas',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'E',
        systemPrompt: 'Você é o Engenheiro SRE / especialista em Observabilidade do EPMA. Seu objetivo é ajudar a desenhar dashboards no Grafana, queries PromQL, alertas no Alertmanager, coleta de telemetria distribuída via OpenTelemetry e gerenciamento inteligente de logs corporativos com o Elastic / Loki.'
    },
    {
        id: 'agent_devsecops',
        name: 'DevSecOps Specialist',
        description: 'Focado em segurança de pipelines, varreduras SAST/DAST e compliance',
        model: 'meta-llama/llama-3-70b-instruct',
        icon: 'S',
        systemPrompt: 'Você é um Especialista de Segurança na esteira de CI/CD (DevSecOps). Seu foco é blindar o desenvolvimento integrado das ferramentas EPMA. Auxilie os engenheiros a injetar analisadores estáticos (SAST, como Trivy, SonarQube), dinâmicos (DAST), auditorias de pacotes de dependência e controle robusto de segredos criptográficos de forma automatizada.'
    },
    {
        id: 'agent_dev',
        name: 'Desenvolvedor FullStack',
        description: 'Especialista em escrever, depurar e otimizar códigos JS/TS, Python e SQL',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'D',
        systemPrompt: 'Você é um Engenheiro de Software FullStack Sênior. Forneça trechos de código limpos, seguros, documentados, com boas práticas de SOLID, DRY e padrões de projeto aplicados. Escreva preferencialmente soluções pragmáticas em TypeScript, Python ou Go adaptáveis ao núcleo do EPMA.'
    },
    {
        id: 'agent_data_scientist',
        name: 'Cientista de Dados AI',
        description: 'Focado em modelos preditivos, estatística, pandas, regressões e machine learning',
        model: 'meta-llama/llama-3-70b-instruct',
        icon: 'C',
        systemPrompt: 'Você é um Cientista de Dados do ecossistema EPMA. Especialista em Python, bibliotecas como NumPy, Pandas, Scikit-Learn e PyTorch. Seu objetivo é extrair inteligência, conduzir análises estatísticas rigorosas, treinar modelos preditivos de falhas e propor algoritmos para otimizar métricas operacionais.'
    },
    {
        id: 'agent_data_engineer',
        name: 'Engenheiro de Dados',
        description: 'Especialista em ETL, pipelines Spark, repositório de dados e data lakehouses',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'E',
        systemPrompt: 'Você é um Arquiteto e Engenheiro de Dados Sênior. Domina pipelines de ETL/ELT complexos, ecossistemas Apache Spark, Delta Lake, Snowflake, integradores Kafka e modelagem analítica dimensional (Star Schema). Ajude a estruturar pipelines limpos de migração e telemetria operacional.'
    },
    {
        id: 'agent_dba',
        name: 'Administrador SQL/DBA',
        description: 'Tuning fino, replicação, queries complexas e integridade de bancos de dados',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'B',
        systemPrompt: 'Você é um experiente Administrador de Bancos de Dados (DBA) de alta escala. Ajude com tuning de consultas SQL complexas, desenho de estruturas físicas relacionais, diagnóstico de deadlocks, configurações do SQL Server/PostgreSQL e politicas eficientes de backup e restauração.'
    },
    {
        id: 'agent_tech_lead',
        name: 'Tech Lead / Facilitador',
        description: 'Definição de caminhos tecnológicos, mentoria técnica e arquitetura de sistemas',
        model: 'meta-llama/llama-3-70b-instruct',
        icon: 'T',
        systemPrompt: 'Você é o Tech Lead do time técnico do EPMA. Seu papel é direcionar soluções de tecnologia da forma mais robusta e evolutiva possível, mediando conflitos técnicos de arquitetura, estruturando documentações ágeis e equilibrando velocidade de entrega com a eliminação de débitos técnicos.'
    },
    {
        id: 'agent_finops',
        name: 'Gerente de FinOps',
        description: 'Otimização inteligente de custos e orçamentos na nuvem (Azure, AWS)',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'F',
        systemPrompt: 'Você é um Consultor Sênior de FinOps em Cloud Computing. Sua meta básica é analisar gastos brutos de nuvem e sugerir otimizações imediatas de uso de servidores no Azure/AWS: reservas de instâncias, redimensionamentos corretos (rightsizing), exclusão de volumes órfãos e governança preventiva de custos.'
    },
    {
        id: 'agent_cto',
        name: 'Chief Technology Officer (CTO)',
        description: 'Estratégia tecnológica, visão estratégica, roadmaps globais e inovação de sistemas',
        model: 'meta-llama/llama-3-70b-instruct',
        icon: 'C',
        systemPrompt: 'Você é o Chief Technology Officer (CTO) do EPMA Commander. Analise questões sob a perspectiva executiva de tecnologia em longo prazo, identificando onde novos desenvolvimentos se correlacionam com as macro-estratégias competitivas de mercado da empresa, investimento de capital em P&D e inovação aberta.'
    },
    {
        id: 'agent_ciso',
        name: 'Chief Information Security Officer (CISO)',
        description: 'Governança global de riscos cibernéticos, ISO 27001, LGPD e compliance tático',
        model: 'meta-llama/llama-3-70b-instruct',
        icon: 'I',
        systemPrompt: 'Você é o Chief Information Security Officer (CISO) corporativo da organização. Aconselhe equipes em governança de riscos à segurança da informação, aderência estrutural à ISO 27001, compliance com LGPD/GDPR, gestão preventiva de contingências de crise e auditorias de mitigação corporativa de ativos.'
    },
    {
        id: 'agent_qa',
        name: 'Engenheiro de QA & Testes',
        description: 'Automação de testes de regressão, testes unitários, Cypress, Playwright e BDD',
        model: 'meta-llama/llama-3-8b-instruct',
        icon: 'Q',
        systemPrompt: 'Você é o Engenheiro de Qualidade de Software (QA/Test Automation) encarregado no EPMA Commander. Ajude desenvolvedores a criar cenários BDD claros (Gherkin), scripts de testes dinâmicos automatizados de ponta a ponta (Playwright, Cypress, Selenium) e orientações técnicas de cobertura de testes de caixa preta.'
    }
];

let customAgents = JSON.parse(localStorage.getItem('epma_custom_agents')) || [];
let activeAgentId = localStorage.getItem('epma_active_agent_id') || 'agent_general';

function getActiveAgent() {
    const all = [...defaultAgents, ...customAgents];
    return all.find(a => a.id === activeAgentId) || defaultAgents[0];
}

// Mock Responses Repository based on key expressions for realistic EPMA simulated AI interaction
const mockResponses = {
    guidelines: `Aqui estão ótimas sugestões para automatizar processos de engenharia com o **EPMA**:

1. **Automação de Relatórios Semanais**: Use um script em Python para consultar as APIs do EPMA e compilar métricas operacionais diretamente em um PDF estilizado enviado aos gerentes.
2. **Integração de Escopos via CI/CD**: Conecte os dados de projetos a pipelines da Azure DevOps para travar deploys se as metas de garantia ou revisão de código do EPMA falharem.
3. **Sensores IoT e Alertas**: Acione webhooks dinâmicos no EPMA sempre que anomalias de hardware em campo forem medidas acima do limiar crítico.

Diga-me, qual dessas automações se encaixa mais no seu plano operacional de engenharia?`,

    dashboard: `Criar um painel de indicadores (dashboard) do zero para frotas de equipamentos no **EPMA Commander** exige 3 fases essenciais:

### 1. Modelagem de Dados
Você precisará coletar leituras operacionais básicas através das nossas conexões JDBC/ODBC seguras:
- **Horas ativas** (Horímetro acumulado)
- **Consumo de combustível** (Média de consumo mensal)
- **Status de manutenção** (Ativo, Manutenção Corretiva, Manutenção Preventiva)

### 2. Painel de Controle (Exemplo de Consulta SQL)
\`\`\`sql
SELECT 
    equipamento_id,
    modelo,
    status_atual,
    ROUND(SUM(horas_operadas), 1) AS total_horas,
    CASE WHEN status_atual = 'Preventivo' THEN 'Atenção' ELSE 'Regular' END AS criticidade
FROM frotas.telemetria_calculada
WHERE data_registro >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY equipamento_id, modelo, status_atual;
\`\`\`

### 3. Exibição Visual
Recomendamos plotar esses dados usando nosso componente nativo de Canvas ou exportando via webhook seguro para conectores de PowerBI / Grafana. Qual dessas ferramentas de visualização você costuma adotar?`,

    sql: `A oscilação e falhas intermitentes em conexões com bancos de dados SQL remotos são diagnósticos comuns. Siga este roteiro de depuração:

1. **Estouro de Pool de Conexões**: Verifique se a aplicação está fechando instâncias abertas adequadamente. Aumente o \`Max Pool Size\` na string de conexão se necessário.
2. **Tempo Limite (Timeout) Alto**: Aumente o \`Connection Timeout\` para 30 ou 45 segundos para compensar oscilações curtas da rede física.
3. **Verificação de Redes Locais**:
   - Teste de alcance básico:
     \`\`\`bash
     ping -c 4 seu-servidor-sql.database.windows.net
     \`\`\`
   - Teste se a porta de escuta padrão (geralmente \`1433\` para SQL Server) está acessível através de fogo cruzado (firewall):
     \`\`\`bash
     nc -zv seu-servidor-sql.database.windows.net 1433
     \`\`\`

Se houver uma biblioteca ou framework específico em uso (como Hibernate, Entity Framework ou raw Node-pg), me avise para eu detalhar a configuração de KeepAlive.`,

    python: `Aqui está um script completo de validação integridade em Python, pronto para validar barramento de APIs REST do **EPMA**:

\`\`\`python
import time
import requests

API_ENDPOINT = "https://api.epma.com/v1/health"
HEADERS = {
    "Authorization": "Bearer SEU_TOKEN_AQUI",
    "Content-Type": "application/json"
}

def check_epma_services():
    print("[*] Iniciando teste de conectividade com a API EPMA...")
    start_time = time.time()
    try:
        response = requests.get(API_ENDPOINT, headers=HEADERS, timeout=10)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"[✔] Sucesso! Conexão estabelecida em {elapsed:.2f}s.")
            print(f"Status do Serviço: {data.get('status', 'OK')}")
            print(f"Versão Ativa: {data.get('version', 'Desconhecida')}")
        else:
            print(f"[✖] Falha de comunicação. Código HTTP recebido: {response.status_code}")
            print(f"Mensagem de Erro: {response.text}")
            
    except requests.exceptions.Timeout:
        print("[✖] Erro de timeout: O servidor demorou mais que 10s para responder.")
    except Exception as err:
        print(f"[✖] Ocorreu uma exceção inesperada: {err}")

if __name__ == "__main__":
    check_epma_services()
\`\`\`

Este código simula a estrutura que você pode incorporar nos seus testes de integração regulares de pipelines de build.`,

    default: `Entendido! Como especialista e assistente operacional do **EPMA Commander**, estou refinando novas abordagens para o seu caso.

Podemos investigar esse cenário sob múltiplos aspectos operacionais:
- **Otimização de Arquitetura**: Melhorar o desempenho de requisições ou estruturas de dados.
- **Segurança da Informação**: Incorporar chaves de criptografia e validações reforçadas nas APIs.
- **Análise Estatística**: Consolidar dados de hardware e telemetria.

Pode descrever com mais detalhes o problema ou fornecer o trecho de código/configuração que está utilizando para eu ser mais assertivo?`
};

// Select DOM elements
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnNewChat = document.getElementById('btn-new-chat');
const historyContainer = document.getElementById('history-container');
const chatWindow = document.getElementById('chat-window');
const welcomeState = document.getElementById('welcome-state');
const conversationStream = document.getElementById('conversation-stream');
const chatForm = document.getElementById('chat-form');
const promptInput = document.getElementById('prompt-input');
const btnSubmit = document.getElementById('btn-submit');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const cardSuggestions = document.querySelectorAll('.card-suggest');
const disclaimer = document.getElementById('disclaimer');

// -------------------------------------------------------------
// EVENT LISTENERS & LIFECYCLE
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initial theme detection and application
    initTheme();
    
    // Initialize Agents Banner and list
    renderActiveAgentBanner();

    // Render stored chat history inside the sidebar
    renderHistory();
    // Check if there are active chats, if so, load the most recent, else start empty welcome state
    if (conversations.length > 0) {
         // Auto-load most recent chat
         loadChat(conversations[0].id);
    } else {
         startNewConversation(false);
    }
    
    // Auto-grow textarea setup
    promptInput.addEventListener('input', handleTextareaAutogrow);
    
    // Form action triggers
    chatForm.addEventListener('submit', handleFormSubmit);
    
    // Card suggestions triggers
    cardSuggestions.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            promptInput.value = prompt;
            handleTextareaAutogrow();
            btnSubmit.removeAttribute('disabled');
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    // Theme toggle action
    btnThemeToggle.addEventListener('click', toggleTheme);

    // Sidebar controls (sliding)
    openSidebarBtn.addEventListener('click', toggleResponsiveSidebar);
    closeSidebarBtn.addEventListener('click', toggleResponsiveSidebar);
    sidebarOverlay.addEventListener('click', toggleResponsiveSidebar);
    
    // New chat action trigger
    btnNewChat.addEventListener('click', () => {
        startNewConversation(true);
    });

    // Open/Close Agents Modal
    const btnManageAgents = document.getElementById('btn-manage-agents');
    const agentModal = document.getElementById('agent-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const agentForm = document.getElementById('agent-form');
    const btnResetForm = document.getElementById('btn-reset-form');

    btnManageAgents.addEventListener('click', () => {
        // Toggle opacity-0 / scaling with transition
        agentModal.classList.remove('hidden');
        setTimeout(() => {
            agentModal.classList.remove('opacity-0');
            agentModal.querySelector('.transform').classList.remove('scale-95');
        }, 10);
        renderModalAgentsList();
    });

    const closeModalFunc = () => {
        agentModal.classList.add('opacity-0');
        agentModal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            agentModal.classList.add('hidden');
        }, 300);
    };

    btnCloseModal.addEventListener('click', closeModalFunc);
    agentModal.addEventListener('click', (e) => {
        if (e.target === agentModal) closeModalFunc();
    });

    // Handle agent save
    agentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = 'agent_' + Date.now();
        const newAgent = {
            id: id,
            name: document.getElementById('form-agent-name').value.trim(),
            description: document.getElementById('form-agent-desc').value.trim(),
            model: document.getElementById('form-agent-model').value,
            icon: (document.getElementById('form-agent-icon').value.trim() || 'A').toUpperCase().substring(0, 1),
            systemPrompt: document.getElementById('form-agent-system').value.trim()
        };
        customAgents.push(newAgent);
        localStorage.setItem('epma_custom_agents', JSON.stringify(customAgents));
        agentForm.reset();
        
        renderModalAgentsList();
        selectAgent(id);
    });

    btnResetForm.addEventListener('click', () => {
        agentForm.reset();
    });

    // Export JSON
    document.getElementById('btn-export-json').addEventListener('click', () => {
        const allAgents = [...defaultAgents, ...customAgents];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allAgents, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `epma_agents_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // Export YAML
    document.getElementById('btn-export-yaml').addEventListener('click', () => {
        const allAgents = [...defaultAgents, ...customAgents];
        let yamlContent = "agents:\n";
        allAgents.forEach(a => {
            yamlContent += `  - id: "${a.id}"\n`;
            yamlContent += `    name: "${a.name.replace(/"/g, '\\"')}"\n`;
            yamlContent += `    description: "${a.description.replace(/"/g, '\\"')}"\n`;
            yamlContent += `    model: "${a.model}"\n`;
            yamlContent += `    icon: "${a.icon}"\n`;
            yamlContent += `    systemPrompt: |\n      ${a.systemPrompt.replace(/\n/g, '\n      ')}\n\n`;
        });

        const dataStr = "data:text/yaml;charset=utf-8," + encodeURIComponent(yamlContent);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `epma_agents_${Date.now()}.yaml`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // Import configurations
    document.getElementById('btn-import-agents').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = readerEvent => {
                try {
                    const parsed = JSON.parse(readerEvent.target.result);
                    if (Array.isArray(parsed)) {
                        customAgents = [...customAgents, ...parsed.filter(a => a.id && a.name && a.systemPrompt)];
                        localStorage.setItem('epma_custom_agents', JSON.stringify(customAgents));
                        renderModalAgentsList();
                        alert('Agentes importados com sucesso!');
                    } else {
                        alert('Formato de arquivo incompatível. Deve ser uma lista de agentes estruturada.');
                    }
                } catch (err) {
                    alert('Falha ao processar arquivo JSON: ' + err.message);
                }
            }
        }
        input.click();
    });

    // Handle auxiliary input clicks (mock alerts)
    document.querySelectorAll('.btn-input-asset').forEach(btn => {
        btn.addEventListener('click', () => {
            const featureName = btn.getAttribute('title');
            alert(`O recurso "${featureName}" é simulado para fins estéticos de demonstração do EPMA Commander.`);
        });
    });
});

// -------------------------------------------------------------
// AGENTS MANAGEMENT RENDERING
// -------------------------------------------------------------
function renderActiveAgentBanner() {
    const active = getActiveAgent();
    const banner = document.getElementById('active-agent-banner');
    const iconEl = document.getElementById('active-agent-icon');
    const nameEl = document.getElementById('active-agent-name');
    const descEl = document.getElementById('active-agent-desc');
    
    iconEl.textContent = active.icon || 'A';
    nameEl.textContent = active.name;
    descEl.textContent = active.description;
}

function selectAgent(id) {
    activeAgentId = id;
    localStorage.setItem('epma_active_agent_id', id);
    renderActiveAgentBanner();
    
    // If modal is open, refresh highlights
    renderModalAgentsList();
}

function deleteCustomAgent(id) {
    if (confirm('Tem certeza que deseja excluir esta persona de agente?')) {
        customAgents = customAgents.filter(a => a.id !== id);
        localStorage.setItem('epma_custom_agents', JSON.stringify(customAgents));
        if (activeAgentId === id) {
            activeAgentId = 'agent_general';
            localStorage.setItem('epma_active_agent_id', 'agent_general');
            renderActiveAgentBanner();
        }
        renderModalAgentsList();
    }
}

function renderModalAgentsList() {
    const grid = document.getElementById('modal-agents-grid');
    grid.innerHTML = '';
    const all = [...defaultAgents, ...customAgents];
    
    all.forEach(agent => {
        const isSelected = agent.id === activeAgentId;
        const isDefault = defaultAgents.some(da => da.id === agent.id);

        const card = document.createElement('div');
        card.className = `p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'bg-indigo-50/70 border-indigo-500 dark:bg-purple-950/40 dark:border-purple-600' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/50 dark:bg-[#1f1b2d] dark:border-purple-900/10 dark:hover:bg-[#252037]'} relative`;
        
        card.innerHTML = `
            <div>
                <div class="flex items-center space-x-3 mb-2">
                    <div class="w-8 h-8 rounded-xl ${isSelected ? 'bg-indigo-600 dark:bg-purple-600' : 'bg-gray-300 dark:bg-purple-900/30'} text-white flex items-center justify-center font-bold text-sm">
                        ${agent.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 leading-tight">
                            ${agent.name}
                            ${isSelected ? '<span class="inline-flex items-center px-1 rounded-full text-[9px] font-bold bg-indigo-600 text-white leading-none py-0.5">Ativo</span>' : ''}
                        </span>
                        <p class="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">Model: ${agent.model}</p>
                    </div>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">${agent.description}</p>
            </div>
            <div class="flex items-center justify-between mt-auto">
                <button class="text-[10px] font-semibold text-indigo-600 dark:text-purple-400 hover:underline">Selecionar Persona</button>
                ${!isDefault ? `
                    <button class="delete-agent-btn text-gray-400 hover:text-red-500 p-1 rounded transition-colors" title="Excluir Persona">
                        <i class="fa-regular fa-trash-can text-sm"></i>
                    </button>
                ` : '<span class="text-[9px] text-gray-400 font-semibold px-2 py-0.5 rounded-md bg-gray-200/50 dark:bg-purple-950/20 leading-none select-none">Padrão</span>'}
            </div>
        `;
        
        // Select agent click handler
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-agent-btn')) return;
            selectAgent(agent.id);
        });

        // Delete handler if custom
        if (!isDefault) {
            card.querySelector('.delete-agent-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCustomAgent(agent.id);
            });
        }

        grid.appendChild(card);
    });
}

// -------------------------------------------------------------
// USER THEME HANDLERS (SYSTEM PREFERENCE + LOCALSTORAGE)
// -------------------------------------------------------------
function initTheme() {
    const cachedTheme = localStorage.getItem('epma_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (cachedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        themeIcon.className = 'fa-solid fa-moon text-lg';
    } else if (cachedTheme === 'dark' || prefersDark) {
        document.documentElement.classList.add('dark');
        themeIcon.className = 'fa-solid fa-sun text-lg';
    }
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('epma_theme', 'light');
        themeIcon.className = 'fa-solid fa-moon text-lg';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('epma_theme', 'dark');
        themeIcon.className = 'fa-solid fa-sun text-lg';
    }
}

// -------------------------------------------------------------
// RESPONSIVE SIDEBAR CONTROLLER 
// -------------------------------------------------------------
function toggleResponsiveSidebar() {
    sidebar.classList.toggle('sidebar-open');
    sidebarOverlay.classList.toggle('hidden');
}

function handleTextareaAutogrow() {
    promptInput.style.height = 'auto';
    promptInput.style.height = (promptInput.scrollHeight) + 'px';
    
    // Enable or disable Submit button based on presence of meaningful queries
    if (promptInput.value.trim().length > 0) {
        btnSubmit.removeAttribute('disabled');
    } else {
        btnSubmit.setAttribute('disabled', 'true');
    }
}

// -------------------------------------------------------------
// CONVERSATION FLOW CONTROLLERS
// -------------------------------------------------------------
function startNewConversation(shouldWipeSessionState = true) {
    if (shouldWipeSessionState) {
        currentChatId = null;
    }
    
    // Visual UI restoration
    welcomeState.classList.remove('hidden');
    conversationStream.classList.add('hidden');
    conversationStream.innerHTML = '';
    
    promptInput.value = '';
    promptInput.style.height = 'auto';
    btnSubmit.setAttribute('disabled', 'true');
    
    // Clear selected active states from sidebar
    document.querySelectorAll('.history-item').forEach(el => {
        el.classList.remove('border-indigo-600', 'bg-gray-200', 'dark:bg-purple-950/30', 'dark:border-purple-600');
    });

    // On narrow viewports/mobile, auto-close sidebar on new chat creation
    if (window.innerWidth <= 768 && sidebar.classList.contains('sidebar-open')) {
        toggleResponsiveSidebar();
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const query = promptInput.value.trim();
    if (!query) return;
    
    // Clear input instantly & lock input controls to simulate processing
    promptInput.value = '';
    promptInput.style.height = 'auto';
    btnSubmit.setAttribute('disabled', 'true');
    
    // Ensure we are viewing the Active conversation stream
    if (welcomeState.classList.contains('hidden') === false) {
        welcomeState.classList.add('hidden');
        conversationStream.classList.remove('hidden');
        conversationStream.classList.add('flex');
    }
    
    // Create new Chat session object if currentChatId is null
    if (!currentChatId) {
        currentChatId = 'chat_' + Date.now();
        const shortTitle = query.length > 28 ? query.substring(0, 28) + '...' : query;
        const newChat = {
            id: currentChatId,
            title: shortTitle,
            messages: []
        };
        conversations.unshift(newChat);
        saveConversations();
        renderHistory();
    }
    
    // Append client-side message
    appendMessage('user', query);
    
    // Push client-side query to messages list
    const activeChat = conversations.find(c => c.id === currentChatId);
    if (activeChat) {
        activeChat.messages.push({ role: 'user', content: query });
        saveConversations();
    }
    
    // Trigger simulated AI Response Pipeline
    triggerSimulatedResponse(query);
}

function appendMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble flex w-full max-w-[800px] border-b border-gray-100/70 dark:border-purple-950/10 py-6 px-1 md:px-2 flex-col md:flex-row items-start space-y-3 md:space-y-0 md:space-x-6`;
    
    let avatarMarkup = '';
    if (role === 'user') {
        avatarMarkup = `
            <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shrink-0 select-none shadow">
                U
            </div>
        `;
    } else {
        avatarMarkup = `
            <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow shadow-indigo-500/20">
                <i class="fa-solid fa-wand-magic-sparkles text-xs animate-pulse"></i>
            </div>
        `;
    }

    const formattedContent = role === 'user' ? escapeHTML(content) : parseMarkdown(content);
    
    bubble.innerHTML = `
        ${avatarMarkup}
        <div class="flex-1 min-w-0 prose text-gray-800 dark:text-gray-200">
            ${role === 'ai' ? '' : `<p class="whitespace-pre-line">${formattedContent}</p>`}
        </div>
    `;

    conversationStream.appendChild(bubble);
    
    if (role === 'ai') {
        // We'll stream the AI answer into the bubble's prose container
        return bubble.querySelector('.prose');
    }
    
    // Auto-scroll chat scrollable viewport to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// -------------------------------------------------------------
// REAL NOVITA AI RESPONDER PIPELINE (WITH BACKEND PROXY INTEGRATION)
// -------------------------------------------------------------
function triggerSimulatedResponse(userQuery) {
    // 1. Append Thinking Skeletal/Loading Indicator
    const skeletonBubble = document.createElement('div');
    skeletonBubble.id = 'thinking-indicator';
    skeletonBubble.className = 'message-bubble flex w-full max-w-[800px] py-6 px-1 md:px-2 md:space-x-6 items-start';
    skeletonBubble.innerHTML = `
        <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 select-none">
            <i class="fa-solid fa-wand-magic-sparkles text-xs animate-spin-slow"></i>
        </div>
        <div class="flex-1 space-y-4 pt-1 ml-4 md:ml-0 max-w-[600px]">
            <div class="h-3.5 skeleton-pulse rounded-full w-full"></div>
            <div class="h-3.5 skeleton-pulse rounded-full w-[85%]"></div>
            <div class="h-3.5 skeleton-pulse rounded-full w-[50%]"></div>
        </div>
    `;
    conversationStream.appendChild(skeletonBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Get the current chat's full messages history for context
    const activeChat = conversations.find(c => c.id === currentChatId) || { messages: [{ role: 'user', content: userQuery }] };

    // Request the proxy backend
    const activeAgent = getActiveAgent();
    
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: activeChat.messages,
            systemPrompt: activeAgent.systemPrompt,
            model: activeAgent.model
        })
    })
    .then(async (res) => {
        const skeleton = document.getElementById('thinking-indicator');
        if (skeleton) skeleton.remove();

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Erro ao conectar à API.');
        }

        const data = await res.json();
        const aiMessage = data.choices[0].message.content;

        // Append actual container & retrieve typing slot target
        const proseDiv = appendMessage('ai', '');
        
        // Store actual AI message in current chat history JSON
        const chatObj = conversations.find(c => c.id === currentChatId);
        if (chatObj) {
            chatObj.messages.push({ role: 'ai', content: aiMessage });
            saveConversations();
        }

        // Typewriter streaming character mechanics
        let counter = 0;
        const words = aiMessage.split(' ');
        
        function streamWords() {
            if (counter < words.length) {
                const currentContentSlice = words.slice(0, counter + 1).join(' ');
                proseDiv.innerHTML = parseMarkdown(currentContentSlice);
                counter++;
                chatWindow.scrollTop = chatWindow.scrollHeight;
                
                // Add soft random interval variance for authentic typing delay
                const delay = Math.floor(Math.random() * 15) + 8;
                setTimeout(streamWords, delay);
            } else {
                // Ensure complete text structure renders
                proseDiv.innerHTML = parseMarkdown(aiMessage);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        }
        
        streamWords();
    })
    .catch((error) => {
        console.error('Erro na requisição:', error);
        
        const skeleton = document.getElementById('thinking-indicator');
        if (skeleton) skeleton.remove();

        // Show elegant error feedback
        const proseDiv = appendMessage('ai', '');
        proseDiv.innerHTML = `
            <div class="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-sm">
                <p class="font-bold flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-triangle-exclamation"></i> Ops! Algo deu errado
                </p>
                <p class="mb-2">${error.message}</p>
                <p class="text-xs opacity-80">Por favor, garanta que o servidor Node.js backend está rodando localmente (<code>npm start</code>) e seu arquivo <code>.env</code> possui a <code>NOVITA_API_KEY</code> correta.</p>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
}

// -------------------------------------------------------------
// HISTORY RENDER & SELECTION PERSISTENCE CODE
// -------------------------------------------------------------
function renderHistory() {
    historyContainer.innerHTML = '';
    
    if (conversations.length === 0) {
        historyContainer.innerHTML = `
            <div class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
                Nenhum chat recente
            </div>
        `;
        return;
    }
    
    conversations.forEach(chat => {
        const item = document.createElement('div');
        item.className = `group flex items-center justify-between px-4 py-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-purple-950/20 text-gray-700 dark:text-gray-300 text-sm cursor-pointer border-l-2 border-transparent transition-all history-item ${chat.id === currentChatId ? 'border-indigo-600 bg-gray-200/80 dark:bg-purple-950/30 dark:border-purple-600 text-indigo-700 dark:text-purple-300 font-medium' : ''}`;
        item.setAttribute('data-id', chat.id);
        
        item.innerHTML = `
            <div class="flex items-center space-x-3 overflow-hidden mr-2 flex-1 scroll-reveal">
                <i class="fa-regular fa-message text-xs opacity-75 shrink-0"></i>
                <span class="truncate block text-xs tracking-wide leading-none">${escapeHTML(chat.title)}</span>
            </div>
            <button class="delete-history-btn opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition-opacity" data-id="${chat.id}" title="Excluir">
                <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
        `;
        
        // Load chat event on click
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-history-btn')) return; // bypass delete trigger
            loadChat(chat.id);
        });
        
        // Trash/Delete event
        item.querySelector('.delete-history-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        historyContainer.appendChild(item);
    });
}

function loadChat(id) {
    const chat = conversations.find(c => c.id === id);
    if (!chat) return;
    
    currentChatId = id;
    
    welcomeState.classList.add('hidden');
    conversationStream.classList.remove('hidden');
    conversationStream.classList.add('flex');
    conversationStream.innerHTML = '';
    
    // Add all existing stored historic message bubbles
    chat.messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble flex w-full max-w-[800px] border-b border-gray-100/70 dark:border-purple-950/10 py-6 px-1 md:px-2 flex-col md:flex-row items-start space-y-3 md:space-y-0 md:space-x-6`;
        
        let avatarMarkup = '';
        if (msg.role === 'user') {
            avatarMarkup = `
                <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shrink-0 select-none shadow">
                    U
                </div>
            `;
        } else {
            avatarMarkup = `
                <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow shadow-indigo-500/20">
                    <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
                </div>
            `;
        }

        const formattedContent = msg.role === 'user' ? escapeHTML(msg.content) : parseMarkdown(msg.content);
        
        bubble.innerHTML = `
            ${avatarMarkup}
            <div class="flex-1 min-w-0 prose text-gray-800 dark:text-gray-200">
                ${msg.role === 'user' ? `<p class="whitespace-pre-line">${formattedContent}</p>` : formattedContent}
            </div>
        `;
        
        conversationStream.appendChild(bubble);
    });
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Update active highlight classes on sidebar items
    document.querySelectorAll('.history-item').forEach(el => {
        if (el.getAttribute('data-id') === id) {
            el.classList.add('border-indigo-600', 'bg-gray-200', 'dark:bg-purple-950/30', 'dark:border-purple-600', 'text-indigo-700', 'dark:text-purple-300', 'font-medium');
        } else {
            el.classList.remove('border-indigo-600', 'bg-gray-200', 'dark:bg-purple-950/30', 'dark:border-purple-600', 'text-indigo-700', 'dark:text-purple-300', 'font-medium');
        }
    });

    // Mobile sidebar sliding behavior dismisses panel after choice
    if (window.innerWidth <= 768 && sidebar.classList.contains('sidebar-open')) {
        toggleResponsiveSidebar();
    }
}

function deleteChat(id) {
    conversations = conversations.filter(c => c.id !== id);
    saveConversations();
    renderHistory();
    
    if (currentChatId === id) {
        startNewConversation(true);
    }
}

function saveConversations() {
    localStorage.setItem('epma_chats', JSON.stringify(conversations));
}

// -------------------------------------------------------------
// TEXT ENCODING & SIMPLE MARKDOWN COMPILER UTILS
// -------------------------------------------------------------
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseMarkdown(text) {
    let html = escapeHTML(text);

    // 1. Codeblocks converter (\`\`\`lang ... \`\`\`)
    const codeBlockRegex = /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
    html = html.replace(codeBlockRegex, (match, code) => {
        // Strip out trailing escape strings inside code tags if any exist
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // 2. Inline code highlight (\`code\`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Bold pattern highlight (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 4. Bullet lists formats (- item)
    // Works row by row
    let lines = html.split('\n');
    let insideList = false;
    let compiledLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!insideList) {
                insideList = true;
                compiledLines.push('<ul class="list-disc pl-5 my-2">');
            }
            compiledLines.push(`<li>${line.substring(2)}</li>`);
        } else if (line.match(/^\d+\.\s/)) { // numbered lists like 1. item
            if (!insideList) {
                insideList = true;
                compiledLines.push('<ol class="list-decimal pl-5 my-2">');
            }
            // Strip the number match prefix e.g. "1. "
            const listContent = line.replace(/^\d+\.\s/, '');
            compiledLines.push(`<li>${listContent}</li>`);
        } else {
            if (insideList) {
                insideList = false;
                // Check if last opened was ol or ul
                const lastOpen = compiledLines[compiledLines.length - 1];
                if (compiledLines.some(l => l.includes('<ul')) && !compiledLines.some(l => l.includes('</ul'))) {
                    compiledLines.push('</ul>');
                } else {
                    compiledLines.push('</ol>');
                }
            }
            
            // Handle header tags e.g. "### Header"
            if (line.startsWith('### ')) {
                compiledLines.push(`<h3 class="text-base font-bold text-gray-900 dark:text-white mt-4 mb-2">${line.substring(4)}</h3>`);
            } else if (line.startsWith('## ')) {
                compiledLines.push(`<h2 class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">${line.substring(3)}</h2>`);
            } else if (line !== '') {
                compiledLines.push(`<p class="mb-4">${line}</p>`);
            }
        }
    }

    if (insideList) {
        if (compiledLines.some(l => l.includes('<ul')) && !compiledLines.some(l => l.includes('</ul>'))) {
            compiledLines.push('</ul>');
        } else {
            compiledLines.push('</ol>');
        }
    }

    return compiledLines.join('\n');
}
