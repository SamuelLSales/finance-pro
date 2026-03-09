// ── Mobile sidebar ──
const sidebar   = document.getElementById('sidebar');
const toggle    = document.getElementById('mobileToggle');
const overlay   = document.getElementById('overlay');

if (toggle) {
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    overlay.classList.toggle('show', open);
    toggle.setAttribute('aria-expanded', open);
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    toggle.setAttribute('aria-expanded', false);
  });
}

// ── Modals ──
function toggleModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = el.hasAttribute('hidden');
  document.querySelectorAll('.modal-backdrop').forEach(m => m.setAttribute('hidden', ''));
  if (hidden) {
    el.removeAttribute('hidden');
    el.querySelector('input, select, textarea')?.focus();
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => {
      m.setAttribute('hidden', '');
      document.body.style.overflow = '';
    });
  }
});

// ── Auto-dismiss flashes ──
setTimeout(() => {
  document.querySelectorAll('.flash').forEach(f => {
    f.style.transition = 'opacity .4s';
    f.style.opacity = '0';
    setTimeout(() => f.remove(), 400);
  });
}, 4000);

// ── Currency input formatting ──
document.querySelectorAll('input[inputmode="decimal"], .text-mono[type="text"]').forEach(inp => {
  inp.addEventListener('blur', () => {
    const v = parseFloat(inp.value.replace(',', '.'));
    if (!isNaN(v)) inp.value = v.toFixed(2).replace('.', ',');
  });
});

// ── Theme radio auto-label ──
document.querySelectorAll('.theme-option').forEach(opt => {
  opt.querySelector('input')?.addEventListener('change', () => {
    document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  });
});
