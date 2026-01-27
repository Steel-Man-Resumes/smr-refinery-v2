import React from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export default function Textarea({
  value,
  onChange,
  placeholder = '',
  label,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
}: TextareaProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-paperWhite text-sm font-medium mb-2">
          {label}
          {required && <span className="text-trashRed ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className="glass-input resize-y min-h-[100px]"
      />
    </div>
  );
}
