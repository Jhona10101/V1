import React from 'react';

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none ${props.className || ''}`}
    />
  );
};

export default Input;
