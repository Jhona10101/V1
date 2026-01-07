import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className = '', ...rest }) => {
  return (
    <label className={`text-xs font-medium text-slate-400 ${className}`} {...rest}>
      {children}
    </label>
  );
};

export default Label;
