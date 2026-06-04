import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Target, 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  AlertCircle,
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  X,
  Shield,
  Plane,
  Laptop,
  Award,
  Car,
  Home,
  Gift,
  PiggyBank,
  Heart,
  Tv,
  Coffee,
  Check
} from 'lucide-react';
import CountUp from './CountUp';
import CategoryIcon from './CategoryIcon';

// Predefined icons list for goals
const GOAL_ICONS = [
  { value: 'Shield', label: 'Segurança / Reserva', icon: Shield },
  { value: 'Plane', label: 'Viagem / Férias', icon: Plane },
  { value: 'Laptop', label: 'Tecnologia / Trabalho', icon: Laptop },
  { value: 'Award', label: 'Educação / Conquista', icon: Award },
  { value: 'Car', label: 'Automóvel / Transporte', icon: Car },
  { value: 'Home', label: 'Imóvel / Moradia', icon: Home },
  { value: 'Gift', label: 'Presentes / Lazer', icon: Gift },
  { value: 'PiggyBank', label: 'Poupança / Investimento', icon: PiggyBank },
  { value: 'Heart', label: 'Saúde / Bem-estar', icon: Heart },
  { value: 'Tv', label: 'Entretenimento / Eletrônicos', icon: Tv },
  { value: 'Coffee', label: 'Outros / Dia a Dia', icon: Coffee }
];

export const GoalsBudgetsSection = ({
  goals,
  setGoals,
  budgets,
  setBudgets,
  categories,
  transactions,
  showToast,
  activeSubTab,
  setActiveSubTab
}) => {
  // --- GOALS LOGIC & MODALS ---
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalIcon, setGoalIcon] = useState('PiggyBank');

  // Form validation error
  const [validationError, setValidationError] = useState('');

  // Handle open modal for new goal
  const handleOpenNewGoalModal = () => {
    setSelectedGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalDeadline('');
    // Default to first expense category
    const expenseCats = categories.filter(c => c.id !== 'salario' && c.id !== 'freelance');
    setGoalCategory(expenseCats[0]?.id || 'outros');
    setGoalIcon('PiggyBank');
    setValidationError('');
    setIsGoalModalOpen(true);
  };

  // Handle open modal for edit goal
  const handleOpenEditGoalModal = (goal) => {
    setSelectedGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.target.toString());
    setGoalCurrent(goal.current.toString());
    setGoalDeadline(goal.deadline);
    setGoalCategory(goal.category);
    setGoalIcon(goal.icon || 'PiggyBank');
    setValidationError('');
    setIsGoalModalOpen(true);
  };

  // Handle save goal
  const handleSaveGoal = (e) => {
    e.preventDefault();
    setValidationError('');

    // Validations
    if (!goalName.trim()) {
      setValidationError('O nome da meta é obrigatório.');
      return;
    }
    const targetVal = parseFloat(goalTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      setValidationError('O valor alvo deve ser maior que zero.');
      return;
    }
    const currentVal = parseFloat(goalCurrent);
    if (isNaN(currentVal) || currentVal < 0) {
      setValidationError('O valor atual não pode ser negativo.');
      return;
    }
    if (!goalDeadline) {
      setValidationError('O prazo da meta é obrigatório.');
      return;
    }

    if (selectedGoal) {
      // Edit mode
      setGoals(prev => prev.map(g => g.id === selectedGoal.id ? {
        ...g,
        name: goalName.trim(),
        target: targetVal,
        current: currentVal,
        deadline: goalDeadline,
        category: goalCategory,
        icon: goalIcon
      } : g));
      showToast('Meta atualizada com sucesso!', 'success');
    } else {
      // Create mode
      const newGoal = {
        id: `g-${Date.now()}`,
        name: goalName.trim(),
        target: targetVal,
        current: currentVal,
        deadline: goalDeadline,
        category: goalCategory,
        icon: goalIcon
      };
      setGoals(prev => [...prev, newGoal]);
      showToast('Meta criada com sucesso!', 'success');
    }

    setIsGoalModalOpen(false);
  };

  // Handle delete click
  const handleDeleteClick = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedGoal) {
      setGoals(prev => prev.filter(g => g.id !== selectedGoal.id));
      showToast('Meta excluída com sucesso!', 'warning');
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
    }
  };

  // Calculate goal status
  const getGoalStatus = (goal) => {
    const percentage = (goal.current / goal.target) * 100;
    if (percentage >= 100) return { label: 'Concluída', type: 'success' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(goal.deadline + 'T23:59:59');

    if (today > deadlineDate) {
      return { label: 'Atrasada', type: 'error' };
    }

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Status warning if deadline is in 30 days and progress is below 70%
    if (diffDays <= 30 && percentage < 70) {
      return { label: 'Atenção', type: 'warning' };
    }

    return { label: 'Em dia', type: 'success' };
  };

  // Color helper for progress bar
  const getGoalBarColor = (percentage) => {
    if (percentage >= 70) return 'var(--accent-green)';
    if (percentage >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  // --- BUDGETS LOGIC ---
  // Identify the latest month in transactions to set as the current active budget month
  const currentMonthStr = useMemo(() => {
    if (transactions.length === 0) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].date.slice(0, 7);
  }, [transactions]);

  // Aggregate current month's expenses per category
  const categoryExpenses = useMemo(() => {
    const expenses = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.date.startsWith(currentMonthStr)) {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      }
    });
    return expenses;
  }, [transactions, currentMonthStr]);

  // Filter only categories of type "expense" (i.e. not salario or freelance)
  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.id !== 'salario' && c.id !== 'freelance');
  }, [categories]);

  // Build the complete list of budgets (combining saved settings and expense categories)
  const budgetsList = useMemo(() => {
    return expenseCategories.map(cat => {
      const b = budgets.find(x => x.category === cat.id);
      const limit = b ? b.limit : 0;
      const spent = categoryExpenses[cat.id] || 0;
      const available = limit - spent;
      
      let status = 'OK';
      let statusType = 'success';
      if (spent > limit) {
        status = 'Excedido';
        statusType = 'error';
      } else if (limit > 0 && spent > limit * 0.7) {
        status = 'Atenção';
        statusType = 'warning';
      }

      const progress = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        category: cat,
        limit,
        spent,
        available,
        status,
        statusType,
        progress
      };
    });
  }, [expenseCategories, budgets, categoryExpenses]);

  // Totals for Budgets Tab
  const budgetSummary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    let exceededCount = 0;

    budgetsList.forEach(b => {
      totalLimit += b.limit;
      totalSpent += b.spent;
      if (b.spent > b.limit && b.limit > 0) {
        exceededCount += 1;
      }
    });

    return {
      totalLimit,
      totalSpent,
      exceededCount
    };
  }, [budgetsList]);

  // Inline edit state
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const inlineInputRef = useRef(null);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingCategoryId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingCategoryId]);

  const handleStartInlineEdit = (catId, currentVal) => {
    setEditingCategoryId(catId);
    setEditingValue(currentVal.toString());
  };

  const handleSaveInlineEdit = (catId) => {
    const val = parseFloat(editingValue);
    if (isNaN(val) || val < 0) {
      showToast('Por favor, digite um valor numérico válido maior ou igual a zero.', 'error');
      return;
    }

    const budgetExists = budgets.some(b => b.category === catId);
    let updated;
    if (budgetExists) {
      updated = budgets.map(b => b.category === catId ? { ...b, limit: val } : b);
    } else {
      updated = [...budgets, { category: catId, limit: val }];
    }

    setBudgets(updated);
    setEditingCategoryId(null);
    showToast('Orçamento atualizado!', 'success');
  };

  const handleKeyDown = (e, catId) => {
    if (e.key === 'Enter') {
      handleSaveInlineEdit(catId);
    } else if (e.key === 'Escape') {
      setEditingCategoryId(null);
    }
  };

  return (
    <div className="section-container">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Metas & Orçamentos</h2>
          <p className="section-subtitle">Acompanhe seus limites de gastos por categoria e seus objetivos de poupança</p>
        </div>
        <div>
          {activeSubTab === 'goals' && (
            <button className="btn btn-primary flex-center gap-8" onClick={handleOpenNewGoalModal}>
              <Plus size={16} />
              <span>Nova Meta</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="subtabs-container">
        <button 
          className={`subtab-btn ${activeSubTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('goals')}
        >
          <Target size={16} />
          <span>Objetivos & Metas</span>
        </button>
        <button 
          className={`subtab-btn ${activeSubTab === 'budgets' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('budgets')}
        >
          <DollarSign size={16} />
          <span>Planejamento Orçamentário</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: GOALS
          ========================================== */}
      {activeSubTab === 'goals' && (
        <div>
          {goals.length === 0 ? (
            <div className="card flex-center flex-column text-muted" style={{ padding: '60px 0', gap: '16px' }}>
              <Target size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <div className="text-center">
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhuma meta cadastrada</h4>
                <p style={{ fontSize: '13px' }}>Defina seus objetivos para manter o foco nas suas economias.</p>
              </div>
              <button className="btn btn-primary flex-center gap-8" onClick={handleOpenNewGoalModal}>
                <Plus size={16} />
                <span>Criar primeira meta</span>
              </button>
            </div>
          ) : (
            <div className="goals-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px'
            }}>
              {goals.map(goal => {
                const percentage = Math.min(100, goal.target > 0 ? (goal.current / goal.target) * 100 : 0);
                const barColor = getGoalBarColor(percentage);
                const status = getGoalStatus(goal);
                
                // Format deadline for reading (pt-BR)
                const [y, m, d] = goal.deadline.split('-');
                const formattedDeadline = `${d}/${m}/${y}`;

                return (
                  <div className="card flex-column justify-between goal-box-card" key={goal.id}>
                    <div>
                      {/* Top Header of Goal Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="category-icon-container" style={{ 
                            backgroundColor: 'rgba(108, 99, 255, 0.08)', 
                            color: 'var(--accent-purple)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px'
                          }}>
                            <CategoryIcon name={goal.icon || 'PiggyBank'} size={20} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{goal.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <Calendar size={12} className="text-muted" />
                              <span className="text-muted" style={{ fontSize: '11px' }}>Prazo: {formattedDeadline}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`badge badge-${status.type}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Goal Values */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', marginTop: '8px' }}>
                        <div>
                          <span className="text-muted" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Acumulado</span>
                          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                            R$ {goal.current.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="text-muted" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Objetivo</span>
                          <span className="text-primary" style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            R$ {goal.target.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span className="text-muted">Progresso geral</span>
                          <span style={{ color: barColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{percentage.toFixed(0)}%</span>
                        </div>
                        <div style={{
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: barColor,
                            borderRadius: '4px',
                            transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: '8px', 
                      borderTop: '1px solid var(--border)',
                      paddingTop: '12px',
                      marginTop: '12px'
                    }}>
                      <button 
                        className="btn-action flex-center" 
                        onClick={() => handleOpenEditGoalModal(goal)}
                        title="Editar Meta"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn-action flex-center delete" 
                        onClick={() => handleDeleteClick(goal)}
                        title="Excluir Meta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: BUDGETS
          ========================================== */}
      {activeSubTab === 'budgets' && (
        <div className="flex-column" style={{ gap: '24px' }}>
          
          {/* Summary Cards */}
          <div className="kpis-grid">
            {/* KPI 1: Total Orçado */}
            <div className="card kpi-card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
              <div className="kpi-header">
                <span className="kpi-label">Total Orçado</span>
                <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-purple)', backgroundColor: 'rgba(108, 99, 255, 0.08)' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="kpi-value text-primary">
                R$ <CountUp value={budgetSummary.totalLimit} />
              </div>
              <div className="kpi-trend">
                Planejamento mensal
              </div>
            </div>

            {/* KPI 2: Total Gasto */}
            <div className="card kpi-card" style={{ borderLeft: '3px solid var(--accent-yellow)' }}>
              <div className="kpi-header">
                <span className="kpi-label">Total Gasto (Este Mês)</span>
                <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-yellow)', backgroundColor: 'rgba(245, 166, 35, 0.08)' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="kpi-value text-primary" style={{ color: budgetSummary.totalSpent > budgetSummary.totalLimit ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                R$ <CountUp value={budgetSummary.totalSpent} />
              </div>
              <div className="kpi-trend">
                Competência: {getLongMonthName(currentMonthStr)}
              </div>
            </div>

            {/* KPI 3: Categorias Excedidas */}
            <div className="card kpi-card" style={{ borderLeft: `3px solid ${budgetSummary.exceededCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}` }}>
              <div className="kpi-header">
                <span className="kpi-label">Orçamentos Excedidos</span>
                <div className="kpi-icon-wrapper" style={{ 
                  color: budgetSummary.exceededCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)', 
                  backgroundColor: budgetSummary.exceededCount > 0 ? 'rgba(255, 77, 106, 0.08)' : 'rgba(0, 212, 170, 0.08)' 
                }}>
                  <AlertCircle size={16} />
                </div>
              </div>
              <div className="kpi-value text-primary">
                <CountUp value={budgetSummary.exceededCount} decimals={0} />
              </div>
              <div className="kpi-trend" style={{ color: budgetSummary.exceededCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {budgetSummary.exceededCount === 1 ? '1 categoria estourou' : `${budgetSummary.exceededCount} categorias estouraram`}
              </div>
            </div>
          </div>

          {/* Budgets Table Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title">Orçamentos por Categoria</h3>
                <p className="section-subtitle" style={{ margin: '4px 0 0 0', padding: 0 }}>
                  Dica: Dê um duplo clique ou clique no valor na coluna <strong style={{ color: 'var(--accent-purple)' }}>Orçado (R$)</strong> para alterá-lo rapidamente.
                </p>
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                Mês: {currentMonthStr}
              </span>
            </div>

            <div className="table-responsive">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Orçado (R$)</th>
                    <th className="text-right">Gasto (R$)</th>
                    <th className="text-right">Disponível</th>
                    <th>Status</th>
                    <th>Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetsList.map((b) => {
                    const isEditing = editingCategoryId === b.category.id;

                    return (
                      <tr key={b.category.id} className="budget-row-hover">
                        {/* Column 1: Category Name */}
                        <td>
                          <div className="flex-center gap-12" style={{ justifyContent: 'flex-start' }}>
                            <div className="category-icon-container" style={{ backgroundColor: `${b.category.color}15`, color: b.category.color }}>
                              <CategoryIcon name={b.category.icon} size={14} />
                            </div>
                            <span style={{ fontWeight: 500 }}>{b.category.name}</span>
                          </div>
                        </td>

                        {/* Column 2: Orçado (R$) with Inline Edit */}
                        <td style={{ minWidth: '160px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>R$</span>
                              <input
                                ref={inlineInputRef}
                                type="number"
                                className="input-field"
                                style={{ 
                                  padding: '4px 8px', 
                                  height: '28px', 
                                  width: '80px',
                                  fontSize: '13px',
                                  margin: 0,
                                  fontFamily: 'var(--font-mono)'
                                }}
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, b.category.id)}
                                onBlur={() => handleSaveInlineEdit(b.category.id)}
                              />
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: 0, width: '24px', height: '24px', borderRadius: '4px' }}
                                onMouseDown={(e) => {
                                  // Prevent blur from firing before save
                                  e.preventDefault(); 
                                  handleSaveInlineEdit(b.category.id);
                                }}
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="inline-budget-edit-cell"
                              onClick={() => handleStartInlineEdit(b.category.id, b.limit)}
                              title="Clique para editar"
                            >
                              <span style={{ fontFamily: 'var(--font-mono)' }}>
                                R$ {b.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <Edit2 size={10} className="edit-cell-icon" />
                            </div>
                          )}
                        </td>

                        {/* Column 3: Gasto (R$) */}
                        <td className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                          R$ {b.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Column 4: Disponível */}
                        <td className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                          <span className={b.available >= 0 ? "positive-value" : "negative-value"}>
                            {b.available < 0 ? '-' : ''} R$ {Math.abs(b.available).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Column 5: Status Badge */}
                        <td>
                          <span className={`badge badge-${b.statusType}`}>
                            {b.status}
                          </span>
                        </td>

                        {/* Column 6: Inline Progress Bar */}
                        <td style={{ width: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              minWidth: '70px'
                            }}>
                              <div style={{
                                width: `${Math.min(100, b.progress)}%`,
                                height: '100%',
                                backgroundColor: b.status === 'OK' ? 'var(--accent-green)' : b.status === 'Atenção' ? 'var(--accent-yellow)' : 'var(--accent-red)',
                                borderRadius: '3px'
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '40px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {b.progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS SECTION
          ========================================== */}
      
      {/* Modal 1: New / Edit Goal */}
      {isGoalModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGoalModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">
                {selectedGoal ? 'Editar Objetivo' : 'Novo Objetivo / Meta'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsGoalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveGoal}>
              <div className="modal-body">
                {validationError && (
                  <div className="error-banner flex-center gap-8" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="filter-label">Nome da Meta</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: Reserva de Emergência, Comprar Carro"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    required
                  />
                </div>

                <div className="filters-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="filter-label">Valor Alvo (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="input-field" 
                      placeholder="5000"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="filter-label">Valor Atual Guardado (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="input-field" 
                      placeholder="0"
                      value={goalCurrent}
                      onChange={(e) => setGoalCurrent(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="filters-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="filter-label">Prazo Limite</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="filter-label">Categoria Correspondente</label>
                    <select 
                      className="input-field select-field" 
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value)}
                    >
                      {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="filter-label">Ícone de Identificação</label>
                  <select 
                    className="input-field select-field" 
                    value={goalIcon}
                    onChange={(e) => setGoalIcon(e.target.value)}
                  >
                    {GOAL_ICONS.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsGoalModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedGoal ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Delete Goal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading" style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                <span>Excluir Meta</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
                Tem certeza de que deseja excluir a meta <strong style={{ color: 'var(--text-primary)' }}>"{selectedGoal?.name}"</strong>?
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Esta ação é irreversível e removerá permanentemente o acompanhamento do progresso deste objetivo.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--accent-red)', color: '#FFFFFF' }} onClick={handleConfirmDelete}>
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for long month name
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

export default GoalsBudgetsSection;
