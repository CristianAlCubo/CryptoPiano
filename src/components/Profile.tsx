import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../assets/css/profile.css';

const Profile: React.FC = () => {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importPublicKey, setImportPublicKey] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    const storedPublic = localStorage.getItem('piano-crypto-own-public-key');
    const storedPrivate = localStorage.getItem('piano-crypto-own-private-key');
    
    if (storedPublic) {
      setPublicKey(storedPublic);
    }
    if (storedPrivate) {
      setPrivateKey(storedPrivate);
    }
  };

  const saveKeys = (pubKey: string, privKey: string) => {
    localStorage.setItem('piano-crypto-own-public-key', pubKey);
    localStorage.setItem('piano-crypto-own-private-key', privKey);
    setPublicKey(pubKey);
    setPrivateKey(privKey);
  };

  const handleGenerateKeys = () => {
    const mockPublicKey = 'OWN_PUBLIC_KEY';
    const mockPrivateKey = 'OWN_PRIVATE_KEY';
    
    saveKeys(mockPublicKey, mockPrivateKey);
    toast.success('Claves generadas exitosamente', {
      position: "top-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPublicKey.trim() || !importPrivateKey.trim()) {
      toast.error('Por favor completa ambos campos', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    saveKeys(importPublicKey.trim(), importPrivateKey.trim());
    setImportPublicKey('');
    setImportPrivateKey('');
    setShowImportForm(false);
    toast.success('Claves importadas exitosamente', {
      position: "top-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  const handleDeleteKeys = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tus claves? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('piano-crypto-own-public-key');
      localStorage.removeItem('piano-crypto-own-private-key');
      setPublicKey('');
      setPrivateKey('');
      setShowImportForm(false);
      toast.success('Claves eliminadas', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const handleCopyKey = async (key: string, type: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success(`${type} copiada al portapapeles`, {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar la clave', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const hasKeys = publicKey && privateKey;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Perfil</h1>
        <p>Gestiona tus claves criptográficas</p>
      </div>

      {!hasKeys ? (
        <div className="profile-setup">
          <div className="setup-options">
            <div className="setup-card">
              <div className="card-icon">🔑</div>
              <h2>Generar Claves</h2>
              <p>Crea un nuevo par de claves automáticamente</p>
              <button className="generate-btn" onClick={handleGenerateKeys}>
                Generar Claves
              </button>
            </div>

            <div className="setup-card">
              <div className="card-icon">📥</div>
              <h2>Importar Claves</h2>
              <p>Carga tus claves existentes</p>
              <button 
                className="import-btn"
                onClick={() => setShowImportForm(true)}
              >
                Importar Claves
              </button>
            </div>
          </div>

          {showImportForm && (
            <div className="import-form-section">
              <h2>Importar Claves</h2>
              <form onSubmit={handleImportSubmit} className="import-form">
                <div className="form-group">
                  <label htmlFor="import-public">Clave Pública</label>
                  <textarea
                    id="import-public"
                    value={importPublicKey}
                    onChange={(e) => setImportPublicKey(e.target.value)}
                    placeholder="Ingresa tu clave pública"
                    rows={4}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="import-private">Clave Privada</label>
                  <textarea
                    id="import-private"
                    value={importPrivateKey}
                    onChange={(e) => setImportPrivateKey(e.target.value)}
                    placeholder="Ingresa tu clave privada"
                    rows={4}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Guardar Claves
                  </button>
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowImportForm(false);
                      setImportPublicKey('');
                      setImportPrivateKey('');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="profile-keys">
          <div className="keys-section">
            <div className="key-card">
              <div className="key-header">
                <h3>Clave Pública</h3>
                <button
                  className="copy-key-btn"
                  onClick={() => handleCopyKey(publicKey, 'Clave pública')}
                  title="Copiar clave pública"
                >
                  📋 Copiar
                </button>
              </div>
              <div className="key-content">
                <code className="key-display">{publicKey}</code>
              </div>
            </div>

            <div className="key-card">
              <div className="key-header">
                <h3>Clave Privada</h3>
                <button
                  className="copy-key-btn"
                  onClick={() => handleCopyKey(privateKey, 'Clave privada')}
                  title="Copiar clave privada"
                >
                  📋 Copiar
                </button>
              </div>
              <div className="key-content">
                <code className="key-display">{privateKey}</code>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="delete-keys-btn" onClick={handleDeleteKeys}>
              🗑️ Eliminar Claves
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

