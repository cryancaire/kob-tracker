import React from 'react';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "Cancel"
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <p className="modal-description">{description}</p>
        </div>
        
        <div className="modal-footer">
          <Button
            onClick={onClose}
            variant="outline"
            className="btn btn-outline"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="destructive"
            className="btn btn-destructive"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}