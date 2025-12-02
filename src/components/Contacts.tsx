import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ConfirmModal from './ConfirmModal';
import '../assets/css/contacts.css';

interface Contact {
  id: string;
  name: string;
  publicKey: string;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    const stored = localStorage.getItem('piano-crypto-contacts');
    if (stored) {
      try {
        setContacts(JSON.parse(stored));
      } catch (error) {
        console.error('Error al cargar contactos:', error);
        setContacts([]);
      }
    }
  };

  const saveContacts = (newContacts: Contact[]) => {
    localStorage.setItem('piano-crypto-contacts', JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !publicKey.trim()) {
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      publicKey: publicKey.trim(),
    };

    const updatedContacts = [...contacts, newContact];
    saveContacts(updatedContacts);
    setName('');
    setPublicKey('');
  };

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      const updatedContacts = contacts.filter(contact => contact.id !== contactToDelete.id);
      saveContacts(updatedContacts);
      setContactToDelete(null);
      toast.success(`Contacto "${contactToDelete.name}" eliminado`, {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const handleCancelDelete = () => {
    setContactToDelete(null);
  };

  const truncatePublicKey = (key: string, maxLength: number = 30): string => {
    if (key.length <= maxLength) {
      return key;
    }
    return key.substring(0, maxLength) + '...';
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h1>Contactos</h1>
        <p>Gestiona los destinatarios de tus mensajes</p>
      </div>
      
      <div className="contacts-content">
        <div className="contacts-form-section">
          <h2>Nuevo Contacto</h2>
          <form onSubmit={handleSubmit} className="contacts-form">
            <div className="form-group">
              <label htmlFor="contact-name">Nombre</label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del contacto"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact-key">Clave Pública</label>
              <textarea
                id="contact-key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Clave pública del contacto"
                rows={4}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Agregar Contacto
            </button>
          </form>
        </div>

        <div className="contacts-table-section">
          <h2>Lista de Contactos</h2>
          {contacts.length === 0 ? (
            <div className="contacts-empty">
              <p>No hay contactos registrados</p>
              <span>Agrega un contacto usando el formulario</span>
            </div>
          ) : (
            <div className="contacts-table-wrapper">
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Clave Pública</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr 
                      key={contact.id}
                      className="contact-row"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="contact-name">{contact.name}</td>
                      <td className="contact-key">
                        <code title={contact.publicKey}>{truncatePublicKey(contact.publicKey)}</code>
                      </td>
                      <td className="contact-actions">
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDeleteClick(contact, e)}
                          title="Eliminar contacto"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedContact && (
        <div className="contact-modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Clave Pública</h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedContact(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="modal-field">
                <label>Clave Pública</label>
                <div className="modal-key-container">
                  <code className="modal-key">{selectedContact.publicKey}</code>
                  <button
                    className="copy-btn"
                    onClick={async () => {
                      try {

                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(selectedContact.publicKey);
                        } else {
                          // Fallback para navegadores que no soportan navigator.clipboard o contextos no seguros
                          const textArea = document.createElement("textarea");
                          textArea.value = selectedContact.publicKey;
                          
                          // Asegurar que el elemento no sea visible
                          textArea.style.position = "fixed";
                          textArea.style.left = "-9999px";
                          textArea.style.top = "0";
                          
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          
                          try {
                            const successful = document.execCommand('copy');
                            if (!successful) {
                              throw new Error('Falló la copia manual');
                            }
                          } finally {
                            document.body.removeChild(textArea);
                          }
                        }
                        setSelectedContact(null);
                        toast.success('Clave pública copiada al portapapeles', {
                          position: "top-center",
                          autoClose: 2000,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          theme: "dark",
                        });
                      } catch (error) {
                        console.error('Error al copiar:', error);
                        toast.error('Error al copiar la clave pública', {
                          position: "top-center",
                          autoClose: 2000,
                          theme: "dark",
                        });
                      }
                    }}
                    title="Copiar al portapapeles"
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!contactToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar el contacto "${contactToDelete?.name}"? Esta acción es definitiva e irreversible.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="confirm-btn"
      />
    </div>
  );
};

export default Contacts;

