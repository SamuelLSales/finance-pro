import React from 'react';
import * as Icons from 'lucide-react';

/**
 * Renders a Lucide icon dynamically based on its string name.
 */
export const CategoryIcon = ({ name, size = 18, className = "" }) => {
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export default CategoryIcon;
