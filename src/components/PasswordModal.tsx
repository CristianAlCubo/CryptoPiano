import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/passwordModal.css';

interface PasswordModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Ingresar Contraseña',
  message = 'Ingresa la contraseña para cifrar el mensaje:'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="password-modal-overlay" onClick={onCancel}>
      <div className="password-modal-content" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="password-modal-header">
          <h2>{title}</h2>
          <button className="password-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="password-modal-form">
          <p className="password-modal-message">{message}</p>
          <div className="password-input-wrapper">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="password-input"
              autoComplete="off"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div className="password-modal-actions">
            <button
              type="submit"
              className="password-confirm-btn"
              disabled={!password.trim()}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="password-cancel-btn"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;

