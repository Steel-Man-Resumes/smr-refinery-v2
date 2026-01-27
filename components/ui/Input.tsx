import React, { useState } from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'tel' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  conditionalReveal?: boolean; // Shows input only when parent condition is met
}

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label,
  required = false,
  disabled = false,
  className = '',
  conditionalReveal = false,
}: InputProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-paperWhite text-sm font-medium mb-2">
          {label}
          {required && <span className="text-trashRed ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="glass-input"
      />
    </div>
  );
}
