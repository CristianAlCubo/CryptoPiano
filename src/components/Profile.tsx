import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  generateDilithiumKeyPair,
  type DilithiumSecurityLevel
} from '../utils/crypto';
import '../assets/css/profile.css';

const Profile: React.FC = () => {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importPublicKey, setImportPublicKey] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [securityLevel, setSecurityLevel] = useState<DilithiumSecurityLevel>(3);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    try {
      const keyPair = generateDilithiumKeyPair(securityLevel);
      
      const publicKeyBase64 = btoa(String.fromCharCode(...keyPair.publicKey));
      const privateKeyBase64 = btoa(String.fromCharCode(...keyPair.privateKey));
      
      saveKeys(publicKeyBase64, privateKeyBase64);
      toast.success('Par de claves Dilithium generado exitosamente', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al generar claves:', error);
      toast.error(`Error al generar claves: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsGenerating(false);
    }
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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(key);
      } else {
        // Fallback para navegadores que no soportan navigator.clipboard o contextos no seguros
        const textArea = document.createElement("textarea");
        textArea.value = key;
        
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
        <p>Gestiona tus claves criptográficas post-cuánticas (Dilithium)</p>
      </div>

      {!hasKeys ? (
        <div className="profile-setup">
          <div className="setup-options">
            <div className="setup-card">
              <div className="card-icon">🔑</div>
              <h2>Generar Claves Dilithium</h2>
              <p>Crea un nuevo par de claves post-cuánticas automáticamente</p>
              <div className="security-level-selector">
                <label htmlFor="security-level">Nivel de Seguridad:</label>
                <select
                  id="security-level"
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(Number(e.target.value) as DilithiumSecurityLevel)}
                  disabled={isGenerating}
                >
                  <option value={2}>Nivel 2 (Menor seguridad, claves más pequeñas)</option>
                  <option value={3}>Nivel 3 (Recomendado, balance óptimo)</option>
                  <option value={5}>Nivel 5 (Mayor seguridad, claves más grandes)</option>
                </select>
              </div>
              <button 
                className="generate-btn" 
                onClick={handleGenerateKeys}
                disabled={isGenerating}
              >
                {isGenerating ? '⏳ Generando...' : 'Generar Claves'}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyKey(publicKey, 'Clave pública');
                  }}
                  title="Copiar clave pública"
                >
                  📋 Copiar
                </button>
              </div>
              <div className="key-content">
                <div className="key-display">{publicKey}</div>
              </div>
            </div>

            <div className="key-card">
              <div className="key-header">
                <h3>Clave Privada</h3>
                <button
                  className="copy-key-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyKey(privateKey, 'Clave privada');
                  }}
                  title="Copiar clave privada"
                >
                  📋 Copiar
                </button>
              </div>
              <div className="key-content">
                <div className="key-display">{privateKey}</div>
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

