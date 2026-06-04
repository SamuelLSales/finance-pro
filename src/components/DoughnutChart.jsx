import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Doughnut chart component showing categorical expense distributions.
 */
export const DoughnutChart = ({ data, theme }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const tooltipBg = theme === 'dark' ? '#111318' : '#FFFFFF';
    const tooltipBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const tooltipText = theme === 'dark' ? '#F0F2F5' : '#0A0B0F';

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.colors,
          borderWidth: theme === 'dark' ? 2 : 1,
          borderColor: theme === 'dark' ? '#111318' : '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false // Custom legend rendered in React
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#6B7280',
            bodyColor: tooltipText,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 10,
            titleFont: {
              family: 'DM Sans',
              weight: '500'
            },
            bodyFont: {
              family: 'DM Mono'
            },
            callbacks: {
              label: function(context) {
                let value = context.parsed;
                return ' ' + value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export default DoughnutChart;
