import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseInputClasses = 'py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors';
  const errorClasses = error 
    ? 'border-red-1 text-red-1 focus:ring-red-1' 
    : 'border-gray-0-5 focus:border-blue-3 focus:ring-blue-3';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-1 mb-1">
          {label}
        </label>
      )}
      <input
        className={`${baseInputClasses} ${errorClasses} ${widthClass} ${className}`}
        {...props}
      />
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-1' : 'text-gray-1'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input; 