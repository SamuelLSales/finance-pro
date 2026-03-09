"""
Script de seed — popula o banco com dados de exemplo (6-12 meses)
Uso: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import app, init_db, hash_password, _seed_default_categories, get_db
from datetime import date, timedelta
import random

DEMO_EMAIL = "demo@financaspro.com.br"
DEMO_PASS  = "demo1234"
DEMO_NAME  = "Ana Oliveira"

def seed():
    with app.app_context():
        init_db()
        db = get_db()

        # Remove existing demo user
        existing = db.execute("SELECT id FROM users WHERE email=?", (DEMO_EMAIL,)).fetchone()
        if existing:
            uid = existing['id']
            db.execute("DELETE FROM transactions WHERE user_id=?", (uid,))
            db.execute("DELETE FROM goals WHERE user_id=?", (uid,))
            db.execute("DELETE FROM budgets WHERE user_id=?", (uid,))
            db.execute("DELETE FROM categories WHERE user_id=?", (uid,))
            db.execute("DELETE FROM users WHERE id=?", (uid,))
            db.commit()

        # Create user
        cur = db.execute("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",
                         (DEMO_NAME, DEMO_EMAIL, hash_password(DEMO_PASS)))
        uid = cur.lastrowid
        _seed_default_categories(db, uid)
        db.commit()

        # Get category ids
        cats = {(c['name'],c['type']): c['id'] for c in
                db.execute("SELECT * FROM categories WHERE user_id=?", (uid,)).fetchall()}

        def cid(name, tipo):
            return cats.get((name, tipo)) or cats.get((name+' ('+tipo+')', tipo))

        today = date.today()

        # Generate 10 months of data
        for months_ago in range(9, -1, -1):
            d = today.replace(day=1) - timedelta(days=months_ago*28)
            year, month = d.year, d.month

            def rnd_day():
                import calendar
                last = calendar.monthrange(year, month)[1]
                return f"{year}-{month:02d}-{random.randint(1,last):02d}"

            # Salário principal
            sal = round(random.uniform(5500, 6500), 2)
            db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                       (uid, cid('Salário','receita'), 'Salário mensal', sal, 'receita', f"{year}-{month:02d}-05"))

            # Freelance (some months)
            if random.random() > 0.4:
                fl = round(random.uniform(800, 2500), 2)
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cid('Freelance','receita'), random.choice(['Projeto UX','Consultoria','Desenvolvimento web','Design gráfico']), fl, 'receita', rnd_day()))

            # Investimentos
            if random.random() > 0.5:
                inv = round(random.uniform(200, 800), 2)
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cid('Investimentos','receita'), 'Rendimento CDB/Tesouro', inv, 'receita', rnd_day()))

            # Despesas fixas
            expenses = [
                (cid('Moradia','despesa'), 'Aluguel', round(random.uniform(1400,1600),2)),
                (cid('Moradia','despesa'), 'Condomínio', round(random.uniform(380,420),2)),
                (cid('Transporte','despesa'), 'Combustível', round(random.uniform(180,300),2)),
                (cid('Saúde','despesa'), 'Plano de saúde', round(random.uniform(350,380),2)),
                (cid('Educação','despesa'), 'Curso online / Faculdade', round(random.uniform(300,600),2)),
            ]
            for cat_id, desc, amt in expenses:
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cat_id, desc, amt, 'despesa', rnd_day()))

            # Alimentação (várias)
            food_items = ['Supermercado','Feira','iFood / Delivery','Restaurante','Padaria','Açaí / Lanches']
            for _ in range(random.randint(4, 8)):
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cid('Alimentação','despesa'), random.choice(food_items),
                            round(random.uniform(35,280),2), 'despesa', rnd_day()))

            # Lazer
            leisure = ['Cinema / Teatro','Streaming','Barzinho','Viagem fim de semana','Show / Evento']
            for _ in range(random.randint(2, 4)):
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cid('Lazer','despesa'), random.choice(leisure),
                            round(random.uniform(40,350),2), 'despesa', rnd_day()))

            # Compras
            shopping = ['Amazon','Shein / Shopee','Farmácia','Mercado Livre','Shopping']
            for _ in range(random.randint(1, 3)):
                db.execute("INSERT INTO transactions(user_id,category_id,description,amount,type,date) VALUES(?,?,?,?,?,?)",
                           (uid, cid('Compras','despesa'), random.choice(shopping),
                            round(random.uniform(50,500),2), 'despesa', rnd_day()))

        db.commit()

        # Metas
        goals = [
            ('Fundo de Emergência', 18000, 11500, (today + timedelta(days=180)).strftime('%Y-%m-%d'), '#6366f1'),
            ('Viagem Europa 🇪🇺', 12000, 4200, (today + timedelta(days=365)).strftime('%Y-%m-%d'), '#0891b2'),
            ('Notebook Novo 💻', 4500, 3800, (today + timedelta(days=60)).strftime('%Y-%m-%d'), '#16a34a'),
            ('Entrada Apartamento 🏠', 50000, 18000, (today + timedelta(days=730)).strftime('%Y-%m-%d'), '#f59e0b'),
        ]
        for name, target, current, deadline, color in goals:
            db.execute("INSERT INTO goals(user_id,name,target_amount,current_amount,deadline,color) VALUES(?,?,?,?,?,?)",
                       (uid, name, target, current, deadline, color))

        # Orçamentos
        cm = today.strftime('%Y-%m')
        budgets = [
            (cid('Alimentação','despesa'), 1200, cm),
            (cid('Transporte','despesa'), 500, cm),
            (cid('Lazer','despesa'), 600, cm),
            (cid('Compras','despesa'), 800, cm),
            (cid('Saúde','despesa'), 400, cm),
        ]
        for cat_id, amount, month in budgets:
            if cat_id:
                db.execute("INSERT INTO budgets(user_id,category_id,amount,month) VALUES(?,?,?,?)",
                           (uid, cat_id, amount, month))

        db.commit()
        print(f"✅ Seed concluído!")
        print(f"   Usuário demo: {DEMO_EMAIL}")
        print(f"   Senha: {DEMO_PASS}")
        tx_count = db.execute("SELECT COUNT(*) FROM transactions WHERE user_id=?", (uid,)).fetchone()[0]
        print(f"   Transações geradas: {tx_count}")

if __name__ == '__main__':
    seed()
