import React, { useEffect, useRef } from 'react';
import Button from '../common/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Handle click outside of modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-0-5">
          <h2 id="modal-title" className="text-xl font-semibold text-blue-3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-1 hover:text-red-1 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 border-t border-gray-0-5 bg-gray-50 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Example usage with default footer
export const ModalWithDefaultFooter: React.FC<Omit<ModalProps, 'footer'> & {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}> = ({
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  ...props
}) => {
  return (
    <Modal
      {...props}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    />
  );
};

export default Modal; 