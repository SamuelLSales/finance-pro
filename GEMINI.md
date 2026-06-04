Estou construindo um sistema de gestão financeira pessoal chamado "FinançasPro" 
utilizando React + Vite. O sistema será construído em etapas separadas. 
Cada etapa entrega uma parte funcional e visual completa.

STACK: React + Vite + Vanilla CSS. Chart.js / react-chartjs-2. Google Fonts. Lucide React.
DADOS: Todos mockados em JS (arrays/state/context). LocalStorage para persistência.
NAVEGAÇÃO: SPA — controle de visualização/seções via estado do React (Tabs/Views) sem reload.


DIREÇÃO VISUAL (aplicar em todas as etapas)
TEMA: "Modern Finance Dark" — profissional, denso de informação, elegante.
Inspiração: Bloomberg Terminal + dashboards SaaS modernos.

PALETA:
  --bg-base: #0A0B0F          /* fundo geral */
  --bg-card: #111318          /* cards */
  --bg-sidebar: #0D0E14       /* sidebar */
  --accent-green: #00D4AA     /* receitas, positivo */
  --accent-red: #FF4D6A       /* despesas, negativo */
  --accent-purple: #6C63FF    /* metas, destaques */
  --accent-yellow: #F5A623    /* alertas, atenção */
  --text-primary: #F0F2F5
  --text-muted: #6B7280
  --border: rgba(255,255,255,0.06)

TIPOGRAFIA (Google Fonts):
  - Syne 700/800 → headings e valores grandes
  - DM Sans 400/500 → corpo, labels, descrições
  - DM Mono 400/500 → valores monetários, números

COMPONENTES BASE:
  - Cards: background var(--bg-card), border 1px solid var(--border), 
    border-radius 8px, padding 24px
  - Botão primário: background var(--accent-green), color #000, 
    font-weight 600, border-radius 6px, sem border
  - Botão secundário: border 1px solid var(--border), background transparent
  - Badges: border-radius 4px, font DM Mono, font-size 11px, padding 2px 8px
  - Inputs: background #1A1C24, border 1px solid var(--border), 
    border-radius 6px, color var(--text-primary)
  - Scrollbar: width 4px, track transparent, thumb #2A2D3A
  - Hover nos cards: border-color rgba(255,255,255,0.12), transição 200ms
  - Animação count-up nos valores numéricos ao renderizar cada seção


 ETAPA 1 — Base + Sidebar + Dashboard
  Construa a estrutura base do sistema com:

1. ESTRUTURA HTML
   - Layout flex: sidebar fixa 220px + área de conteúdo
   - Aplicar toda a paleta e tipografia definidas acima
   - Sistema de navegação JS: cada seção em div com id, 
     só a ativa fica visível (display block/none)

2. SIDEBAR
   - Logo: ícone gráfico + "FinançasPro" (Syne Bold)
   - Menu: Dashboard, Transações, Relatórios, Metas, Orçamentos, Configurações
   - Ícones Lucide para cada item
   - Item ativo: barra lateral 3px var(--accent-green) + bg levemente iluminado
   - Toggle Tema Escuro/Claro (implementar ambos)
   - Rodapé: avatar circular com inicial, nome "Samuel Lima", email

3. DASHBOARD — seção principal com:

   KPIs (4 cards em linha):
   - Saldo Total → valor grande DM Mono, tendência +/- % vs mês anterior
   - Receitas do Mês → verde, ícone TrendingUp
   - Despesas do Mês → coral, ícone TrendingDown
   - Taxa de Economia → % em azul/roxo, subtexto "do total de receitas"
   - Todos com animação count-up ao carregar

   Gráfico "Evolução do Saldo" (Chart.js, linha com área):
   - Últimos 6 meses
   - Linha verde com gradiente fill transparente abaixo
   - Eixo Y em R$, eixo X com meses abreviados
   - Tooltip dark customizado
   - Grid lines sutis (rgba branco 0.05)

   Gráfico "Despesas por Categoria" (Chart.js, rosca/doughnut):
   - Categorias mockadas com valores
   - Legenda ao lado direito: ícone colorido + nome + valor + %
   - Animação de entrada

   Card "Últimas Transações" (5 itens):
   - Linha por transação: ícone categoria | descrição + data | badge tipo | valor
   - Badge "receita" (fundo verde 15% opacidade, texto verde)
   - Badge "despesa" (fundo coral 15% opacidade, texto coral)
   - Valor: verde se receita, coral se despesa, fonte DM Mono
   - Link "Ver todas" que navega para seção Transações

   Card "Metas em Progresso" (3 metas):
   - Nome da meta + valor atual / valor alvo
   - Barra de progresso animada (CSS transition)
   - Cor da barra: verde >70%, amarelo 40-70%, coral <40%

4. DADOS MOCKADOS (incluir no JS):
   - Usuário: Samuel Lima, samuel.lima21287@gmail.com
   - 20 transações dos últimos 6 meses, categorias variadas
   - Categorias: Salário, Freelance, Educação, Saúde, Transporte, 
     Alimentação, Lazer, Moradia, Outros
   - 4 metas com valores parcialmente atingidos
   - Valores realistas em R$ (salário ~R$ 4.500, despesas variadas)

 ETAPA 2 — Transações
   (Aguardar Etapa 1 estar pronta antes de executar)

Construa a seção "Transações" com:

1. HEADER DA SEÇÃO
   - Título "Transações" + subtítulo com total de registros
   - Botão "Nova Transação" (destaque, canto direito)

2. FILTROS em linha (abaixo do header):
   - Input de busca com ícone lupa
   - Dropdown: Tipo (Todos / Receita / Despesa)
   - Dropdown: Categoria (todas as categorias)
   - Date inputs: De / Até
   - Botão "Limpar filtros"
   - Filtros funcionais — filtrar o array de transações em tempo real

3. TABELA
   - Colunas: Data | Descrição | Categoria | Tipo | Valor | Ações
   - Categoria: badge com cor única por categoria
   - Tipo: badge "Receita" verde / "Despesa" coral
   - Valor: DM Mono, colorido por tipo
   - Ações: ícone editar + ícone excluir (Lucide)
   - Hover na linha com highlight sutil
   - Linhas alternadas levemente diferentes
   - Ordenação ao clicar no header (toggle asc/desc)

4. PAGINAÇÃO
   - 10 transações por página
   - Botões Anterior / Próximo + indicador "Página X de Y"

5. MODAL "Nova / Editar Transação"
   - Campos: Descrição, Valor (R$), Tipo (radio receita/despesa), 
     Categoria (select), Data
   - Validação: campos obrigatórios, valor > 0
   - Ao salvar: adiciona/atualiza array + fecha modal + atualiza tabela
   - Ao excluir: confirmar com modal simples antes de remover

6. RESUMO RÁPIDO acima da tabela (3 mini cards):
   - Total Receitas filtradas | Total Despesas filtradas | Saldo filtrado
   - Atualizam conforme os filtros mudam

 ETAPA 3 — Relatórios
   (Aguardar Etapa 2 estar pronta antes de executar)

Construa a seção "Relatórios" com:

1. FILTRO DE PERÍODO
   - Mês Inicial e Mês Final (inputs type month)
   - Botão "Atualizar" — recalcula todos os dados da seção

2. KPI CARDS (4 cards, animação count-up ao atualizar):
   - Total Receitas | Total Despesas | Saldo do Período | Taxa de Economia

3. GRÁFICO DE BARRAS AGRUPADAS (Chart.js):
   - Receitas vs Despesas por mês no período selecionado
   - Barras lado a lado: verde (receita) e coral (despesa)
   - Tooltip com valores formatados em R$

4. TABELA "Por Categoria":
   - Colunas: Categoria | Tipo | Valor | % do Total | Volume
   - % do Total: mini barra inline proporcional
   - Ordenada por valor decrescente

5. CARD "Informações do Relatório":
   - Período selecionado
   - Total de transações no período
   - Receitas totais (verde)
   - Despesas totais (coral)
   - Saldo final (verde ou coral conforme valor)
   - Taxa de economia (%)

6. EXPORTAÇÃO:
   - Botão CSV: gera e faz download de arquivo .csv com as transações do período
   - Botão PDF: usa window.print() com @media print estilizado


ETAPA 4 — Metas & Orçamentos
   (Aguardar Etapa 3 estar pronta antes de executar)

Construa a seção "Metas & Orçamentos" com duas subseções via tabs:

TAB 1 — METAS:
   - Grid 2 colunas de cards de metas
   - Cada card: ícone Lucide + nome + prazo + valor atual / alvo
   - Barra de progresso animada + % textual
   - Status badge: "Em dia" / "Atenção" / "Atrasada"
   - Botões editar / excluir por card
   - Botão "Nova Meta" → modal com: Nome, Valor Alvo, Prazo, Categoria/Ícone

TAB 2 — ORÇAMENTOS:
   - Tabela de orçamentos por categoria
   - Colunas: Categoria | Orçado (R$) | Gasto (R$) | Disponível | Status | Progresso
   - Progresso: barra inline colorida
   - Status: "OK" verde / "Atenção" amarelo / "Excedido" coral
   - Editar valor orçado inline (clique no valor → input → enter para salvar)
   - Card resumo no topo: Total Orçado | Total Gasto | Categorias Excedidas


ETAPA 5 — Configurações + Tema Light + Polimento Final
   (Aguardar Etapa 4 estar pronta antes de executar)

1. SEÇÃO CONFIGURAÇÕES:
   - Card "Perfil": Nome, Email (readonly), Moeda (select BRL/USD/EUR)
   - Card "Categorias": lista editável — adicionar, renomear, excluir
   - Card "Dados": botão "Exportar tudo (JSON)" e "Limpar dados"

2. TEMA CLARO (toggle na sidebar):
   Paleta light:
   --bg-base: #F4F6FA
   --bg-card: #FFFFFF
   --bg-sidebar: #FFFFFF
   --text-primary: #0A0B0F
   --text-muted: #6B7280
   --border: rgba(0,0,0,0.08)
   Mesmos acentos (verde, coral, roxo)
   Transição suave entre temas (transition 300ms em todas as vars)

3. POLIMENTO GERAL:
   - Loading skeleton nos cards ao trocar de seção (200ms)
   - Toasts de feedback: "Transação salva ✓", "Meta excluída", etc.
   - Estado vazio: ilustração + texto quando não há dados
   - Responsividade: sidebar vira hamburger em telas < 768px
   - LocalStorage: persistir transações, metas, orçamentos e preferência de tema
   - Todos os gráficos redimensionam ao trocar tema ou redimensionar janela