// ── Chart.js global defaults ──
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
const textColor  = isDark ? '#8fa7c7' : '#64748b';
const gridColor  = isDark ? '#1e2d45' : '#e2e8f0';
const surfaceColor = isDark ? '#131929' : '#ffffff';

Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = textColor;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = isDark ? '#1a2235' : '#0f172a';
Chart.defaults.plugins.tooltip.titleColor = '#f0f6ff';
Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.callbacks.label = function(ctx) {
  const val = ctx.raw;
  return ` R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
};

// ── Line Chart: Saldo 12 meses ──
if (document.getElementById('lineChart')) {
  const positiveColor = '#10b981';
  const negativeColor = '#ef4444';
  const brandColor    = '#0ea5e9';

  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: LABELS_12,
      datasets: [{
        label: 'Saldo',
        data: SALDO_12,
        borderColor: brandColor,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.chartArea?.bottom || 200);
          g.addColorStop(0, 'rgba(14,165,233,0.25)');
          g.addColorStop(1, 'rgba(14,165,233,0)');
          return g;
        },
        borderWidth: 2.5,
        pointBackgroundColor: SALDO_12.map(v => v >= 0 ? positiveColor : negativeColor),
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        pointBorderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor }, ticks: {
            color: textColor,
            callback: v => `R$ ${(v/1000).toFixed(0)}k`
          }
        }
      }
    }
  });
}

// ── Pie Chart: Despesas por categoria ──
if (document.getElementById('pieChart')) {
  const pizza = PIZZA_DATA;
  if (pizza.length === 0) {
    const canvas = document.getElementById('pieChart');
    const p = document.createElement('p');
    p.textContent = 'Sem despesas neste mês.';
    p.style.cssText = 'text-align:center;color:var(--text-2);padding:60px 0;font-size:14px;';
    canvas.replaceWith(p);
  } else {
    new Chart(document.getElementById('pieChart'), {
      type: 'doughnut',
      data: {
        labels: pizza.map(d => d.name),
        datasets: [{
          data: pizza.map(d => d.total),
          backgroundColor: pizza.map(d => d.color),
          borderColor: surfaceColor,
          borderWidth: 3,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 14, boxWidth: 12, usePointStyle: true, color: textColor }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` R$ ${ctx.raw.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
            }
          }
        }
      }
    });
  }
}

// ── Bar Chart: Receitas vs Despesas ──
if (document.getElementById('barChart')) {
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: BAR_LABELS,
      datasets: [
        {
          label: 'Receitas',
          data: BAR_REC,
          backgroundColor: 'rgba(16,185,129,0.8)',
          borderRadius: 6, borderSkipped: false,
        },
        {
          label: 'Despesas',
          data: BAR_DEP,
          backgroundColor: 'rgba(239,68,68,0.75)',
          borderRadius: 6, borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, color: textColor, padding: 16 }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: v => `R$ ${(v/1000).toFixed(0)}k`
          }
        }
      }
    }
  });
}
