import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ChevronRight,
  Target
} from 'lucide-react';
import CountUp from './CountUp';
import CategoryIcon from './CategoryIcon';
import LineChart from './LineChart';
import DoughnutChart from './DoughnutChart';

export const DashboardSection = ({ 
  transactions, 
  categories, 
  goals, 
  onNavigate, 
  theme 
}) => {
  // --- CALCULATION LOGIC ---

  // Current month (June 2026) and previous month (May 2026) filters
  const currentMonthStr = "2026-06";
  const previousMonthStr = "2026-05";

  // All time balances
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'revenue' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  // June 2026 numbers
  const juneRevenues = useMemo(() => {
    return transactions
      .filter(t => t.type === 'revenue' && t.date.startsWith(currentMonthStr))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const juneExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const economyRate = useMemo(() => {
    if (juneRevenues === 0) return 0;
    const savings = juneRevenues - juneExpenses;
    return Math.max(0, (savings / juneRevenues) * 100);
  }, [juneRevenues, juneExpenses]);

  // Calculate balance at end of May 2026 (for trend)
  const balanceAtEndOfMay = useMemo(() => {
    return transactions
      .filter(t => t.date < "2026-06-01")
      .reduce((acc, t) => {
        return t.type === 'revenue' ? acc + t.amount : acc - t.amount;
      }, 0);
  }, [transactions]);

  const balanceTrendPercentage = useMemo(() => {
    if (balanceAtEndOfMay === 0) return 0;
    const change = totalBalance - balanceAtEndOfMay;
    return (change / balanceAtEndOfMay) * 100;
  }, [totalBalance, balanceAtEndOfMay]);

  // --- CHART DATA PREPARATION ---

  // 1. Line Chart: Cumulative Balance Evolution over the last 6 months (Jan-Jun 2026)
  const lineChartData = useMemo(() => {
    const months = [
      { name: "Jan", key: "2026-01" },
      { name: "Fev", key: "2026-02" },
      { name: "Mar", key: "2026-03" },
      { name: "Abr", key: "2026-04" },
      { name: "Mai", key: "2026-05" },
      { name: "Jun", key: "2026-06" }
    ];

    let runningBalance = 0;
    const values = [];

    // Calculate cumulative balance chronologically
    // Start with all transactions before Jan 2026 (none in our mock, but good practice)
    const priorTransactions = transactions.filter(t => t.date < "2026-01-01");
    runningBalance = priorTransactions.reduce((acc, t) => {
      return t.type === 'revenue' ? acc + t.amount : acc - t.amount;
    }, 0);

    months.forEach(m => {
      const monthTx = transactions.filter(t => t.date.startsWith(m.key));
      const net = monthTx.reduce((acc, t) => {
        return t.type === 'revenue' ? acc + t.amount : acc - t.amount;
      }, 0);
      runningBalance += net;
      values.push(runningBalance);
    });

    return {
      labels: months.map(m => m.name),
      values: values
    };
  }, [transactions]);

  // 2. Doughnut Chart: Expenses by Category (All time or current month. We aggregate all time for a richer chart)
  const doughnutChartData = useMemo(() => {
    const expenseTx = transactions.filter(t => t.type === 'expense');
    
    // Group expenses by category
    const grouped = {};
    let totalExpenses = 0;
    
    expenseTx.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
      totalExpenses += t.amount;
    });

    const labels = [];
    const values = [];
    const colors = [];
    const rawLegend = [];

    categories.forEach(cat => {
      const amt = grouped[cat.id] || 0;
      if (amt > 0) {
        labels.push(cat.name);
        values.push(amt);
        colors.push(cat.color);
        
        rawLegend.push({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          value: amt,
          percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0
        });
      }
    });

    // Sort legend by value descending
    rawLegend.sort((a, b) => b.value - a.value);

    return {
      chart: { labels, values, colors },
      legend: rawLegend
    };
  }, [transactions, categories]);

  // 3. Recent Transactions (First 5)
  const recentTransactions = useMemo(() => {
    // Sort descending by date, then by ID to keep order stable
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  // 4. Goals in Progress (First 3)
  const activeGoals = useMemo(() => {
    return goals.slice(0, 3);
  }, [goals]);

  // Color helper for goal progress bars
  const getGoalColorClass = (percentage) => {
    if (percentage > 70) return 'var(--accent-green)';
    if (percentage >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className="skeleton-overlay">
      <div className="section-header">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="section-subtitle font-sans">Bem-vindo de volta ao seu painel financeiro.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpis-grid">
        {/* Card 1: Saldo Total */}
        <div className="card kpi-card">
          <div className="kpi-header">
            <span>SALDO TOTAL</span>
            <div className="kpi-icon-wrapper">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono">
            R$ <CountUp value={totalBalance} />
          </div>
          <div className="kpi-footer font-sans">
            <span className={balanceTrendPercentage >= 0 ? "trend-positive" : "trend-negative"}>
              {balanceTrendPercentage >= 0 ? "+" : ""}
              <CountUp value={balanceTrendPercentage} decimals={1} />%
            </span>
            <span className="text-muted">vs mês anterior</span>
          </div>
        </div>

        {/* Card 2: Receitas do Mês */}
        <div className="card kpi-card">
          <div className="kpi-header">
            <span>RECEITAS DO MÊS</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-green)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: 'var(--accent-green)' }}>
            R$ <CountUp value={juneRevenues} />
          </div>
          <div className="kpi-footer font-sans">
            <span className="text-muted">Mês de Junho</span>
          </div>
        </div>

        {/* Card 3: Despesas do Mês */}
        <div className="card kpi-card">
          <div className="kpi-header">
            <span>DESPESAS DO MÊS</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-red)' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: 'var(--accent-red)' }}>
            R$ <CountUp value={juneExpenses} />
          </div>
          <div className="kpi-footer font-sans">
            <span className="text-muted">Mês de Junho</span>
          </div>
        </div>

        {/* Card 4: Taxa de Economia */}
        <div className="card kpi-card">
          <div className="kpi-header">
            <span>TAXA DE ECONOMIA</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-purple)' }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: 'var(--accent-purple)' }}>
            <CountUp value={economyRate} decimals={1} />%
          </div>
          <div className="kpi-footer font-sans">
            <span className="text-muted">do total de receitas</span>
          </div>
        </div>
      </div>

      {/* Charts & Bottom Sections */}
      <div className="dashboard-grid">
        {/* Balance Evolution Line Chart */}
        <div className="card chart-card">
          <div className="card-title font-heading">
            Evolução do Saldo
            <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>Últimos 6 meses</span>
          </div>
          <div className="chart-container">
            <LineChart data={lineChartData} theme={theme} />
          </div>
        </div>

        {/* Expenses by Category Doughnut */}
        <div className="card chart-card">
          <div className="card-title font-heading">
            Despesas por Categoria
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="chart-container" style={{ minHeight: '140px', maxHeight: '160px' }}>
              <DoughnutChart data={doughnutChartData.chart} theme={theme} />
            </div>
            
            {/* Custom Legend */}
            <div className="legend-container">
              {doughnutChartData.legend.map(item => (
                <div className="legend-item" key={item.id}>
                  <div className="legend-left font-sans">
                    <span className="legend-color-dot" style={{ backgroundColor: item.color }} />
                    <CategoryIcon name={item.icon} size={12} style={{ color: item.color }} />
                    <span className="legend-name">{item.name}</span>
                  </div>
                  <div className="legend-right">
                    <span className="legend-value">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="legend-percentage">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions & Goals Progress */}
      <div className="dashboard-grid">
        {/* Recent Transactions List */}
        <div className="card">
          <div className="card-title font-heading" style={{ marginBottom: '20px' }}>
            Últimas Transações
            <button 
              onClick={() => onNavigate('transactions')} 
              className="btn-secondary font-sans" 
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="recent-transactions-list">
            {recentTransactions.map(tx => {
              const catObj = categories.find(c => c.id === tx.category) || {};
              const catColor = catObj.color || 'var(--text-muted)';
              const catIcon = catObj.icon || 'HelpCircle';
              const catName = catObj.name || tx.category;

              return (
                <div className="transaction-row" key={tx.id}>
                  <div className="transaction-left">
                    <div 
                      className="category-icon-box" 
                      style={{ backgroundColor: `${catColor}20`, color: catColor }}
                    >
                      <CategoryIcon name={catIcon} size={16} />
                    </div>
                    <div className="transaction-info">
                      <span className="transaction-desc font-sans">{tx.description}</span>
                      <span className="transaction-date font-sans">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: tx.type === 'revenue' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 77, 106, 0.15)',
                        color: tx.type === 'revenue' ? 'var(--accent-green)' : 'var(--accent-red)'
                      }}
                    >
                      {tx.type === 'revenue' ? 'receita' : 'despesa'}
                    </span>
                    <span className={`transaction-amount ${tx.type === 'revenue' ? 'positive' : 'negative'}`}>
                      {tx.type === 'revenue' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="card">
          <div className="card-title font-heading" style={{ marginBottom: '20px' }}>
            Metas em Progresso
            <Target size={16} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="goals-progress-list">
            {activeGoals.map(goal => {
              const percentage = Math.min(100, (goal.current / goal.target) * 100);
              const barColor = getGoalColorClass(percentage);

              return (
                <div className="goal-progress-item" key={goal.id}>
                  <div className="goal-info-row font-sans">
                    <span className="goal-name-label">{goal.name}</span>
                    <span className="goal-values-label">
                      R$ {goal.current.toLocaleString('pt-BR')} / R$ {goal.target.toLocaleString('pt-BR')} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: barColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
