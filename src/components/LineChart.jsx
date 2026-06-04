import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Line chart component showing historical balance trends with a green area gradient.
 */
export const LineChart = ({ data, theme }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Create gradient fill below the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    if (theme === 'dark') {
      gradient.addColorStop(0, 'rgba(0, 212, 170, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 212, 170, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 212, 170, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 212, 170, 0.0)');
    }

    const textColor = '#6B7280';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = theme === 'dark' ? '#111318' : '#FFFFFF';
    const tooltipBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const tooltipText = theme === 'dark' ? '#F0F2F5' : '#0A0B0F';

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Saldo',
          data: data.values,
          borderColor: '#00D4AA',
          borderWidth: 2,
          pointBackgroundColor: '#00D4AA',
          pointHoverRadius: 6,
          fill: true,
          backgroundColor: gradient,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: textColor,
            bodyColor: tooltipText,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 10,
            displayColors: false,
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
                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
                return 'R$ ' + value;
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

export default LineChart;
