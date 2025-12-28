import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div onClick={onClick} className={`bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};