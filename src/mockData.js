// Mock data for FinançasPro

export const initialUser = {
  name: "Samuel Lima",
  email: "samuel.lima21287@gmail.com",
  avatar: "SL",
  currency: "BRL"
};

export const initialCategories = [
  { id: "salario", name: "Salário", color: "#00D4AA", icon: "DollarSign" },
  { id: "freelance", name: "Freelance", color: "#6C63FF", icon: "Briefcase" },
  { id: "educacao", name: "Educação", color: "#F5A623", icon: "BookOpen" },
  { id: "saude", name: "Saúde", color: "#FF4D6A", icon: "Heart" },
  { id: "transporte", name: "Transporte", color: "#00D4AA", icon: "Car" },
  { id: "alimentacao", name: "Alimentação", color: "#F5A623", icon: "ShoppingBag" },
  { id: "lazer", name: "Lazer", color: "#6C63FF", icon: "Compass" },
  { id: "moradia", name: "Moradia", color: "#FF4D6A", icon: "Home" },
  { id: "outros", name: "Outros", color: "#6B7280", icon: "HelpCircle" }
];

export const initialGoals = [
  {
    id: "g1",
    name: "Reserva de Emergência",
    target: 15000,
    current: 10500,
    deadline: "2026-12-31",
    category: "moradia",
    icon: "Shield"
  },
  {
    id: "g2",
    name: "Viagem de Férias",
    target: 6000,
    current: 4500,
    deadline: "2026-09-30",
    category: "lazer",
    icon: "Plane"
  },
  {
    id: "g3",
    name: "Novo Computador",
    target: 5000,
    current: 1800,
    deadline: "2026-11-15",
    category: "outros",
    icon: "Laptop"
  },
  {
    id: "g4",
    name: "Curso de Especialização",
    target: 1500,
    current: 1350,
    deadline: "2026-07-20",
    category: "educacao",
    icon: "Award"
  }
];

// Predefined monthly budgets
export const initialBudgets = [
  { category: "moradia", limit: 1500 },
  { category: "alimentacao", limit: 800 },
  { category: "transporte", limit: 400 },
  { category: "lazer", limit: 500 },
  { category: "saude", limit: 300 },
  { category: "educacao", limit: 400 },
  { category: "outros", limit: 200 }
];

// 20 transactions over the last 6 months (Dec 2025 to Jun 2026)
export const initialTransactions = [
  {
    id: "t1",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-06-01"
  },
  {
    id: "t2",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-06-02"
  },
  {
    id: "t3",
    description: "Supermercado Semanal",
    amount: 250.00,
    type: "expense",
    category: "alimentacao",
    date: "2026-06-03"
  },
  {
    id: "t4",
    description: "Freelance Landing Page",
    amount: 1500.00,
    type: "revenue",
    category: "freelance",
    date: "2026-05-28"
  },
  {
    id: "t5",
    description: "Combustível Carro",
    amount: 180.00,
    type: "expense",
    category: "transporte",
    date: "2026-05-25"
  },
  {
    id: "t6",
    description: "Consulta Médica",
    amount: 200.00,
    type: "expense",
    category: "saude",
    date: "2026-05-20"
  },
  {
    id: "t7",
    description: "Jantar Especial",
    amount: 150.00,
    type: "expense",
    category: "lazer",
    date: "2026-05-18"
  },
  {
    id: "t8",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-05-01"
  },
  {
    id: "t9",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-05-02"
  },
  {
    id: "t10",
    description: "Mensalidade Faculdade",
    amount: 350.00,
    type: "expense",
    category: "educacao",
    date: "2026-05-10"
  },
  {
    id: "t11",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-04-01"
  },
  {
    id: "t12",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-04-02"
  },
  {
    id: "t13",
    description: "Uber Viagens",
    amount: 90.00,
    type: "expense",
    category: "transporte",
    date: "2026-04-15"
  },
  {
    id: "t14",
    description: "Cinema + Pipoca",
    amount: 60.00,
    type: "expense",
    category: "lazer",
    date: "2026-04-20"
  },
  {
    id: "t15",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-03-01"
  },
  {
    id: "t16",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-03-02"
  },
  {
    id: "t17",
    description: "Freelance API",
    amount: 800.00,
    type: "revenue",
    category: "freelance",
    date: "2026-03-10"
  },
  {
    id: "t18",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-02-01"
  },
  {
    id: "t19",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-02-02"
  },
  {
    id: "t20",
    description: "Salário Principal",
    amount: 4500.00,
    type: "revenue",
    category: "salario",
    date: "2026-01-01"
  },
  {
    id: "t21",
    description: "Aluguel Apartamento",
    amount: 1200.00,
    type: "expense",
    category: "moradia",
    date: "2026-01-02"
  },
  {
    id: "t22",
    description: "Farmácia",
    amount: 85.00,
    type: "expense",
    category: "saude",
    date: "2026-01-15"
  }
];
