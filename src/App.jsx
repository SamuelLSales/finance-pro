import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  FileText, 
  Target, 
  PieChart, 
  Settings, 
  Sun, 
  Moon, 
  Menu, 
  X,
  PlusCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertOctagon,
  Info,
  LogOut
} from 'lucide-react';
import { 
  initialUser, 
  initialCategories, 
  initialGoals, 
  initialTransactions, 
  initialBudgets 
} from './mockData';
import DashboardSection from './components/DashboardSection';
import TransactionsSection from './components/TransactionsSection';
import ReportsSection from './components/ReportsSection';
import GoalsBudgetsSection from './components/GoalsBudgetsSection';
import SettingsSection from './components/SettingsSection';
import LoginSection from './components/LoginSection';
import './App.css';

function App() {
  // --- STATES & STORAGE ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('finance-pro-theme') || 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('finance-pro-authenticated') === 'true';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finance-pro-user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('finance-pro-categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finance-pro-transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('finance-pro-goals');
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('finance-pro-budgets');
    return saved ? JSON.parse(saved) : initialBudgets;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('finance-pro-sidebar-collapsed') === 'true';
  });
  const [toasts, setToasts] = useState([]);

  // --- SYNC WITH LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('finance-pro-sidebar-collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finance-pro-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('finance-pro-user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('finance-pro-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance-pro-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance-pro-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('finance-pro-budgets', JSON.stringify(budgets));
  }, [budgets]);

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    localStorage.setItem('finance-pro-authenticated', 'true');
    localStorage.setItem('finance-pro-user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('finance-pro-authenticated');
    showToast('Você saiu da sua conta.', 'info');
    setActiveTab('dashboard');
  };

  // --- NAVIGATION TRANSITION ---
  const handleNavigate = (tab) => {
    setIsSidebarOpen(false);
    setIsLoading(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsLoading(false);
    }, 200); // 200ms Skeleton state transition
  };

  // --- SKELETON RENDER ---
  const renderSkeleton = () => (
    <div className="skeleton-overlay">
      <div className="section-header">
        <div className="skeleton animate-fade-in" style={{ width: '180px', height: '34px', marginBottom: '8px' }}></div>
        <div className="skeleton animate-fade-in" style={{ width: '280px', height: '18px' }}></div>
      </div>
      <div className="kpis-grid">
        {[1, 2, 3, 4].map(i => (
          <div className="card kpi-card" key={i}>
            <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ width: '130px', height: '28px', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ width: '100px', height: '12px' }}></div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="card chart-card">
          <div className="skeleton" style={{ width: '150px', height: '18px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
        </div>
        <div className="card chart-card">
          <div className="skeleton" style={{ width: '150px', height: '18px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
        </div>
      </div>
    </div>
  );

  // --- PLACEHOLDERS FOR UPCOMING STAGES ---
  const renderPlaceholder = (title, description) => (
    <div className="card empty-state animate-fade-in">
      <HelpCircle size={48} />
      <h3>{title}</h3>
      <p className="font-sans" style={{ maxWidth: '400px' }}>{description}</p>
      <button className="btn-primary" onClick={() => handleNavigate('dashboard')}>
        Voltar para Dashboard
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <LoginSection 
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        setTheme={setTheme}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <header className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={20} style={{ color: 'var(--accent-green)' }} />
          <h1 className="font-heading" style={{ fontSize: '18px', fontWeight: '800' }}>Finance Pro</h1>
        </div>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <PieChart size={24} />
          {!isSidebarCollapsed && <h1>Finance Pro</h1>}
          <button 
            className="collapse-btn font-sans" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            title={isSidebarCollapsed ? 'Dashboard' : ''}
          >
            <LayoutDashboard size={16} />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleNavigate('transactions')}
            title={isSidebarCollapsed ? 'Transações' : ''}
          >
            <ArrowLeftRight size={16} />
            {!isSidebarCollapsed && <span>Transações</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavigate('reports')}
            title={isSidebarCollapsed ? 'Relatórios' : ''}
          >
            <FileText size={16} />
            {!isSidebarCollapsed && <span>Relatórios</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => handleNavigate('goals')}
            title={isSidebarCollapsed ? 'Metas' : ''}
          >
            <Target size={16} />
            {!isSidebarCollapsed && <span>Metas</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => handleNavigate('budgets')}
            title={isSidebarCollapsed ? 'Orçamentos' : ''}
          >
            <PieChart size={16} />
            {!isSidebarCollapsed && <span>Orçamentos</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
            title={isSidebarCollapsed ? 'Configurações' : ''}
          >
            <Settings size={16} />
            {!isSidebarCollapsed && <span>Configurações</span>}
          </button>
        </nav>

        {/* Theme Toggle Switch */}
        <div className="theme-toggle-container font-sans">
          {!isSidebarCollapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                <span>{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
              </div>
              <label className="theme-switch">
                <input 
                  type="checkbox" 
                  checked={theme === 'light'} 
                  onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
                <span className="slider"></span>
              </label>
            </>
          ) : (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                width: '100%', 
                justifyContent: 'center',
                padding: '4px'
              }}
              title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          )}
        </div>

        {/* Sidebar Footer / User Info */}
        <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div 
              className="avatar" 
              title={isSidebarCollapsed ? "Sair da conta" : ""} 
              onClick={isSidebarCollapsed ? handleLogout : undefined} 
              style={{ cursor: isSidebarCollapsed ? 'pointer' : 'default' }}
            >
              {user.avatar}
            </div>
            {!isSidebarCollapsed && (
              <div className="user-info" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                <span className="user-email" style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="logout-btn"
              title="Sair da conta"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '4px',
                transition: 'all 150ms ease'
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className={`main-content ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardSection 
                transactions={transactions} 
                categories={categories} 
                goals={goals} 
                onNavigate={handleNavigate}
                theme={theme}
              />
            )}
            {activeTab === 'transactions' && (
              <TransactionsSection 
                transactions={transactions} 
                setTransactions={setTransactions} 
                categories={categories}
                showToast={showToast}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsSection 
                transactions={transactions} 
                categories={categories}
                showToast={showToast}
              />
            )}
            {(activeTab === 'goals' || activeTab === 'budgets') && (
              <GoalsBudgetsSection 
                goals={goals}
                setGoals={setGoals}
                budgets={budgets}
                setBudgets={setBudgets}
                categories={categories}
                transactions={transactions}
                showToast={showToast}
                activeSubTab={activeTab}
                setActiveSubTab={(subTab) => handleNavigate(subTab)}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsSection 
                user={user}
                setUser={setUser}
                categories={categories}
                setCategories={setCategories}
                transactions={transactions}
                setTransactions={setTransactions}
                goals={goals}
                setGoals={setGoals}
                budgets={budgets}
                setBudgets={setBudgets}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Toast Notification Renderer */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className={`toast toast-${t.type || 'success'}`} key={t.id}>
            {t.type === 'error' && <AlertOctagon size={16} style={{ color: 'var(--accent-red)' }} />}
            {t.type === 'info' && <Info size={16} style={{ color: 'var(--accent-purple)' }} />}
            {(t.type === 'success' || !t.type) && <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
