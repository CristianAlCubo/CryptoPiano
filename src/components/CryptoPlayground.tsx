import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  encryptWithPassword,
  decryptWithPassword,
  serializeEncryptedData,
  deserializeEncryptedData,
  type PasswordEncryptedData
} from '../utils/crypto';
import '../assets/css/cryptoPlayground.css';

const CryptoPlayground: React.FC = () => {
  const [password, setPassword] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [encryptedData, setEncryptedData] = useState<PasswordEncryptedData | null>(null);
  const [serializedData, setSerializedData] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [associatedData, setAssociatedData] = useState('');

  const handleEncrypt = () => {
    if (!password.trim()) {
      toast.error('Por favor ingresa una contraseña', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    if (!plaintext.trim()) {
      toast.error('Por favor ingresa un texto para encriptar', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const plaintextBytes = new TextEncoder().encode(plaintext);
      const ad = associatedData.trim() || '';
      
      const encrypted = encryptWithPassword(password, plaintextBytes, ad);
      setEncryptedData(encrypted);
      
      const serialized = serializeEncryptedData(encrypted);
      const base64 = btoa(String.fromCharCode(...serialized));
      setSerializedData(base64);
      
      setDecryptedText('');
      
      toast.success('Datos encriptados exitosamente', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al encriptar:', error);
      toast.error(`Error al encriptar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  const handleDecrypt = () => {
    if (!password.trim()) {
      toast.error('Por favor ingresa una contraseña', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    if (!encryptedData) {
      toast.error('No hay datos encriptados para desencriptar', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const ad = associatedData.trim() || '';
      const decrypted = decryptWithPassword(
        password,
        encryptedData.encryptedData,
        encryptedData.salt,
        ad
      );

      if (!decrypted) {
        toast.error('Error al desencriptar. Verifica la contraseña o los datos asociados', {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
        setDecryptedText('');
        return;
      }

      const decryptedString = new TextDecoder().decode(decrypted);
      setDecryptedText(decryptedString);
      
      toast.success('Datos desencriptados exitosamente', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al desencriptar:', error);
      toast.error(`Error al desencriptar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
      setDecryptedText('');
    }
  };

  const handleDeserialize = () => {
    if (!serializedData.trim()) {
      toast.error('No hay datos serializados para deserializar', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const binaryString = atob(serializedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const deserialized = deserializeEncryptedData(bytes);
      
      if (!deserialized) {
        toast.error('Error al deserializar los datos', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
        return;
      }

      setEncryptedData(deserialized);
      toast.success('Datos deserializados exitosamente', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al deserializar:', error);
      toast.error(`Error al deserializar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles`, {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar al portapapeles', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const formatUint8Array = (arr: Uint8Array): string => {
    return Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
  };

  const clearAll = () => {
    setPassword('');
    setPlaintext('');
    setEncryptedData(null);
    setSerializedData('');
    setDecryptedText('');
    setAssociatedData('');
    toast.info('Datos limpiados', {
      position: "top-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  return (
    <div className="crypto-playground">
      <div className="playground-header">
        <h1>🔐 Crypto Playground</h1>
        <p>Prueba el módulo de criptografía en tiempo real</p>
      </div>

      <div className="playground-content">
        <div className="playground-section">
          <h2>Entrada</h2>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
            />
          </div>
          <div className="input-group">
            <label htmlFor="associated-data">Datos Asociados (opcional)</label>
            <input
              id="associated-data"
              type="text"
              value={associatedData}
              onChange={(e) => setAssociatedData(e.target.value)}
              placeholder="Datos asociados para autenticación"
            />
          </div>
          <div className="input-group">
            <label htmlFor="plaintext">Texto a Encriptar</label>
            <textarea
              id="plaintext"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Ingresa el texto que deseas encriptar"
              rows={4}
            />
          </div>
          <div className="action-buttons">
            <button className="encrypt-btn" onClick={handleEncrypt}>
              🔒 Encriptar
            </button>
            <button className="clear-btn" onClick={clearAll}>
              🗑️ Limpiar Todo
            </button>
          </div>
        </div>

        <div className="playground-section">
          <h2>Datos Encriptados</h2>
          {encryptedData ? (
            <div className="encrypted-data-display">
              <div className="data-field">
                <label>Salt (hex)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8Array(encryptedData.salt)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(encryptedData.salt), 'Salt')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Nonce (hex)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8Array(encryptedData.encryptedData.nonce)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(encryptedData.encryptedData.nonce), 'Nonce')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Tag (hex)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8Array(encryptedData.encryptedData.tag)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(encryptedData.encryptedData.tag), 'Tag')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Ciphertext (hex)</label>
                <div className="data-value-container">
                  <code className="data-value long-value">{formatUint8Array(encryptedData.encryptedData.ciphertext)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(encryptedData.encryptedData.ciphertext), 'Ciphertext')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="action-buttons">
                <button className="decrypt-btn" onClick={handleDecrypt}>
                  🔓 Desencriptar
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay datos encriptados. Encripta un texto primero.</p>
            </div>
          )}
        </div>

        <div className="playground-section">
          <h2>Datos Serializados (Base64)</h2>
          <div className="input-group">
            <textarea
              value={serializedData}
              onChange={(e) => setSerializedData(e.target.value)}
              placeholder="Los datos serializados aparecerán aquí después de encriptar"
              rows={6}
              readOnly={!!encryptedData}
            />
            {serializedData && (
              <div className="action-buttons">
                <button
                  className="copy-btn"
                  onClick={() => handleCopyToClipboard(serializedData, 'Datos serializados')}
                >
                  📋 Copiar Base64
                </button>
                {!encryptedData && (
                  <button className="deserialize-btn" onClick={handleDeserialize}>
                    🔄 Deserializar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="playground-section">
          <h2>Texto Desencriptado</h2>
          {decryptedText ? (
            <div className="decrypted-display">
              <div className="data-field">
                <label>Resultado</label>
                <div className="data-value-container">
                  <code className="data-value decrypted-text">{decryptedText}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(decryptedText, 'Texto desencriptado')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="verification">
                {decryptedText === plaintext ? (
                  <div className="success-badge">✅ Coincide con el texto original</div>
                ) : (
                  <div className="error-badge">❌ No coincide con el texto original</div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay texto desencriptado. Desencripta los datos primero.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoPlayground;

