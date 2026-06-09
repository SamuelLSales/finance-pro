import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Trash, 
  RefreshCw, 
  Save, 
  Check, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';

// Predefined available icons for categories
const PRESET_ICONS = [
  'DollarSign', 'Briefcase', 'BookOpen', 'Heart', 'Car', 
  'ShoppingBag', 'Compass', 'Home', 'HelpCircle', 'Gift', 
  'Target', 'Shield', 'Smartphone', 'Coffee', 'Plane', 'Activity'
];

// Predefined colors for categories
const PRESET_COLORS = [
  '#00D4AA', // Green
  '#FF4D6A', // Coral/Red
  '#6C63FF', // Purple
  '#F5A623', // Yellow/Orange
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#EF4444', // Red
  '#6B7280'  // Muted/Gray
];

export const SettingsSection = ({
  user,
  setUser,
  categories,
  setCategories,
  transactions,
  setTransactions,
  goals,
  setGoals,
  budgets,
  setBudgets,
  showToast,
  onDeleteAccount
}) => {
  // --- STATE FOR PROFILE ---
  const [profileName, setProfileName] = useState(user.name);
  const [profileCurrency, setProfileCurrency] = useState(user.currency);

  // --- STATE FOR CATEGORIES ---
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  
  // Category Form State (for both Add and Edit)
  const [catForm, setCatForm] = useState({
    name: '',
    color: '#6C63FF',
    icon: 'HelpCircle'
  });

  // --- STATE FOR DATA MANAGEMENT ---
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- HANDLERS ---
  
  // Save Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('O nome não pode estar em branco.', 'error');
      return;
    }
    const updatedUser = {
      ...user,
      name: profileName.trim(),
      currency: profileCurrency
    };
    setUser(updatedUser);
    showToast('Perfil atualizado com sucesso!', 'success');
  };

  // Start Adding Category
  const handleStartAdd = () => {
    setEditingCategoryId(null);
    setCatForm({
      name: '',
      color: '#6C63FF',
      icon: 'HelpCircle'
    });
    setIsAdding(true);
  };

  // Start Editing Category
  const handleStartEdit = (category) => {
    setIsAdding(false);
    setEditingCategoryId(category.id);
    setCatForm({
      name: category.name,
      color: category.color || '#6C63FF',
      icon: category.icon || 'HelpCircle'
    });
  };

  // Save Category (Create or Edit)
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showToast('O nome da categoria é obrigatório.', 'error');
      return;
    }

    if (editingCategoryId) {
      // Edit mode
      const updatedCategories = categories.map(c => {
        if (c.id === editingCategoryId) {
          return {
            ...c,
            name: catForm.name.trim(),
            color: catForm.color,
            icon: catForm.icon
          };
        }
        return c;
      });
      setCategories(updatedCategories);
      showToast('Categoria atualizada com sucesso!', 'success');
      setEditingCategoryId(null);
    } else {
      // Add mode
      const newId = catForm.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '_') // replace spaces/special chars with underscores
        .replace(/(^_+|_+$)/g, ''); // trim underscores

      // Check for duplicate ID
      if (categories.some(c => c.id === newId)) {
        showToast('Já existe uma categoria com este nome.', 'error');
        return;
      }

      const newCategory = {
        id: newId || 'cat_' + Date.now(),
        name: catForm.name.trim(),
        color: catForm.color,
        icon: catForm.icon
      };

      setCategories([...categories, newCategory]);
      showToast('Categoria criada com sucesso!', 'success');
      setIsAdding(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = (catId) => {
    if (catId === 'outros') {
      showToast('A categoria "Outros" não pode ser excluída.', 'error');
      return;
    }

    // Confirm deletion logic
    if (confirm(`Tem certeza que deseja excluir a categoria "${categories.find(c => c.id === catId)?.name}"?`)) {
      // Remove from categories list
      setCategories(categories.filter(c => c.id !== catId));

      // Reassign transactions referencing this category to 'outros'
      const updatedTransactions = transactions.map(t => {
        if (t.category === catId) {
          return { ...t, category: 'outros' };
        }
        return t;
      });
      setTransactions(updatedTransactions);

      // Reassign goals referencing this category to 'outros'
      const updatedGoals = goals.map(g => {
        if (g.category === catId) {
          return { ...g, category: 'outros' };
        }
        return g;
      });
      setGoals(updatedGoals);

      // Remove from budgets limits
      setBudgets(budgets.filter(b => b.category !== catId));

      showToast('Categoria excluída. Transações e metas migradas para "Outros".', 'info');
    }
  };

  // Export all data to JSON
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({
          user,
          categories,
          transactions,
          goals,
          budgets
        }, null, 2)
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `financaspro_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup exportado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao exportar dados.', 'error');
    }
  };

  // Clear all data (Reset to initial)
  const handleClearData = () => {
    if (user && user.email) {
      const email = user.email.toLowerCase();
      localStorage.removeItem(`finance-pro-categories-${email}`);
      localStorage.removeItem(`finance-pro-transactions-${email}`);
      localStorage.removeItem(`finance-pro-goals-${email}`);
      localStorage.removeItem(`finance-pro-budgets-${email}`);
    }
    
    // Also remove global authenticated/user session
    localStorage.removeItem('finance-pro-user');
    localStorage.removeItem('finance-pro-authenticated');
    
    // Clear and reload
    showToast('Todos os dados foram resetados.', 'success');
    setIsClearModalOpen(false);
    
    // Force page reload to re-read initial state from mockData
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fade-in font-sans">
      <div className="section-header">
        <div>
          <h1 className="font-heading">Configurações</h1>
          <p className="text-muted font-body">Gerencie suas preferências de perfil, categorias de gastos e backup do sistema</p>
        </div>
      </div>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* LEFT COLUMN: Profile & Data Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Perfil */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <User size={20} style={{ color: 'var(--accent-purple)' }} />
              <h2 className="font-heading" style={{ fontSize: '18px', margin: 0 }}>Perfil do Usuário</h2>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>Nome Completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Nome do Usuário"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>Email (Apenas Leitura)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#13151D', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>Moeda Padrão</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                  <select 
                    className="input-field" 
                    value={profileCurrency}
                    onChange={(e) => setProfileCurrency(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="BRL">Real Brasileiro (BRL - R$)</option>
                    <option value="USD">Dólar Americano (USD - $)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                <Save size={16} />
                <span>Salvar Alterações</span>
              </button>
            </form>
          </div>

          {/* Card: Dados */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <RefreshCw size={20} style={{ color: 'var(--accent-purple)' }} />
              <h2 className="font-heading" style={{ fontSize: '18px', margin: 0 }}>Dados do Sistema</h2>
            </div>

            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              Exporte seus registros locais para segurança ou limpe todas as informações armazenadas para começar do zero.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={handleExportJSON} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500 }}>
                <Download size={16} />
                <span>Exportar Tudo (JSON)</span>
              </button>

              <button 
                onClick={() => setIsClearModalOpen(true)} 
                className="btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--accent-red)', background: 'transparent', cursor: 'pointer', color: 'var(--accent-red)', fontWeight: 500 }}
              >
                <Trash size={16} />
                <span>Limpar Dados</span>
              </button>
            </div>
          </div>

          {/* Card: Excluir Conta */}
          <div className="card" style={{ border: '1px solid rgba(255, 77, 106, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Trash2 size={20} style={{ color: 'var(--accent-red)' }} />
              <h2 className="font-heading" style={{ fontSize: '18px', margin: 0, color: 'var(--accent-red)' }}>Excluir Conta</h2>
            </div>

            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              A exclusão da conta é permanente e removerá todo o seu perfil, transações, metas e configurações do navegador.
            </p>

            {user.email === 'samuel.lima21287@gmail.com' ? (
              <span className="text-muted" style={{ fontSize: '12px', display: 'block', fontStyle: 'italic' }}>
                A conta padrão de demonstração não pode ser excluída.
              </span>
            ) : (
              <button 
                onClick={() => setIsDeleteModalOpen(true)} 
                className="btn-secondary" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '10px 16px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--accent-red)', 
                  background: 'transparent', 
                  cursor: 'pointer', 
                  color: 'var(--accent-red)', 
                  fontWeight: 500 
                }}
              >
                <Trash2 size={16} />
                <span>Excluir Minha Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Categories CRUD */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CategoryIcon name="Grid" size={20} style={{ color: 'var(--accent-purple)' }} />
              <h2 className="font-heading" style={{ fontSize: '18px', margin: 0 }}>Categorias</h2>
            </div>
            {!isAdding && !editingCategoryId && (
              <button onClick={handleStartAdd} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} />
                <span>Nova Categoria</span>
              </button>
            )}
          </div>

          {/* Form for Add/Edit Category */}
          {(isAdding || editingCategoryId) && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
              <h3 className="font-heading" style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</span>
                <button 
                  onClick={() => { setIsAdding(false); setEditingCategoryId(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </h3>

              <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Nome da Categoria</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="Ex: Assinaturas, Presentes..."
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Cor do Destaque</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, color: c })}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: catForm.color === c ? '2px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                          transform: catForm.color === c ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 100ms ease'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Ícone Representativo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', maxHeight: '100px', overflowY: 'auto', padding: '6px', background: '#161821', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    {PRESET_ICONS.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, icon: iconName })}
                        className={`icon-selector-btn ${catForm.icon === iconName ? 'active' : ''}`}
                        style={{
                          padding: '6px',
                          background: catForm.icon === iconName ? 'rgba(108, 99, 255, 0.2)' : 'transparent',
                          border: catForm.icon === iconName ? '1px solid var(--accent-purple)' : '1px solid transparent',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: catForm.icon === iconName ? 'var(--text-primary)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={iconName}
                      >
                        <CategoryIcon name={iconName} size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    <Check size={14} />
                    <span>Salvar</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => { setIsAdding(false); setEditingCategoryId(null); }}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="category-settings-row"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border)', 
                  background: 'rgba(255,255,255,0.01)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '6px', 
                      backgroundColor: `${cat.color}15`, 
                      color: cat.color, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: `1px solid ${cat.color}30`
                    }}
                  >
                    <CategoryIcon name={cat.icon} size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>id: {cat.id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleStartEdit(cat)}
                    className="action-btn edit-btn" 
                    title="Editar Categoria"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="action-btn delete-btn" 
                    disabled={cat.id === 'outros'}
                    style={cat.id === 'outros' ? { cursor: 'not-allowed', opacity: 0.3 } : {}}
                    title={cat.id === 'outros' ? 'Não é possível excluir esta categoria' : 'Excluir Categoria'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONFIRM CLEAR DATA MODAL */}
      {isClearModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)', marginBottom: '16px' }}>
              <AlertTriangle size={24} />
              <h3 className="modal-title font-heading" style={{ fontSize: '18px' }}>Cuidado: Ação Destrutiva!</h3>
            </div>
            
            <p className="text-muted font-sans" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              Você está prestes a apagar permanentemente todas as suas transações, metas, limites de orçamento e preferências salvas no navegador. Essa ação <strong>não pode ser desfeita</strong>.
            </p>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="btn-secondary"
              >
                Voltar
              </button>
              
              <button 
                type="button"
                onClick={handleClearData} 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--accent-red)', color: '#FFFFFF' }}
              >
                Confirmar e Resetar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ACCOUNT MODAL */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px', width: '90%', border: '1px solid var(--accent-red)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)', marginBottom: '16px' }}>
              <AlertTriangle size={24} />
              <h3 className="modal-title font-heading" style={{ fontSize: '18px' }}>Excluir Conta Permanentemente?</h3>
            </div>
            
            <p className="text-muted font-sans" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              Você está prestes a excluir sua conta <strong>{user.email}</strong>. 
              Todas as suas transações, metas e orçamentos serão excluídos de forma definitiva do seu navegador.
              Esta ação <strong>não poderá ser desfeita</strong>.
            </p>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  onDeleteAccount(user.email);
                  setIsDeleteModalOpen(false);
                }} 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--accent-red)', color: '#FFFFFF' }}
              >
                Sim, Excluir Minha Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSection;
