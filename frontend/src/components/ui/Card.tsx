import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  className = '',
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-0-5',
    primary: 'bg-blue-1-5/50 border-blue-2',
    success: 'bg-green-0-5/50 border-green-1',
    warning: 'bg-yellow-2/20 border-yellow-1',
    danger: 'bg-red-1/10 border-red-1',
  };

  return (
    <div className={`rounded-lg border shadow-sm overflow-hidden ${variantClasses[variant]} ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-inherit">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className="px-6 py-5">{children}</div>
      
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-inherit">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 