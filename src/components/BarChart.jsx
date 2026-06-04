import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * BarChart component showing side-by-side comparison of Revenues and Expenses.
 */
export const BarChart = ({ data, theme }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const textColor = '#6B7280';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = theme === 'dark' ? '#111318' : '#FFFFFF';
    const tooltipBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const tooltipText = theme === 'dark' ? '#F0F2F5' : '#0A0B0F';

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Receitas',
            data: data.revenues,
            backgroundColor: '#00D4AA',
            borderRadius: 4,
            borderWidth: 0,
            barPercentage: 0.8,
            categoryPercentage: 0.6
          },
          {
            label: 'Despesas',
            data: data.expenses,
            backgroundColor: '#FF4D6A',
            borderRadius: 4,
            borderWidth: 0,
            barPercentage: 0.8,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              color: theme === 'dark' ? '#F0F2F5' : '#0A0B0F',
              font: {
                family: 'DM Sans',
                size: 12,
                weight: '500'
              },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: textColor,
            bodyColor: tooltipText,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: 'DM Sans',
              weight: '500'
            },
            bodyFont: {
              family: 'DM Mono'
            },
            callbacks: {
              label: function(context) {
                let value = context.parsed.y;
                return ' ' + context.dataset.label + ': ' + value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor,
              font: {
                family: 'DM Sans',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: 'DM Mono',
                size: 11
              },
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, theme]);

  return <canvas ref={canvasRef} />;
};

export default BarChart;
