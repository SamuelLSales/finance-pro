import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Calendar,
  Layers,
  ArrowLeftRight,
  AlertTriangle
} from 'lucide-react';
import CountUp from './CountUp';
import CategoryIcon from './CategoryIcon';

export const TransactionsSection = ({
  transactions,
  setTransactions,
  categories,
  showToast
}) => {
  // --- STATE FOR FILTERS ---
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // --- STATE FOR SORTING ---
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // --- STATE FOR PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE FOR TRANSACTION MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState({});

  // --- STATE FOR CONFIRM EXCLUSION MODAL ---
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Set default category when modal opens in create mode
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].id);
    }
  }, [categories, category]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterType, filterCategory, filterStartDate, filterEndDate]);

  // --- FILTERING LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Search text
      if (filterText && !tx.description.toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }
      // 2. Type
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }
      // 3. Category
      if (filterCategory !== 'all' && tx.category !== filterCategory) {
        return false;
      }
      // 4. Start Date
      if (filterStartDate && tx.date < filterStartDate) {
        return false;
      }
      // 5. End Date
      if (filterEndDate && tx.date > filterEndDate) {
        return false;
      }
      return true;
    });
  }, [transactions, filterText, filterType, filterCategory, filterStartDate, filterEndDate]);

  // --- SORTING LOGIC ---
  const sortedTransactions = useMemo(() => {
    let items = [...filteredTransactions];
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Customize sorting for categories (by name, not ID)
        if (sortConfig.key === 'category') {
          const catA = categories.find(c => c.id === a.category)?.name || '';
          const catB = categories.find(c => c.id === b.category)?.name || '';
          aVal = catA;
          bVal = catB;
        }

        // Handle case-insensitive string sorting for description
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [filteredTransactions, sortConfig, categories]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage]);

  // --- STATS LOGIC (FILTERED) ---
  const stats = useMemo(() => {
    let revenueSum = 0;
    let expenseSum = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'revenue') {
        revenueSum += tx.amount;
      } else {
        expenseSum += tx.amount;
      }
    });

    return {
      revenue: revenueSum,
      expense: expenseSum,
      balance: revenueSum - expenseSum
    };
  }, [filteredTransactions]);

  // --- SORT TRIGGER ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- RESET ALL FILTERS ---
  const handleClearFilters = () => {
    setFilterText('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterStartDate('');
    setFilterEndDate('');
    showToast('Filtros limpos ✓', 'info');
  };

  // --- MODAL OPENERS ---
  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory(categories[0]?.id || '');
    // Default date as local ISO format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setModalMode('edit');
    setEditingId(tx.id);
    setDescription(tx.description);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setDate(tx.date);
    setErrors({});
    setIsModalOpen(true);
  };

  // --- SAVE TRANSACTION ---
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    
    // Validation
    const tempErrors = {};
    if (!description.trim()) tempErrors.description = 'Descrição é obrigatória';
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      tempErrors.amount = 'Valor deve ser maior que 0';
    }
    
    if (!date) tempErrors.date = 'Data é obrigatória';
    if (!category) tempErrors.category = 'Categoria é obrigatória';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      showToast('Por favor, preencha os campos obrigatórios', 'error');
      return;
    }

    if (modalMode === 'create') {
      const newTx = {
        id: `t_${Date.now()}`,
        description: description.trim(),
        amount: parsedAmount,
        type,
        category,
        date
      };
      setTransactions([newTx, ...transactions]);
      showToast('Transação criada com sucesso ✓');
    } else {
      setTransactions(transactions.map(tx => {
        if (tx.id === editingId) {
          return {
            ...tx,
            description: description.trim(),
            amount: parsedAmount,
            type,
            category,
            date
          };
        }
        return tx;
      }));
      showToast('Transação salva com sucesso ✓');
    }

    setIsModalOpen(false);
  };

  // --- DELETE TRANSACTION TRIGGER & CONFIRM ---
  const handleDeleteClick = (tx) => {
    setTransactionToDelete(tx);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
      showToast('Transação excluída', 'info');
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="section-container animate-fade-in">
      {/* 1. Header Section */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="section-title">Transações</h2>
          <p className="section-subtitle font-sans">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <PlusCircle size={18} />
          Nova Transação
        </button>
      </div>

      {/* 2. Mini KPI Cards (Filtered Stats) */}
      <div className="kpis-grid" style={{ marginBottom: '24px' }}>
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="kpi-header">
            <span className="font-sans" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>RECEITAS FILTRADAS</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-green)', backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: 'var(--accent-green)', fontSize: '24px', marginTop: '8px' }}>
            R$ <CountUp value={stats.revenue} />
          </div>
        </div>

        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <div className="kpi-header">
            <span className="font-sans" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>DESPESAS FILTRADAS</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-red)', backgroundColor: 'rgba(255, 77, 106, 0.1)' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: 'var(--accent-red)', fontSize: '24px', marginTop: '8px' }}>
            R$ <CountUp value={stats.expense} />
          </div>
        </div>

        <div className="card kpi-card" style={{ borderLeft: `4px solid ${stats.balance >= 0 ? 'var(--accent-purple)' : 'var(--accent-red)'}` }}>
          <div className="kpi-header">
            <span className="font-sans" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>SALDO FILTRADO</span>
            <div className="kpi-icon-wrapper" style={{ color: stats.balance >= 0 ? 'var(--accent-purple)' : 'var(--accent-red)', backgroundColor: stats.balance >= 0 ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 77, 106, 0.1)' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="kpi-value font-mono" style={{ color: stats.balance >= 0 ? 'var(--accent-purple)' : 'var(--accent-red)', fontSize: '24px', marginTop: '8px' }}>
            {stats.balance < 0 ? '-' : ''} R$ <CountUp value={Math.abs(stats.balance)} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="card filters-container font-sans" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-item">
            <label className="filter-label">Buscar por descrição</label>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Buscar..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Type */}
          <div className="filter-item">
            <label className="filter-label">Tipo</label>
            <select 
              className="input-field select-field" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="revenue">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          {/* Category */}
          <div className="filter-item">
            <label className="filter-label">Categoria</label>
            <select 
              className="input-field select-field" 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-item">
            <label className="filter-label">De</label>
            <div className="date-input-wrapper">
              <Calendar className="date-icon" size={14} />
              <input 
                type="date" 
                className="input-field" 
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          {/* End Date */}
          <div className="filter-item">
            <label className="filter-label">Até</label>
            <div className="date-input-wrapper">
              <Calendar className="date-icon" size={14} />
              <input 
                type="date" 
                className="input-field" 
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
            </div>
          </div>

          {/* Clear Button */}
          <div className="filter-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn-secondary" 
              onClick={handleClearFilters}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transactions Table Card */}
      <div className="card table-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="transactions-table font-sans">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className="sortable-header">
                  <div className="header-cell-content">
                    Data 
                    <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === 'date' ? 'active' : ''}`} />
                  </div>
                </th>
                <th onClick={() => handleSort('description')} className="sortable-header">
                  <div className="header-cell-content">
                    Descrição 
                    <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === 'description' ? 'active' : ''}`} />
                  </div>
                </th>
                <th onClick={() => handleSort('category')} className="sortable-header">
                  <div className="header-cell-content">
                    Categoria 
                    <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === 'category' ? 'active' : ''}`} />
                  </div>
                </th>
                <th onClick={() => handleSort('type')} className="sortable-header" style={{ width: '120px' }}>
                  <div className="header-cell-content">
                    Tipo 
                    <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === 'type' ? 'active' : ''}`} />
                  </div>
                </th>
                <th onClick={() => handleSort('amount')} className="sortable-header text-right">
                  <div className="header-cell-content justify-end">
                    Valor 
                    <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === 'amount' ? 'active' : ''}`} />
                  </div>
                </th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map(tx => {
                  const catObj = categories.find(c => c.id === tx.category) || {};
                  const catColor = catObj.color || 'var(--text-muted)';
                  const catIcon = catObj.icon || 'HelpCircle';
                  const catName = catObj.name || tx.category;

                  return (
                    <tr key={tx.id}>
                      <td className="font-mono text-muted" style={{ fontSize: '13px' }}>
                        {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="font-sans text-primary font-weight-500" style={{ fontWeight: '500' }}>
                        {tx.description}
                      </td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: `${catColor}15`, 
                            color: catColor,
                            border: `1px solid ${catColor}30`,
                            fontSize: '11px'
                          }}
                        >
                          <CategoryIcon name={catIcon} size={11} style={{ marginRight: '4px' }} />
                          {catName}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: tx.type === 'revenue' ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 77, 106, 0.15)',
                            color: tx.type === 'revenue' ? 'var(--accent-green)' : 'var(--accent-red)'
                          }}
                        >
                          {tx.type === 'revenue' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`font-mono text-right ${tx.type === 'revenue' ? 'positive-value' : 'negative-value'}`} style={{ fontWeight: '600' }}>
                        {tx.type === 'revenue' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => openEditModal(tx)}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDeleteClick(tx)}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div className="empty-state font-sans" style={{ border: 'none', padding: '0px' }}>
                      <ArrowLeftRight size={36} className="text-muted" style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p className="text-primary font-weight-500" style={{ fontWeight: '500', fontSize: '15px' }}>Nenhuma transação encontrada</p>
                      <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Tente alterar os filtros ou adicione uma nova transação.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        {sortedTransactions.length > 0 && (
          <div className="table-pagination font-sans">
            <div className="pagination-info text-muted" style={{ fontSize: '13px' }}>
              Mostrando <span className="text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-primary">{Math.min(currentPage * itemsPerPage, sortedTransactions.length)}</span> de <span className="text-primary">{sortedTransactions.length}</span> registros
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-secondary pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="pagination-indicator font-mono" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button 
                className="btn-secondary pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Transaction Edit/Create Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card animate-fade-in font-sans" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">
                {modalMode === 'create' ? 'Nova Transação' : 'Editar Transação'}
              </h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="modal-form">
              {/* Description */}
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <input 
                  type="text"
                  className={`input-field ${errors.description ? 'input-error' : ''}`}
                  placeholder="Ex: Supermercado Semanal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              {/* Amount & Date */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Valor (R$) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`input-field font-mono ${errors.amount ? 'input-error' : ''}`}
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && <span className="error-message">{errors.amount}</span>}
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Data *</label>
                  <input 
                    type="date"
                    className={`input-field font-mono ${errors.date ? 'input-error' : ''}`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
              </div>

              {/* Type Switcher */}
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <div className="type-toggle-group">
                  <label className={`type-toggle-item ${type === 'expense' ? 'active-expense' : ''}`}>
                    <input 
                      type="radio" 
                      name="tx-type" 
                      value="expense" 
                      checked={type === 'expense'} 
                      onChange={() => setType('expense')} 
                    />
                    <TrendingDown size={14} />
                    Despesa
                  </label>
                  <label className={`type-toggle-item ${type === 'revenue' ? 'active-revenue' : ''}`}>
                    <input 
                      type="radio" 
                      name="tx-type" 
                      value="revenue" 
                      checked={type === 'revenue'} 
                      onChange={() => setType('revenue')} 
                    />
                    <TrendingUp size={14} />
                    Receita
                  </label>
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Categoria *</label>
                <select 
                  className={`input-field select-field ${errors.category ? 'input-error' : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              {/* Footer Buttons */}
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Confirm Delete Modal Overlay */}
      {transactionToDelete && (
        <div className="modal-overlay">
          <div className="modal-content card animate-fade-in font-sans" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="confirm-delete-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255, 77, 106, 0.1)', color: 'var(--accent-red)', display: 'flex' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="modal-title font-heading" style={{ fontSize: '18px' }}>Confirmar Exclusão</h3>
            </div>
            <p className="text-muted font-sans" style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Tem certeza que deseja excluir a transação <strong>"{transactionToDelete.description}"</strong> de valor <strong>R$ {transactionToDelete.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setTransactionToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--accent-red)', color: '#FFFFFF' }}
                onClick={confirmDelete}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;
