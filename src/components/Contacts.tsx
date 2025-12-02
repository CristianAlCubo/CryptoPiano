import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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

  const handleDelete = (id: string) => {
    const updatedContacts = contacts.filter(contact => contact.id !== id);
    saveContacts(updatedContacts);
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h1>Contactos</h1>
        <p>Gestiona los destinatarios de tus mensajes</p>
      </div>
      
      <div className="contacts-content">
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
                        <code>{contact.publicKey}</code>
                      </td>
                      <td className="contact-actions">
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(contact.id);
                          }}
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
                        await navigator.clipboard.writeText(selectedContact.publicKey);
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
    </div>
  );
};

export default Contacts;

