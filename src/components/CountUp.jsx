import React, { useEffect, useState } from 'react';

/**
 * Animates a numeric value from 0 to the target value when mounted or updated.
 */
export const CountUp = ({ value, duration = 600, prefix = "", suffix = "", decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = Number(value) || 0;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = progress * (endValue - startValue) + startValue;
      setDisplayValue(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span>{prefix}{formattedValue}{suffix}</span>;
};

export default CountUp;
