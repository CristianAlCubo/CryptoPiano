import React, { useState, useEffect } from 'react';
import '../assets/css/contactSelectorModal.css';

interface Contact {
  id: string;
  name: string;
  publicKey: string;
}

interface ContactSelectorModalProps {
  isOpen: boolean;
  onConfirm: (contactId: string) => void;
  onCancel: () => void;
}

const ContactSelectorModal: React.FC<ContactSelectorModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = () => {
    const stored = localStorage.getItem('piano-crypto-contacts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContacts(parsed);
      } catch (error) {
        console.error('Error al cargar contactos:', error);
        setContacts([]);
      }
    } else {
      setContacts([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContactId) {
      onConfirm(selectedContactId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-selector-overlay" onClick={onCancel}>
      <div 
        className="contact-selector-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="contact-selector-header">
          <h2>Seleccionar Contacto</h2>
          <button className="contact-selector-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="contact-selector-form">
          <p className="contact-selector-message">
            Selecciona el contacto que envió este mensaje para verificar la firma:
          </p>
          {contacts.length === 0 ? (
            <div className="no-contacts-message">
              <p>No hay contactos registrados.</p>
              <p>Agrega contactos en la sección de Contactos primero.</p>
            </div>
          ) : (
            <div className="contacts-list">
              {contacts.map((contact) => (
                <label key={contact.id} className="contact-option">
                  <input
                    type="radio"
                    name="contact"
                    value={contact.id}
                    checked={selectedContactId === contact.id}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                  />
                  <span className="contact-option-name">{contact.name}</span>
                </label>
              ))}
            </div>
          )}
          <div className="contact-selector-actions">
            <button
              type="submit"
              className="contact-confirm-btn"
              disabled={!selectedContactId || contacts.length === 0}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="contact-cancel-btn"
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

export default ContactSelectorModal;

