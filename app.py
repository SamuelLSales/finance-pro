"""
FinançasPro - Aplicativo de Organização Financeira Pessoal
"""
import os, sqlite3, hashlib, hmac, secrets, json, csv, io
from datetime import datetime, timedelta, date
from functools import wraps
from flask import (Flask, render_template, request, redirect, url_for,
                   session, flash, jsonify, make_response, g)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'instance', 'financas.db')

def get_db():
    if 'db' not in g:
        os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL, theme TEXT DEFAULT 'light',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, name TEXT NOT NULL,
            type TEXT NOT NULL, color TEXT DEFAULT '#6366f1', icon TEXT DEFAULT '💰',
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, category_id INTEGER,
            description TEXT NOT NULL, amount REAL NOT NULL,
            type TEXT NOT NULL, date TEXT NOT NULL, notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, name TEXT NOT NULL,
            target_amount REAL NOT NULL, current_amount REAL DEFAULT 0,
            deadline TEXT, color TEXT DEFAULT '#6366f1',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, category_id INTEGER NOT NULL,
            amount REAL NOT NULL, month TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    db.commit()

def hash_password(p):
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', p.encode(), salt.encode(), 260000)
    return f"{salt}${h.hex()}"

def verify_password(p, stored):
    try:
        salt, h = stored.split('$')
        expected = hashlib.pbkdf2_hmac('sha256', p.encode(), salt.encode(), 260000)
        return hmac.compare_digest(expected.hex(), h)
    except: return False

def create_session(uid):
    db = get_db()
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=7)
    db.execute("DELETE FROM sessions WHERE user_id=? OR expires_at < datetime('now')", (uid,))
    db.execute("INSERT INTO sessions(user_id,token,expires_at) VALUES(?,?,?)", (uid,token,expires))
    db.commit()
    return token

def get_current_user():
    token = session.get('token')
    if not token: return None
    db = get_db()
    row = db.execute("""SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
        WHERE s.token=? AND s.expires_at > datetime('now')""", (token,)).fetchone()
    return dict(row) if row else None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user: return redirect(url_for('login'))
        g.user = user
        return f(*args, **kwargs)
    return decorated

def csrf_token():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(16)
    return session['csrf_token']

def validate_csrf(token):
    return hmac.compare_digest(session.get('csrf_token',''), token or '')

app.jinja_env.globals['csrf_token'] = csrf_token

def _seed_default_categories(db, uid):
    cats = [
        ('Salário','receita','#22c55e','💼'),('Freelance','receita','#10b981','💻'),
        ('Investimentos','receita','#06b6d4','📈'),('Outros (Receita)','receita','#8b5cf6','💰'),
        ('Moradia','despesa','#ef4444','🏠'),('Alimentação','despesa','#f97316','🍽️'),
        ('Transporte','despesa','#eab308','🚗'),('Saúde','despesa','#ec4899','❤️'),
        ('Educação','despesa','#6366f1','📚'),('Lazer','despesa','#14b8a6','🎉'),
        ('Compras','despesa','#f43f5e','🛒'),('Outros (Despesa)','despesa','#94a3b8','📌'),
    ]
    for n,t,c,i in cats:
        db.execute("INSERT INTO categories(user_id,name,type,color,icon) VALUES(?,?,?,?,?)",(uid,n,t,c,i))

@app.route('/')
def index():
    return redirect(url_for('dashboard') if get_current_user() else url_for('login'))

@app.route('/login', methods=['GET','POST'])
def login():
    if get_current_user(): return redirect(url_for('dashboard'))
    error = None
    if request.method == 'POST':
        email = request.form.get('email','').strip().lower()
        password = request.form.get('password','')
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email=?",(email,)).fetchone()
        if user and verify_password(password, user['password_hash']):
            token = create_session(user['id'])
            session['token'] = token
            return redirect(url_for('dashboard'))
        error = 'E-mail ou senha incorretos.'
    return render_template('login.html', error=error)

@app.route('/cadastro', methods=['GET','POST'])
def cadastro():
    if get_current_user(): return redirect(url_for('dashboard'))
    error = None
    if request.method == 'POST':
        name = request.form.get('name','').strip()
        email = request.form.get('email','').strip().lower()
        password = request.form.get('password','')
        confirm = request.form.get('confirm','')
        if not all([name,email,password]): error='Todos os campos são obrigatórios.'
        elif len(password)<8: error='Senha deve ter pelo menos 8 caracteres.'
        elif password!=confirm: error='As senhas não coincidem.'
        else:
            db = get_db()
            if db.execute("SELECT id FROM users WHERE email=?",(email,)).fetchone():
                error = 'E-mail já cadastrado.'
            else:
                cur = db.execute("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",
                                 (name,email,hash_password(password)))
                uid = cur.lastrowid
                _seed_default_categories(db, uid)
                db.commit()
                session['token'] = create_session(uid)
                return redirect(url_for('dashboard'))
    return render_template('cadastro.html', error=error)

@app.route('/logout')
def logout():
    token = session.get('token')
    if token:
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token=?",(token,))
        db.commit()
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    db = get_db()
    uid = g.user['id']
    today = date.today()
    cm_str = today.strftime('%Y-%m')
    month_txs = db.execute("SELECT type,SUM(amount) as total FROM transactions WHERE user_id=? AND date LIKE ? GROUP BY type",(uid,f"{cm_str}%")).fetchall()
    receitas = sum(r['total'] for r in month_txs if r['type']=='receita')
    despesas = sum(r['total'] for r in month_txs if r['type']=='despesa')
    saldo = receitas - despesas
    economia_pct = round((saldo/receitas*100) if receitas>0 else 0, 1)
    months_data = []
    for i in range(11,-1,-1):
        d = (today.replace(day=1) - timedelta(days=i*28))
        m = d.strftime('%Y-%m'); label = d.strftime('%b/%y')
        txs = db.execute("SELECT type,SUM(amount) as total FROM transactions WHERE user_id=? AND date LIKE ? GROUP BY type",(uid,f"{m}%")).fetchall()
        r = sum(x['total'] for x in txs if x['type']=='receita')
        e = sum(x['total'] for x in txs if x['type']=='despesa')
        months_data.append({'month':label,'receitas':r,'despesas':e,'saldo':r-e})
    cat_despesas = db.execute("""SELECT c.name,c.color,SUM(t.amount) as total FROM transactions t
        JOIN categories c ON c.id=t.category_id WHERE t.user_id=? AND t.type='despesa' AND t.date LIKE ?
        GROUP BY c.id ORDER BY total DESC LIMIT 8""",(uid,f"{cm_str}%")).fetchall()
    recent = db.execute("""SELECT t.*,c.name as cat_name,c.color as cat_color,c.icon as cat_icon
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=? ORDER BY t.date DESC,t.id DESC LIMIT 8""",(uid,)).fetchall()
    goals = db.execute("SELECT * FROM goals WHERE user_id=? ORDER BY deadline LIMIT 4",(uid,)).fetchall()
    budgets = db.execute("""SELECT b.*,c.name as cat_name,c.color as cat_color,c.icon as cat_icon,
        COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.category_id=b.category_id
        AND t.user_id=b.user_id AND t.date LIKE ? AND t.type='despesa'),0) as spent
        FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.user_id=? AND b.month=?""",
        (f"{cm_str}%",uid,cm_str)).fetchall()
    return render_template('dashboard.html',user=g.user,
        receitas=receitas,despesas=despesas,saldo=saldo,economia_pct=economia_pct,
        months_data=json.dumps(months_data),
        cat_despesas=json.dumps([dict(r) for r in cat_despesas]),
        recent=recent,goals=goals,budgets=budgets,current_month=cm_str,
        today=today.strftime('%d/%m/%Y'))

@app.route('/transacoes')
@login_required
def transacoes():
    db = get_db()
    uid = g.user['id']
    page = max(1,int(request.args.get('page',1)))
    per_page = 20
    tipo = request.args.get('tipo','')
    cat_id = request.args.get('categoria','')
    mes = request.args.get('mes','')
    search = request.args.get('busca','')
    filters = ["t.user_id=?"]; params = [uid]
    if tipo: filters.append("t.type=?"); params.append(tipo)
    if cat_id: filters.append("t.category_id=?"); params.append(cat_id)
    if mes: filters.append("t.date LIKE ?"); params.append(f"{mes}%")
    if search: filters.append("t.description LIKE ?"); params.append(f"%{search}%")
    where = " AND ".join(filters)
    total = db.execute(f"SELECT COUNT(*) FROM transactions t WHERE {where}",params).fetchone()[0]
    txs = db.execute(f"""SELECT t.*,c.name as cat_name,c.color as cat_color,c.icon as cat_icon
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE {where} ORDER BY t.date DESC,t.id DESC LIMIT ? OFFSET ?""",
        params+[per_page,(page-1)*per_page]).fetchall()
    cats = db.execute("SELECT * FROM categories WHERE user_id=? ORDER BY type,name",(uid,)).fetchall()
    return render_template('transacoes.html',user=g.user,txs=txs,cats=cats,
        page=page,pages=(total+per_page-1)//per_page,total=total,
        tipo=tipo,cat_id=cat_id,mes=mes,search=search)

@app.route('/transacoes/nova', methods=['POST'])
@login_required
def nova_transacao():
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('transacoes'))
    db = get_db(); uid = g.user['id']
    desc = request.form.get('description','').strip()
    amount_str = request.form.get('amount','').replace(',','.')
    tipo = request.form.get('type','')
    cat_id = request.form.get('category_id') or None
    tx_date = request.form.get('date','')
    notes = request.form.get('notes','').strip()
    try:
        amount = float(amount_str); assert amount>0; assert tipo in ('receita','despesa'); assert desc
    except: flash('Dados inválidos.','error'); return redirect(url_for('transacoes'))
    db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date,notes) VALUES(?,?,?,?,?,?,?)",
               (uid,cat_id,desc,amount,tipo,tx_date,notes))
    db.commit(); flash('Transação adicionada!','success')
    return redirect(request.referrer or url_for('transacoes'))

@app.route('/transacoes/<int:tid>/editar', methods=['POST'])
@login_required
def editar_transacao(tid):
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('transacoes'))
    db = get_db(); uid = g.user['id']
    if not db.execute("SELECT id FROM transactions WHERE id=? AND user_id=?",(tid,uid)).fetchone():
        flash('Não encontrado.','error'); return redirect(url_for('transacoes'))
    desc = request.form.get('description','').strip()
    amount_str = request.form.get('amount','').replace(',','.')
    tipo = request.form.get('type','')
    cat_id = request.form.get('category_id') or None
    tx_date = request.form.get('date','')
    notes = request.form.get('notes','').strip()
    try: amount = float(amount_str); assert amount>0
    except: flash('Valor inválido.','error'); return redirect(url_for('transacoes'))
    db.execute("UPDATE transactions SET description=?,amount=?,type=?,category_id=?,date=?,notes=? WHERE id=? AND user_id=?",
               (desc,amount,tipo,cat_id,tx_date,notes,tid,uid))
    db.commit(); flash('Transação atualizada!','success')
    return redirect(url_for('transacoes'))

@app.route('/transacoes/<int:tid>/excluir', methods=['POST'])
@login_required
def excluir_transacao(tid):
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error')
    else:
        db = get_db()
        db.execute("DELETE FROM transactions WHERE id=? AND user_id=?",(tid,g.user['id']))
        db.commit(); flash('Transação excluída.','success')
    return redirect(url_for('transacoes'))

@app.route('/api/transacao/<int:tid>')
@login_required
def api_transacao(tid):
    db = get_db()
    tx = db.execute("SELECT * FROM transactions WHERE id=? AND user_id=?",(tid,g.user['id'])).fetchone()
    if not tx: return jsonify({'error':'Não encontrado'}),404
    return jsonify(dict(tx))

@app.route('/metas')
@login_required
def metas():
    db = get_db(); uid = g.user['id']
    goals = db.execute("""SELECT g.* FROM goals g WHERE g.user_id=? ORDER BY g.deadline""",(uid,)).fetchall()
    cats = db.execute("SELECT * FROM categories WHERE user_id=? ORDER BY name",(uid,)).fetchall()
    budgets = db.execute("""SELECT b.*,c.name as cat_name,c.color as cat_color,c.icon as cat_icon,
        COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.category_id=b.category_id
        AND t.user_id=b.user_id AND t.date LIKE b.month||'%' AND t.type='despesa'),0) as spent
        FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.user_id=? ORDER BY b.month DESC""",(uid,)).fetchall()
    cm_str = date.today().strftime('%Y-%m')
    return render_template('metas.html',user=g.user,goals=goals,cats=cats,budgets=budgets,current_month=cm_str)

@app.route('/metas/nova', methods=['POST'])
@login_required
def nova_meta():
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('metas'))
    db = get_db(); uid = g.user['id']
    name = request.form.get('name','').strip()
    target = request.form.get('target_amount','').replace(',','.')
    current = request.form.get('current_amount','0').replace(',','.')
    deadline = request.form.get('deadline','')
    color = request.form.get('color','#6366f1')
    try: target=float(target); current=float(current)
    except: flash('Valor inválido.','error'); return redirect(url_for('metas'))
    db.execute("INSERT INTO goals(user_id,name,target_amount,current_amount,deadline,color) VALUES(?,?,?,?,?,?)",
               (uid,name,target,current,deadline,color))
    db.commit(); flash('Meta criada!','success')
    return redirect(url_for('metas'))

@app.route('/metas/<int:gid>/excluir', methods=['POST'])
@login_required
def excluir_meta(gid):
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error')
    else:
        db = get_db(); db.execute("DELETE FROM goals WHERE id=? AND user_id=?",(gid,g.user['id'])); db.commit(); flash('Meta excluída.','success')
    return redirect(url_for('metas'))

@app.route('/metas/<int:gid>/atualizar', methods=['POST'])
@login_required
def atualizar_meta(gid):
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('metas'))
    db = get_db()
    current = request.form.get('current_amount','0').replace(',','.')
    try: current=float(current)
    except: flash('Valor inválido.','error'); return redirect(url_for('metas'))
    db.execute("UPDATE goals SET current_amount=? WHERE id=? AND user_id=?",(current,gid,g.user['id']))
    db.commit(); flash('Meta atualizada!','success')
    return redirect(url_for('metas'))

@app.route('/orcamentos/novo', methods=['POST'])
@login_required
def novo_orcamento():
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('metas'))
    db = get_db(); uid = g.user['id']
    cat_id = request.form.get('category_id')
    amount = request.form.get('amount','').replace(',','.')
    month = request.form.get('month',date.today().strftime('%Y-%m'))
    try: amount=float(amount)
    except: flash('Valor inválido.','error'); return redirect(url_for('metas'))
    existing = db.execute("SELECT id FROM budgets WHERE user_id=? AND category_id=? AND month=?",(uid,cat_id,month)).fetchone()
    if existing: db.execute("UPDATE budgets SET amount=? WHERE id=?",(amount,existing['id']))
    else: db.execute("INSERT INTO budgets(user_id,category_id,amount,month) VALUES(?,?,?,?)",(uid,cat_id,amount,month))
    db.commit(); flash('Orçamento salvo!','success')
    return redirect(url_for('metas'))

@app.route('/orcamentos/<int:bid>/excluir', methods=['POST'])
@login_required
def excluir_orcamento(bid):
    if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error')
    else:
        db = get_db(); db.execute("DELETE FROM budgets WHERE id=? AND user_id=?",(bid,g.user['id'])); db.commit(); flash('Orçamento excluído.','success')
    return redirect(url_for('metas'))

@app.route('/relatorios')
@login_required
def relatorios():
    db = get_db(); uid = g.user['id']
    today = date.today()
    mes_inicio = request.args.get('mes_inicio',(today.replace(day=1)-timedelta(days=180)).strftime('%Y-%m'))
    mes_fim = request.args.get('mes_fim',today.strftime('%Y-%m'))
    txs = db.execute("""SELECT t.*,c.name as cat_name,c.color as cat_color,c.icon as cat_icon
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=? AND substr(t.date,1,7)>=? AND substr(t.date,1,7)<=?
        ORDER BY t.date DESC""",(uid,mes_inicio,mes_fim)).fetchall()
    total_r = sum(t['amount'] for t in txs if t['type']=='receita')
    total_d = sum(t['amount'] for t in txs if t['type']=='despesa')
    cat_summary = {}
    for t in txs:
        k = (t['cat_name'] or 'Sem categoria', t['cat_color'] or '#94a3b8', t['type'])
        cat_summary[k] = cat_summary.get(k,0) + t['amount']
    return render_template('relatorios.html',user=g.user,txs=txs,
        total_r=total_r,total_d=total_d,saldo=total_r-total_d,
        mes_inicio=mes_inicio,mes_fim=mes_fim,cat_summary=cat_summary)

@app.route('/relatorios/exportar/csv')
@login_required
def exportar_csv():
    db = get_db(); uid = g.user['id']
    mi = request.args.get('mes_inicio',''); mf = request.args.get('mes_fim','')
    txs = db.execute("""SELECT t.date,t.description,t.type,t.amount,c.name as categoria,t.notes
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=? AND substr(t.date,1,7)>=? AND substr(t.date,1,7)<=?
        ORDER BY t.date DESC""",(uid,mi,mf)).fetchall()
    output = io.StringIO()
    w = csv.writer(output,delimiter=';')
    w.writerow(['Data','Descrição','Tipo','Valor (R$)','Categoria','Observações'])
    for t in txs:
        w.writerow([t['date'],t['description'],'Receita' if t['type']=='receita' else 'Despesa',
                    f"{t['amount']:.2f}",t['categoria'] or '',t['notes'] or ''])
    output.seek(0)
    resp = make_response(output.getvalue())
    resp.headers['Content-Type'] = 'text/csv; charset=utf-8-sig'
    resp.headers['Content-Disposition'] = f'attachment; filename=financas_{mi}_{mf}.csv'
    return resp

@app.route('/relatorios/exportar/pdf')
@login_required
def exportar_pdf():
    db = get_db(); uid = g.user['id']
    mi = request.args.get('mes_inicio',''); mf = request.args.get('mes_fim','')
    txs = db.execute("""SELECT t.date,t.description,t.type,t.amount,c.name as categoria
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=? AND substr(t.date,1,7)>=? AND substr(t.date,1,7)<=?
        ORDER BY t.date DESC""",(uid,mi,mf)).fetchall()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf,pagesize=A4,rightMargin=2*cm,leftMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm)
    styles = getSampleStyleSheet(); story = []
    story.append(Paragraph('FinançasPro — Relatório Financeiro',
        ParagraphStyle('T',parent=styles['Title'],fontSize=18,textColor=colors.HexColor('#1e293b'),spaceAfter=6)))
    story.append(Paragraph(f'Período: {mi} a {mf} | Gerado: {datetime.now().strftime("%d/%m/%Y %H:%M")}',
        ParagraphStyle('S',parent=styles['Normal'],fontSize=10,textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1,0.5*cm))
    total_r=sum(t['amount'] for t in txs if t['type']=='receita')
    total_d=sum(t['amount'] for t in txs if t['type']=='despesa')
    saldo=total_r-total_d
    kpi = Table([['Receitas','Despesas','Saldo'],[f'R$ {total_r:,.2f}',f'R$ {total_d:,.2f}',f'R$ {saldo:,.2f}']],colWidths=[5.5*cm,5.5*cm,5.5*cm])
    kpi.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#334155')),('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('BACKGROUND',(0,1),(0,1),colors.HexColor('#dcfce7')),('BACKGROUND',(1,1),(1,1),colors.HexColor('#fee2e2')),
        ('BACKGROUND',(2,1),(2,1),colors.HexColor('#dbeafe') if saldo>=0 else colors.HexColor('#fee2e2')),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
        ('FONTSIZE',(0,0),(-1,-1),11),('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),
        ('INNERGRID',(0,0),(-1,-1),0.25,colors.HexColor('#e2e8f0')),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    story.append(kpi); story.append(Spacer(1,0.5*cm))
    story.append(Paragraph('Transações',ParagraphStyle('H2',parent=styles['Heading2'],fontSize=13,textColor=colors.HexColor('#1e293b'))))
    story.append(Spacer(1,0.2*cm))
    rows=[['Data','Descrição','Categoria','Tipo','Valor (R$)']]+[[t['date'],t['description'][:35],t['categoria'] or '—','Receita' if t['type']=='receita' else 'Despesa',f"{t['amount']:,.2f}"] for t in txs]
    tbl=Table(rows,colWidths=[2.5*cm,7*cm,3.5*cm,2.5*cm,3*cm])
    tbl.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#334155')),('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9),
        ('ALIGN',(4,0),(4,-1),'RIGHT'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f8fafc')]),
        ('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),('INNERGRID',(0,0),(-1,-1),0.25,colors.HexColor('#e2e8f0')),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    story.append(tbl); doc.build(story); buf.seek(0)
    resp=make_response(buf.read())
    resp.headers['Content-Type']='application/pdf'
    resp.headers['Content-Disposition']=f'attachment; filename=financas_{mi}_{mf}.pdf'
    return resp

@app.route('/configuracoes', methods=['GET','POST'])
@login_required
def configuracoes():
    db = get_db(); uid = g.user['id']
    if request.method == 'POST':
        action = request.form.get('action')
        if not validate_csrf(request.form.get('csrf_token')): flash('Token inválido.','error'); return redirect(url_for('configuracoes'))
        if action == 'perfil':
            name = request.form.get('name','').strip(); theme = request.form.get('theme','light')
            if name:
                db.execute("UPDATE users SET name=?,theme=? WHERE id=?",(name,theme,uid)); db.commit()
                g.user['name']=name; g.user['theme']=theme; flash('Perfil atualizado!','success')
        elif action == 'senha':
            cpw=request.form.get('current_password',''); npw=request.form.get('new_password',''); cpw2=request.form.get('confirm_password','')
            user_row=db.execute("SELECT password_hash FROM users WHERE id=?",(uid,)).fetchone()
            if not verify_password(cpw,user_row['password_hash']): flash('Senha atual incorreta.','error')
            elif len(npw)<8: flash('Nova senha: mínimo 8 caracteres.','error')
            elif npw!=cpw2: flash('Senhas não coincidem.','error')
            else: db.execute("UPDATE users SET password_hash=? WHERE id=?",(hash_password(npw),uid)); db.commit(); flash('Senha alterada!','success')
        elif action == 'nova_categoria':
            n=request.form.get('cat_name','').strip(); t=request.form.get('cat_type','')
            c=request.form.get('cat_color','#6366f1'); i=request.form.get('cat_icon','💰')
            if n and t in ('receita','despesa'):
                db.execute("INSERT INTO categories(user_id,name,type,color,icon) VALUES(?,?,?,?,?)",(uid,n,t,c,i)); db.commit(); flash('Categoria criada!','success')
        elif action == 'excluir_categoria':
            cid=request.form.get('cat_id'); db.execute("DELETE FROM categories WHERE id=? AND user_id=?",(cid,uid)); db.commit(); flash('Categoria excluída.','success')
        return redirect(url_for('configuracoes'))
    cats = db.execute("SELECT * FROM categories WHERE user_id=? ORDER BY type,name",(uid,)).fetchall()
    return render_template('configuracoes.html',user=g.user,cats=cats)

@app.route('/api/tema', methods=['POST'])
@login_required
def toggle_tema():
    db=get_db(); data=request.get_json(); theme=data.get('theme','light')
    db.execute("UPDATE users SET theme=? WHERE id=?",(theme,g.user['id'])); db.commit()
    return jsonify({'ok':True,'theme':theme})

@app.after_request
def security_headers(resp):
    resp.headers['X-Content-Type-Options']='nosniff'
    resp.headers['X-Frame-Options']='DENY'
    resp.headers['X-XSS-Protection']='1; mode=block'
    return resp

@app.context_processor
def inject_user():
    return {'current_user': get_current_user()}

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)
