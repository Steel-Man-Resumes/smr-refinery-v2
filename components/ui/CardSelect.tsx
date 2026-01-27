import React, { useState } from 'react';
import Textarea from './Textarea';

interface CardSelectProps {
  id: string;
  label: string;
  icon?: string;
  selected: boolean;
  onSelect: () => void;
  conditionalPrompt?: string | null;
  conditionalValue?: string;
  onConditionalChange?: (value: string) => void;
  disabled?: boolean;
}

export default function CardSelect({
  id,
  label,
  icon,
  selected,
  onSelect,
  conditionalPrompt,
  conditionalValue = '',
  onConditionalChange,
  disabled = false,
}: CardSelectProps) {
  return (
    <div className="w-full">
      <div
        onClick={disabled ? undefined : onSelect}
        className={`card ${selected ? 'selected' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <span className="text-paperWhite font-medium">{label}</span>
        </div>
      </div>

      {/* Conditional text field - appears when selected */}
      {selected && conditionalPrompt && onConditionalChange && (
        <div className="mt-3 ml-4 animate-fade-in">
          <Textarea
            value={conditionalValue}
            onChange={onConditionalChange}
            placeholder={conditionalPrompt}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
