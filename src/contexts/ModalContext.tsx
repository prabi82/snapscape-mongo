import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '@/components/Modal';

type ModalType = 'success' | 'warning' | 'info' | 'error' | 'confirm';

interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
  alert: (message: string, title?: string) => void;
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({
    title: '',
    message: '',
    type: 'info',
    onConfirm: undefined,
    onCancel: undefined,
  });

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  const alert = (message: string, title = 'Alert') => {
    showModal({
      title,
      message,
      type: 'info',
    });
  };

  const confirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title = 'Confirm Action'
  ) => {
    showModal({
      title,
      message,
      type: 'confirm',
      onConfirm,
      onCancel,
    });
  };

  const success = (message: string, title = 'Success') => {
    showModal({
      title,
      message,
      type: 'success',
    });
  };

  const error = (message: string, title = 'Error') => {
    showModal({
      title,
      message,
      type: 'error',
    });
  };

  return (
    <ModalContext.Provider
      value={{
        showModal,
        hideModal,
        alert,
        confirm,
        success,
        error,
      }}
    >
      {children}
      <Modal
        open={isOpen}
        title={modalOptions.title || ''}
        message={modalOptions.message}
        type={modalOptions.type}
        onConfirm={modalOptions.onConfirm}
        onCancel={modalOptions.onCancel}
        confirmText={modalOptions.confirmText}
        cancelText={modalOptions.cancelText}
        onClose={hideModal}
      />
    </ModalContext.Provider>
  );
} 