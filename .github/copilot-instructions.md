# FinançasPro AI Coding Instructions

## Project Overview
FinançasPro is a personal finance management web app built with **Flask + SQLite** (Python backend) and **Chart.js** visualization. Supports transactions, budgets, goals, reports with CSV/PDF export, and theme switching (light/dark).

**Tech Stack**: Flask 2, SQLite3, ReportLab (PDF), Chart.js, Jinja2 templates, Vanilla JS

**Key Files**: `app.py` (530 lines, all routes & logic), `seed.py` (demo data), `templates/base.html` (layout system)

---

## Architecture & Data Flow

### Database Schema
Single SQLite DB (`instance/financas.db`). Key tables:
- **users**: Profile, theme preference, auth
- **categories**: Predefined types (Salário, Alimentação, etc.) with emoji icons & hex colors
- **transactions**: Core data—amount, type (receita/despesa), date, category_id, notes
- **goals**: User savings targets with progress tracking
- **budgets**: Category spending caps per month
- **sessions**: Token-based auth (7-day expiry)

**Critical Pattern**: All tables have `user_id` with `ON DELETE CASCADE`—deletion is automatic.

### Request Flow
1. **Authentication**: Session tokens stored in `sessions` table. `get_current_user()` validates token expiry.
2. **Route Decorators**: `@login_required` redirects to `/login` if no valid session.
3. **CSRF Protection**: All POST forms require `csrf_token` from session; validated via `validate_csrf()`.
4. **Database Context**: `g.db` connection per request, auto-closed in `@app.teardown_appcontext`.

### Data Processing Patterns
- **Aggregation in Routes**: Dashboard calculates KPIs (receitas/despesas/saldo) with SQL SUM+GROUP BY, not ORM.
- **Date Filtering**: Uses `date LIKE '%Y-%m%'` substring matching; `date.today().strftime('%Y-%m')` for current month.
- **Currency**: Stored as REAL, displayed as `f"{value:,.2f}"`. Forms accept comma separators (`.replace(',', '.')`).

---

## Security Implementation
- **Password Hashing**: PBKDF2-SHA256 with 260,000 iterations + random salt (see `hash_password()`, `verify_password()`).
- **Session Tokens**: Random 32-byte URL-safe tokens, 7-day expiry checked on every protected route.
- **CSRF**: `hmac.compare_digest()` for timing-safe comparison.
- **SQL Injection**: All queries parametrized; never concatenate user input into SQL.
- **HTTP Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` set in `@app.after_request`.

---

## Frontend Conventions

### CSS Architecture
Single stylesheet (`static/css/app.css`) using **CSS variables** for theming:
- Root vars: `--bg`, `--surface`, `--text`, `--accent`, `--green`, `--red`, etc.
- Dark theme activated via `[data-theme="dark"]` selector on `<html>` tag.
- Utility classes: `.card`, `.kpi-grid`, `.grid-2`, `.grid-3`, `.btn-icon`, `.modal-backdrop`.
- No Tailwind/Bootstrap—custom design system using CSS Grid & Flexbox.

### JavaScript Patterns
- **No Framework**: Vanilla JS only; minimal, event-driven code in `static/js/app.js`.
- **Modal System**: `toggleModal(id)` function; modals have `class="modal-backdrop"` and `hidden` attribute.
- **Form Interactions**: 
  - Currency inputs: Auto-format on blur (`,` separator for display, `.` for processing).
  - Theme radio buttons: Toggle `data-theme` attribute on `<html>`, auto-dispatch POST to `/api/tema`.
  - Mobile sidebar: Toggle `.open` class on sidebar; overlay auto-closes on click.
- **Chart.js**: Used in `dashboard.html` & `relatorios.html`; passed data as JSON from Flask via `json.dumps()`.
- **Flash Messages**: Auto-dismiss after 4 seconds with fade-out CSS transition.

### Template Structure
Base layout: `templates/base.html` (sidebar, topbar, content area).
- Sidebar nav uses data attributes: `data-page="transacoes"` to highlight active nav items.
- Page title injected via `{% block title %}`.
- User context via `{% if current_user %}` and `{{ current_user.name }}`, `{{ current_user.theme }}`.

---

## Common Development Tasks

### Adding a Transaction Field
1. **Database**: Add column to `transactions` table in `init_db()` CREATE TABLE.
2. **Seed**: Update `seed.py` to populate new field (required for demo data).
3. **Form**: Add input field to `templates/form_transacao.html` modal.
4. **Route Handler**: Parse new field in `nova_transacao()` / `editar_transacao()`.
5. **Display**: Join in SQL query and render in `transacoes.html` table.

### Adding a New Category
- Use `_seed_default_categories()` function pattern: tuple of (name, type, color, icon).
- Both routes and seed reference categories by `(name, type)` tuple lookup.
- Categories have fixed icon emoji + hex color; update these atomically.

### Exporting Reports
- **CSV**: `csv.writer()` with `;` delimiter (PT-BR standard); UTF-8-sig encoding.
- **PDF**: ReportLab with `SimpleDocTemplate`, `TableStyle`, conditional background colors.
- Both use same date range filtering: `mes_inicio` to `mes_fim` as `YYYY-MM`.

### Theme Switching
- Client-side: JS toggles `data-theme` attribute on `<html>`, triggers CSS variable swap.
- Server-side: POST to `/api/tema` saves preference in `users.theme` column.
- Persists across sessions via `render_template()` context: `data-theme="{{ current_user.theme if current_user else 'light' }}"`.

---

## Project-Specific Patterns

### String Formatting
- **Portuguese**: All UI text, error messages, and labels in PT-BR.
- **Dates**: `%d/%m/%Y` for display, `%Y-%m-%d` for DB storage.
- **Currency**: `f"{value:,.2f}"` (commas as thousands separator).

### Form Submission Pattern
```python
# Standard structure in all POST routes:
if not validate_csrf(request.form.get('csrf_token')): 
    flash('Token inválido.', 'error')
    return redirect(url_for('...'))
# [process request]
db.commit()
flash('Ação realizada!', 'success')
return redirect(url_for('...'))
```

### Dashboard KPI Calculation
Always use current month (`today.strftime('%Y-%m')`) for active KPIs; historical data in separate loop for charts.

---

## Running & Debugging

### Startup
```bash
python seed.py        # Reset demo user + 10 months of transactions
python app.py         # Run on localhost:5000 (debug mode)
```

### Test Credentials (after seed)
- Email: `demo@financaspro.com.br`
- Password: `demo1234`

### Common Issues
- **"Token invalid"**: CSRF token mismatch—verify `csrf_token()` called in form.
- **Database locked**: SQLite is single-writer; restart Flask if hung on DB write.
- **Theme not persisting**: Check `current_user.theme` is being set in POST handler before redirect.

---

## Notes for AI Agents
- **No async/background tasks**: Flask runs in debug mode; suitable for single-user demos only.
- **No ORM**: All SQL is hand-written—maintain parameterization discipline.
- **Frontend simplicity**: No npm/build step; update CSS vars or JS directly.
- **Localization**: PT-BR throughout; preserve Portuguese in UI strings and comments.
