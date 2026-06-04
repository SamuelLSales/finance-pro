import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Download, 
  Printer, 
  FileText,
  AlertCircle
} from 'lucide-react';
import CountUp from './CountUp';
import CategoryIcon from './CategoryIcon';
import BarChart from './BarChart';

// Helper to generate list of YYYY-MM months between start and end inclusive
const getMonthsInRange = (start, end) => {
  if (!start || !end) return [];
  const [startY, startM] = start.split('-').map(Number);
  const [endY, endM] = end.split('-').map(Number);
  
  const startD = new Date(startY, startM - 1, 1);
  const endD = new Date(endY, endM - 1, 1);
  
  // Guard if end date is before start date
  if (startD > endD) return [];

  const months = [];
  let current = new Date(startD);
  
  while (current <= endD) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
    
    if (months.length > 100) break; // Avoid infinite loops
  }
  return months;
};

// Portuguese month abbreviations
const monthAbbr = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez'
};

const formatMonthAbbr = (monthStr) => {
  const [y, m] = monthStr.split('-');
  return `${monthAbbr[m]}/${y.slice(2)}`;
};

const getLongMonthName = (monthStr) => {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const months = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro'
  };
  return `${months[m]} de ${y}`;
};

export const ReportsSection = ({ 
  transactions, 
  categories, 
  showToast 
}) => {
  // Period filter states (defaults to 2026-01 to 2026-06 to match mock data)
  const [startMonthInput, setStartMonthInput] = useState("2026-01");
  const [endMonthInput, setEndMonthInput] = useState("2026-06");
  
  // Applied states
  const [startMonth, setStartMonth] = useState("2026-01");
  const [endMonth, setEndMonth] = useState("2026-06");
  const [updateCount, setUpdateCount] = useState(0);

  // Recalculates metrics when the user clicks "Atualizar"
  const handleUpdate = () => {
    if (startMonthInput > endMonthInput) {
      showToast("O mês inicial não pode ser posterior ao mês final.", "error");
      return;
    }
    setStartMonth(startMonthInput);
    setEndMonth(endMonthInput);
    setUpdateCount(prev => prev + 1);
    showToast("Relatório atualizado com sucesso!", "success");
  };

  // Filtered transactions for the selected period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tMonth = t.date.slice(0, 7);
      return tMonth >= startMonth && tMonth <= endMonth;
    });
  }, [transactions, startMonth, endMonth]);

  // Compute key metrics
  const { totalRevenues, totalExpenses, netBalance, economyRate } = useMemo(() => {
    let revSum = 0;
    let expSum = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'revenue') {
        revSum += t.amount;
      } else {
        expSum += t.amount;
      }
    });

    const net = revSum - expSum;
    const rate = revSum > 0 ? (net / revSum) * 100 : 0;

    return {
      totalRevenues: revSum,
      totalExpenses: expSum,
      netBalance: net,
      economyRate: Math.max(0, rate)
    };
  }, [filteredTransactions]);

  // Chart data: Revenues vs Expenses per month
  const barChartData = useMemo(() => {
    const months = getMonthsInRange(startMonth, endMonth);
    const labels = months.map(m => formatMonthAbbr(m));
    const revenues = [];
    const expenses = [];

    months.forEach(m => {
      const monthTx = transactions.filter(t => t.date.startsWith(m));
      const rev = monthTx.filter(t => t.type === 'revenue').reduce((acc, t) => acc + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      revenues.push(rev);
      expenses.push(exp);
    });

    return { labels, revenues, expenses };
  }, [transactions, startMonth, endMonth]);

  // Categories Breakdown Table Data
  const categoryStats = useMemo(() => {
    const stats = {};

    filteredTransactions.forEach(t => {
      if (!stats[t.category]) {
        const catObj = categories.find(c => c.id === t.category) || {
          name: t.category.charAt(0).toUpperCase() + t.category.slice(1),
          color: '#6B7280',
          icon: 'HelpCircle'
        };
        stats[t.category] = {
          id: t.category,
          name: catObj.name,
          color: catObj.color,
          icon: catObj.icon,
          type: t.type,
          value: 0,
          volume: 0
        };
      }
      stats[t.category].value += t.amount;
      stats[t.category].volume += 1;
    });

    const statsArray = Object.values(stats);

    statsArray.forEach(item => {
      if (item.type === 'revenue') {
        item.percentage = totalRevenues > 0 ? (item.value / totalRevenues) * 100 : 0;
      } else {
        item.percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
      }
    });

    // Sorted by value descending
    return statsArray.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories, totalRevenues, totalExpenses]);

  // Export to CSV Functionality
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast("Nenhuma transação encontrada no período selecionado.", "warning");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Data;Descrição;Categoria;Tipo;Valor (R$)\n";

    filteredTransactions.forEach(t => {
      const catName = categories.find(c => c.id === t.category)?.name || t.category;
      const typeLabel = t.type === 'revenue' ? 'Receita' : 'Despesa';
      const amountStr = t.amount.toFixed(2).replace('.', ',');
      csvContent += `${t.date};"${t.description.replace(/"/g, '""')}";${catName};${typeLabel};${amountStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financepro_relatorio_${startMonth}_a_${endMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório CSV baixado com sucesso!", "success");
  };

  // Export to PDF Functionality (Print Page)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="section-container">
      {/* Header of Section */}
      <div className="section-header no-print">
        <div>
          <h2 className="section-title">Relatórios Analíticos</h2>
          <p className="section-subtitle">Analise seu fluxo de caixa e o detalhamento de categorias por período</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary flex-center gap-8" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <button className="btn btn-primary flex-center gap-8" onClick={handleExportPDF}>
            <Printer size={16} />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Card */}
      <div className="card no-print">
        <div className="filters-grid">
          <div className="filter-item">
            <span className="filter-label">Mês Inicial</span>
            <div className="date-input-wrapper">
              <Calendar size={16} className="date-icon" />
              <input 
                type="month" 
                className="input-field select-field" 
                style={{ paddingLeft: '38px' }}
                value={startMonthInput}
                onChange={(e) => setStartMonthInput(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-item">
            <span className="filter-label">Mês Final</span>
            <div className="date-input-wrapper">
              <Calendar size={16} className="date-icon" />
              <input 
                type="month" 
                className="input-field select-field" 
                style={{ paddingLeft: '38px' }}
                value={endMonthInput}
                onChange={(e) => setEndMonthInput(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button className="btn btn-primary w-100" onClick={handleUpdate}>
              Atualizar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: '#000', margin: '0 0 4px 0' }}>
          Finance Pro — Relatório Financeiro
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#666', margin: 0 }}>
          Período: {getLongMonthName(startMonth)} a {getLongMonthName(endMonth)}
        </p>
      </div>

      {/* KPI Cards (4 cards in line) */}
      <div className="kpis-grid">
        {/* KPI 1: Total Receitas */}
        <div className="card kpi-card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <div className="kpi-header">
            <span className="kpi-label">Total Receitas</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-green)', backgroundColor: 'rgba(0, 212, 170, 0.08)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value text-primary">
            <CountUp key={`rev-${updateCount}`} value={totalRevenues} prefix="R$ " />
          </div>
          <div className="kpi-trend positive">
            Filtrado no período
          </div>
        </div>

        {/* KPI 2: Total Despesas */}
        <div className="card kpi-card" style={{ borderLeft: '3px solid var(--accent-red)' }}>
          <div className="kpi-header">
            <span className="kpi-label">Total Despesas</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-red)', backgroundColor: 'rgba(255, 77, 106, 0.08)' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="kpi-value text-primary">
            <CountUp key={`exp-${updateCount}`} value={totalExpenses} prefix="R$ " />
          </div>
          <div className="kpi-trend negative">
            Filtrado no período
          </div>
        </div>

        {/* KPI 3: Saldo do Período */}
        <div className="card kpi-card" style={{ borderLeft: `3px solid ${netBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
          <div className="kpi-header">
            <span className="kpi-label">Saldo do Período</span>
            <div className="kpi-icon-wrapper" style={{ 
              color: netBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', 
              backgroundColor: netBalance >= 0 ? 'rgba(0, 212, 170, 0.08)' : 'rgba(255, 77, 106, 0.08)' 
            }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="kpi-value text-primary">
            <CountUp key={`bal-${updateCount}`} value={netBalance} prefix="R$ " />
          </div>
          <div className="kpi-trend" style={{ color: netBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {netBalance >= 0 ? 'Superávit' : 'Déficit'}
          </div>
        </div>

        {/* KPI 4: Taxa de Economia */}
        <div className="card kpi-card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
          <div className="kpi-header">
            <span className="kpi-label">Taxa de Economia</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-purple)', backgroundColor: 'rgba(108, 99, 255, 0.08)' }}>
              <Percent size={16} />
            </div>
          </div>
          <div className="kpi-value text-primary">
            <CountUp key={`rate-${updateCount}`} value={economyRate} suffix="%" />
          </div>
          <div className="kpi-trend" style={{ color: 'var(--accent-purple)' }}>
            do total de receitas
          </div>
        </div>
      </div>

      {/* Main Charts & Information Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Left Column: Grouped Bar Chart */}
        <div className="card flex-column" style={{ minHeight: '380px' }}>
          <div className="card-header-with-actions" style={{ marginBottom: '20px' }}>
            <h3 className="card-title">Comparativo Mensal</h3>
            <span className="text-muted" style={{ fontSize: '12px' }}>Receitas vs Despesas</span>
          </div>
          <div className="chart-wrapper" style={{ flex: 1, position: 'relative' }}>
            {barChartData.labels.length > 0 ? (
              <BarChart data={barChartData} theme={document.documentElement.getAttribute('data-theme') || 'dark'} />
            ) : (
              <div className="flex-center h-100 text-muted gap-8">
                <AlertCircle size={16} />
                <span>Nenhum dado disponível para o período selecionado.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Card "Informações do Relatório" */}
        <div className="card flex-column justify-between">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <FileText size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>Informações do Relatório</span>
            </h3>
            
            <div className="info-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Período Selecionado</span>
                <span className="text-primary" style={{ fontSize: '14px', fontWeight: 500 }}>
                  {getLongMonthName(startMonth)} a {getLongMonthName(endMonth)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span className="text-muted">Total de Transações</span>
                <span className="text-primary" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{filteredTransactions.length}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span className="text-muted">Receitas Totais</span>
                <span className="positive-value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span className="text-muted">Despesas Totais</span>
                <span className="negative-value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span className="text-muted">Saldo Final</span>
                <span className={netBalance >= 0 ? "positive-value" : "negative-value"} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '13px' }}>Taxa de Economia</span>
              <span className="badge" style={{ 
                backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                color: 'var(--accent-purple)', 
                fontSize: '12px',
                padding: '4px 8px',
                fontWeight: 600
              }}>
                {economyRate.toFixed(1)}% economizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Por Categoria */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>Detalhamento por Categoria</h3>
        {categoryStats.length > 0 ? (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th className="text-right">Valor</th>
                  <th>% do Total</th>
                  <th className="text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex-center gap-12" style={{ justifyContent: 'flex-start' }}>
                        <div className="category-icon-container" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          <CategoryIcon name={item.icon} size={14} />
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.type}`}>
                        {item.type === 'revenue' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className={item.type === 'revenue' ? 'positive-value' : 'negative-value'}>
                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          minWidth: '80px'
                        }}>
                          <div style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            height: '100%',
                            backgroundColor: item.type === 'revenue' ? 'var(--accent-green)' : 'var(--accent-red)',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '40px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {item.volume} {item.volume === 1 ? 'transação' : 'transações'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted gap-8" style={{ padding: '40px 0' }}>
            <AlertCircle size={16} />
            <span>Nenhuma transação registrada neste período.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsSection;
