# Instruções de Codificação IA para FinançasPro

## Visão Geral do Projeto
FinançasPro é um aplicativo web de gerenciamento de finanças pessoais construído com **Flask + SQLite** (backend Python) e visualização **Chart.js**. Suporta transações, orçamentos, metas, relatórios com exportação CSV/PDF e alternância de tema (claro/escuro).

**Stack Tecnológico**: Flask 2, SQLite3, ReportLab (PDF), Chart.js, templates Jinja2, JavaScript Vanilla

**Arquivos-Chave**: `app.py` (530 linhas, todas as rotas e lógica), `seed.py` (dados de demonstração), `templates/base.html` (sistema de layout)

---

## Arquitetura e Fluxo de Dados

### Schema do Banco de Dados
Banco SQLite único (`instance/financas.db`). Tabelas principais:
- **users**: Perfil, preferência de tema, autenticação
- **categories**: Tipos predefinidos (Salário, Alimentação, etc.) com ícones emoji e cores hex
- **transactions**: Dados principais—valor, tipo (receita/despesa), data, category_id, notas
- **goals**: Metas de economia do usuário com rastreamento de progresso
- **budgets**: Limites de gastos por categoria por mês
- **sessions**: Autenticação por token (expiração de 7 dias)

**Padrão Crítico**: Todas as tabelas têm `user_id` com `ON DELETE CASCADE`—exclusão automática.

### Fluxo de Requisições
1. **Autenticação**: Tokens de sessão armazenados na tabela `sessions`. `get_current_user()` valida expiração do token.
2. **Decoradores de Rota**: `@login_required` redireciona para `/login` se não houver sessão válida.
3. **Proteção CSRF**: Todos os formulários POST requerem `csrf_token` da sessão; validado via `validate_csrf()`.
4. **Contexto do Banco**: Conexão `g.db` por requisição, fechada automaticamente em `@app.teardown_appcontext`.

### Padrões de Processamento de Dados
- **Agregação em Rotas**: Dashboard calcula KPIs (receitas/despesas/saldo) com SQL SUM+GROUP BY, não ORM.
- **Filtro de Data**: Usa correspondência de substring `date LIKE '%Y-%m%'`; `date.today().strftime('%Y-%m')` para mês atual.
- **Moeda**: Armazenada como REAL, exibida como `f"{value:,.2f}"`. Formulários aceitam separadores de vírgula (`.replace(',', '.')`).

---

## Implementação de Segurança
- **Hash de Senha**: PBKDF2-SHA256 com 260.000 iterações + salt aleatório (veja `hash_password()`, `verify_password()`).
- **Tokens de Sessão**: Tokens aleatórios de 32 bytes seguro para URL, expiração de 7 dias verificada em cada rota protegida.
- **CSRF**: `hmac.compare_digest()` para comparação segura contra tempo.
- **SQL Injection**: Todas as queries parametrizadas; nunca concatene entrada do usuário em SQL.
- **Headers HTTP**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` definidos em `@app.after_request`.

---

## Convenções de Frontend

### Arquitetura CSS
Folha de estilo única (`static/css/app.css`) usando **variáveis CSS** para temas:
- Variáveis raiz: `--bg`, `--surface`, `--text`, `--accent`, `--green`, `--red`, etc.
- Tema escuro ativado via seletor `[data-theme="dark"]` na tag `<html>`.
- Classes utilitárias: `.card`, `.kpi-grid`, `.grid-2`, `.grid-3`, `.btn-icon`, `.modal-backdrop`.
- Sem Tailwind/Bootstrap—sistema de design personalizado usando CSS Grid e Flexbox.

### Padrões JavaScript
- **Sem Framework**: Apenas JavaScript vanilla; código mínimo e orientado a eventos em `static/js/app.js`.
- **Sistema de Modal**: Função `toggleModal(id)`; modais têm `class="modal-backdrop"` e atributo `hidden`.
- **Interações de Formulário**: 
  - Inputs de moeda: Formatação automática ao sair (separador `,` para exibição, `.` para processamento).
  - Botões de radio de tema: Alterna atributo `data-theme` em `<html>`, auto-envia POST para `/api/tema`.
  - Barra lateral móvel: Alterna classe `.open` na barra lateral; overlay fecha automaticamente ao clicar.
- **Chart.js**: Usado em `dashboard.html` e `relatorios.html`; dados passados como JSON do Flask via `json.dumps()`.
- **Mensagens Flash**: Auto-descartadas após 4 segundos com transição CSS fade-out.

### Estrutura de Templates
Layout base: `templates/base.html` (barra lateral, barra superior, área de conteúdo).
- Navegação da barra lateral usa atributos de dados: `data-page="transacoes"` para destacar itens de nav ativos.
- Título da página injetado via `{% block title %}`.
- Contexto do usuário via `{% if current_user %}` e `{{ current_user.name }}`, `{{ current_user.theme }}`.

---

## Tarefas Comuns de Desenvolvimento

### Adicionando um Campo de Transação
1. **Banco de Dados**: Adicione coluna à tabela `transactions` em `init_db()` CREATE TABLE.
2. **Seed**: Atualize `seed.py` para preencher o novo campo (necessário para dados de demonstração).
3. **Formulário**: Adicione campo de entrada a `templates/form_transacao.html` modal.
4. **Manipulador de Rota**: Analise o novo campo em `nova_transacao()` / `editar_transacao()`.
5. **Exibição**: Faça join na query SQL e renderize na tabela `transacoes.html`.

### Adicionando uma Nova Categoria
- Use padrão de função `_seed_default_categories()`: tupla de (nome, tipo, cor, ícone).
- Rotas e seed referenciam categorias por busca de tupla `(nome, tipo)`.
- Categorias têm ícone emoji fixo + cor hex; atualize atomicamente.

### Exportando Relatórios
- **CSV**: `csv.writer()` com delimitador `;` (padrão PT-BR); codificação UTF-8-sig.
- **PDF**: ReportLab com `SimpleDocTemplate`, `TableStyle`, cores de fundo condicionais.
- Ambos usam mesmo filtro de intervalo de data: `mes_inicio` a `mes_fim` como `YYYY-MM`.

### Alternância de Tema
- Lado do cliente: JS alterna atributo `data-theme` em `<html>`, dispara troca de variáveis CSS.
- Lado do servidor: POST para `/api/tema` salva preferência na coluna `users.theme`.
- Persiste entre sessões via contexto `render_template()`: `data-theme="{{ current_user.theme if current_user else 'light' }}"`.

---

## Padrões Específicos do Projeto

### Formatação de Strings
- **Português**: Todos os textos da UI, mensagens de erro e rótulos em PT-BR.
- **Datas**: `%d/%m/%Y` para exibição, `%Y-%m-%d` para armazenamento em DB.
- **Moeda**: `f"{value:,.2f}"` (vírgulas como separador de milhares).

### Padrão de Envio de Formulário
```python
# Estrutura padrão em todas as rotas POST:
if not validate_csrf(request.form.get('csrf_token')): 
    flash('Token inválido.', 'error')
    return redirect(url_for('...'))
# [processar requisição]
db.commit()
flash('Ação realizada!', 'success')
return redirect(url_for('...'))
```

### Cálculo de KPI do Dashboard
Sempre use o mês atual (`today.strftime('%Y-%m')`) para KPIs ativos; dados históricos em loop separado para gráficos.

---

## Execução e Debug

### Inicialização
```bash
python seed.py        # Redefina usuário de demonstração + 10 meses de transações
python app.py         # Execute em localhost:5000 (modo debug)
```

### Credenciais de Teste (após seed)
- Email: `demo@financaspro.com.br`
- Senha: `demo1234`

### Problemas Comuns
- **"Token inválido"**: Incompatibilidade de token CSRF—verifique se `csrf_token()` é chamado no formulário.
- **Banco de dados travado**: SQLite é single-writer; reinicie Flask se travar na escrita do DB.
- **Tema não persiste**: Verifique se `current_user.theme` está sendo definido no manipulador POST antes do redirect.

---

## Notas para Agentes IA
- **Sem tarefas assíncronas/background**: Flask roda em modo debug; adequado apenas para demos single-user.
- **Sem ORM**: Todo SQL é manual—mantenha disciplina de parametrização.
- **Simplicidade de Frontend**: Sem npm/build step; atualize variáveis CSS ou JS diretamente.
- **Localização**: PT-BR em toda parte; preserve português em strings de UI e comentários.
