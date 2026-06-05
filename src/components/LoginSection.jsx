import React, { useState } from 'react';
import { 
  PieChart, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-react';

function LoginSection({ onLoginSuccess, theme, setTheme, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Get users from localStorage or initialize with default
  const getUsersList = () => {
    const saved = localStorage.getItem('finance-pro-users-list');
    if (saved) return JSON.parse(saved);
    
    // Default user
    const defaults = [
      {
        name: "Samuel Lima",
        email: "samuel.lima21287@gmail.com",
        password: "123",
        avatar: "SL",
        currency: "BRL"
      }
    ];
    localStorage.setItem('finance-pro-users-list', JSON.stringify(defaults));
    return defaults;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const users = getUsersList();
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (matched && matched.password === password) {
      // Success
      showToast(`Bem-vindo de volta, ${matched.name}!`, 'success');
      onLoginSuccess(matched);
    } else {
      setError('E-mail ou senha incorretos.');
      showToast('E-mail ou senha inválidos.', 'error');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('E-mail inválido.');
      return;
    }

    if (password.length < 3) {
      setError('A senha deve ter no mínimo 3 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const users = getUsersList();
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      setError('Este e-mail já está sendo utilizado.');
      showToast('E-mail já cadastrado.', 'error');
      return;
    }

    // Generate initials for avatar
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'US';

    const newUser = {
      name,
      email,
      password,
      avatar: initials,
      currency: 'BRL'
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('finance-pro-users-list', JSON.stringify(updatedUsers));

    showToast('Conta criada com sucesso!', 'success');
    onLoginSuccess(newUser);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="login-page">
      {/* Floating Theme Button */}
      <button className="login-theme-toggle" onClick={toggleTheme} title="Alternar tema">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-logo-header">
          <div className="logo-icon-bg">
            <PieChart size={32} className="logo-icon" />
          </div>
          <h1 className="font-heading">Finance Pro</h1>
          <p className="text-muted font-sans">Gerencie suas finanças com sofisticação</p>
        </div>

        {/* Form Card */}
        <div className="card login-form-card">
          <div className="login-tabs">
            <button 
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Entrar
            </button>
            <button 
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="login-error-alert font-sans">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={16} />
                  <input 
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Dica: use a senha padrão <strong>123</strong></span>
                </div>
              </div>

              <button type="submit" className="btn-primary login-submit-btn font-sans">
                Acessar Painel <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={16} />
                  <input 
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={16} />
                  <input 
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo de 3 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Senha</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary login-submit-btn font-sans">
                Criar Conta & Acessar <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginSection;
