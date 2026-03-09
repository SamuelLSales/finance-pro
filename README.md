# 💸 FinançasPro

Aplicativo web de organização financeira pessoal em Python/Flask com banco SQLite.

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Python 3.8+
- pip

### 1. Instale as dependências

```bash
pip install flask reportlab
```

### 2. Execute o seed (dados de demonstração)

```bash
python seed.py
```

### 3. Inicie o servidor

```bash
python app.py
```

Acesse: **http://localhost:5000**

---

## 🔐 Conta Demo

| Campo | Valor |
|-------|-------|
| E-mail | `demo@financaspro.com.br` |
| Senha | `demo1234` |

---

## ✨ Funcionalidades

### Dashboard
- KPIs: Saldo, Receitas, Despesas, % Economia
- Gráfico de linha: saldo dos últimos 12 meses
- Gráfico de pizza: despesas por categoria
- Gráfico de colunas: receitas vs despesas
- Transações recentes e resumo de metas

### Transações
- CRUD completo (criar, ler, editar, excluir)
- Filtros por tipo, categoria, mês e busca
- Paginação

### Metas e Orçamentos
- Metas com progresso visual
- Orçamentos por categoria com alertas de estouro

### Relatórios
- Filtro por período (mês inicial/final)
- Exportação em **CSV** e **PDF** (ReportLab)
- Resumo por categoria

### Configurações
- Edição de perfil e nome
- Troca de senha (com hash PBKDF2)
- Criação/exclusão de categorias customizadas
- Tema claro / escuro (persistido no banco e localStorage)

---

## 🛡️ Segurança

- Senhas com **PBKDF2-SHA256** + salt (260.000 iterações)
- Sessões com tokens aleatórios (via `secrets.token_urlsafe`)
- Proteção **CSRF** em todos os formulários POST
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- Parâmetros SQL sempre parametrizados (sem injeção)
- Foreign keys com `ON DELETE CASCADE` no SQLite

---

## 📁 Estrutura

```
financeapp/
├── app.py              # Aplicação Flask principal
├── seed.py             # Script de dados de exemplo
├── README.md           # Este arquivo
├── instance/
│   └── financas.db     # Banco SQLite (gerado automaticamente)
└── templates/
    ├── base.html       # Layout base com sidebar, topbar, tema
    ├── login.html      # Página de login
    ├── cadastro.html   # Cadastro de conta
    ├── dashboard.html  # Dashboard com gráficos (Chart.js)
    ├── transacoes.html # CRUD de transações
    ├── metas.html      # Metas e orçamentos
    ├── relatorios.html # Relatórios e exportações
    └── configuracoes.html # Perfil e categorias
```

---

## ⚙️ Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | aleatório | Chave da sessão Flask |

---

## 🎨 Tecnologias

- **Backend**: Python 3 + Flask (stdlib + Flask + ReportLab)
- **Banco**: SQLite 3 (built-in)
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Gráficos**: Chart.js 4 (CDN)
- **Fontes**: DM Sans + DM Mono (Google Fonts)
- **PDF**: ReportLab 4
- **Tema**: Claro e escuro com CSS custom properties

---

## 📊 Dados de Exemplo (seed.py)

O seed gera:
- 1 usuário demo
- 12 categorias padrão (4 receitas + 8 despesas)
- ~150-180 transações (10 meses de histórico)
- 4 metas com progresso real
- 5 orçamentos mensais
