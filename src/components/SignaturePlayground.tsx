import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  generateDilithiumKeyPair,
  signMessage,
  verifySignature,
  serializeDilithiumKeyPair,
  deserializeDilithiumKeyPair,
  serializeDilithiumSignature,
  deserializeDilithiumSignature,
  type DilithiumKeyPairData,
  type DilithiumSignatureData,
  type DilithiumSecurityLevel
} from '../utils/crypto';
import '../assets/css/signaturePlayground.css';

const SignaturePlayground: React.FC = () => {
  const [securityLevel, setSecurityLevel] = useState<DilithiumSecurityLevel>(3);
  const [keyPair, setKeyPair] = useState<DilithiumKeyPairData | null>(null);
  const [serializedKeyPair, setSerializedKeyPair] = useState<string>('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<Uint8Array | null>(null);
  const [serializedSignature, setSerializedSignature] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [publicKeyToVerify, setPublicKeyToVerify] = useState<string>('');
  const [signatureToVerify, setSignatureToVerify] = useState<string>('');
  const [messageToVerify, setMessageToVerify] = useState('');

  const handleGenerateKeys = () => {
    try {
      const newKeyPair = generateDilithiumKeyPair(securityLevel);
      setKeyPair(newKeyPair);
      
      const serialized = serializeDilithiumKeyPair(newKeyPair);
      const base64 = btoa(String.fromCharCode(...serialized));
      setSerializedKeyPair(base64);
      
      setSignature(null);
      setSerializedSignature('');
      setVerificationResult(null);
      
      toast.success('Par de claves generado exitosamente', {
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
    }
  };

  const handleSignMessage = () => {
    if (!keyPair) {
      toast.error('Primero debes generar un par de claves', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    if (!message.trim()) {
      toast.error('Por favor ingresa un mensaje para firmar', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = signMessage(messageBytes, keyPair.privateKey, securityLevel);
      
      setSignature(signatureBytes);
      
      const signatureData: DilithiumSignatureData = {
        signature: signatureBytes,
        message: messageBytes
      };
      const serialized = serializeDilithiumSignature(signatureData);
      const base64 = btoa(String.fromCharCode(...serialized));
      setSerializedSignature(base64);
      
      setVerificationResult(null);
      
      toast.success('Mensaje firmado exitosamente', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error al firmar:', error);
      toast.error(`Error al firmar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  const handleVerifySignature = () => {
    if (!keyPair) {
      toast.error('Primero debes generar un par de claves', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    if (!signature) {
      toast.error('Primero debes firmar un mensaje', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const isValid = verifySignature(messageBytes, signature, keyPair.publicKey, securityLevel);
      
      setVerificationResult(isValid);
      
      if (isValid) {
        toast.success('✅ Firma válida', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
      } else {
        toast.error('❌ Firma inválida', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error('Error al verificar:', error);
      toast.error(`Error al verificar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
      setVerificationResult(false);
    }
  };

  const handleVerifyCustom = () => {
    if (!publicKeyToVerify.trim() || !signatureToVerify.trim() || !messageToVerify.trim()) {
      toast.error('Por favor completa todos los campos', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const publicKeyBytes = Uint8Array.from(atob(publicKeyToVerify), c => c.charCodeAt(0));
      const signatureBytes = Uint8Array.from(atob(signatureToVerify), c => c.charCodeAt(0));
      const messageBytes = new TextEncoder().encode(messageToVerify);
      
      const isValid = verifySignature(messageBytes, signatureBytes, publicKeyBytes, securityLevel);
      
      if (isValid) {
        toast.success('✅ Firma válida', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
      } else {
        toast.error('❌ Firma inválida', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error('Error al verificar:', error);
      toast.error(`Error al verificar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  const handleDeserializeKeyPair = () => {
    if (!serializedKeyPair.trim()) {
      toast.error('No hay datos serializados para deserializar', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const binaryString = atob(serializedKeyPair);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const deserialized = deserializeDilithiumKeyPair(bytes);
      
      if (!deserialized) {
        toast.error('Error al deserializar el par de claves', {
          position: "top-center",
          autoClose: 2000,
          theme: "dark",
        });
        return;
      }

      setKeyPair(deserialized);
      toast.success('Par de claves deserializado exitosamente', {
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

  const formatUint8ArrayToBase64 = (arr: Uint8Array): string => {
    return btoa(String.fromCharCode(...arr));
  };

  const clearAll = () => {
    setKeyPair(null);
    setSerializedKeyPair('');
    setMessage('');
    setSignature(null);
    setSerializedSignature('');
    setVerificationResult(null);
    setPublicKeyToVerify('');
    setSignatureToVerify('');
    setMessageToVerify('');
    toast.info('Datos limpiados', {
      position: "top-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  return (
    <div className="signature-playground">
      <div className="playground-header">
        <h1>✍️ Signature Playground</h1>
        <p>Prueba el sistema de firmas digitales post-cuánticas con Dilithium</p>
      </div>

      <div className="playground-content">
        <div className="playground-section">
          <h2>Configuración</h2>
          <div className="input-group">
            <label htmlFor="security-level">Nivel de Seguridad</label>
            <select
              id="security-level"
              value={securityLevel}
              onChange={(e) => setSecurityLevel(Number(e.target.value) as DilithiumSecurityLevel)}
            >
              <option value={2}>Nivel 2 (Menor seguridad, claves más pequeñas)</option>
              <option value={3}>Nivel 3 (Recomendado, balance óptimo)</option>
              <option value={5}>Nivel 5 (Mayor seguridad, claves más grandes)</option>
            </select>
          </div>
          <div className="action-buttons">
            <button className="generate-btn" onClick={handleGenerateKeys}>
              🔑 Generar Par de Claves
            </button>
            <button className="clear-btn" onClick={clearAll}>
              🗑️ Limpiar Todo
            </button>
          </div>
        </div>

        <div className="playground-section">
          <h2>Par de Claves</h2>
          {keyPair ? (
            <div className="keys-display">
              <div className="data-field">
                <label>Clave Pública (Base64)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8ArrayToBase64(keyPair.publicKey)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8ArrayToBase64(keyPair.publicKey), 'Clave pública')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Clave Privada (Base64)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8ArrayToBase64(keyPair.privateKey)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8ArrayToBase64(keyPair.privateKey), 'Clave privada')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Clave Pública (Hex)</label>
                <div className="data-value-container">
                  <code className="data-value long-value">{formatUint8Array(keyPair.publicKey)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(keyPair.publicKey), 'Clave pública (hex)')}
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay claves generadas. Genera un par de claves primero.</p>
            </div>
          )}
        </div>

        <div className="playground-section">
          <h2>Firmar Mensaje</h2>
          <div className="input-group">
            <label htmlFor="message">Mensaje a Firmar</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ingresa el mensaje que deseas firmar"
              rows={4}
            />
          </div>
          <div className="action-buttons">
            <button className="sign-btn" onClick={handleSignMessage} disabled={!keyPair}>
              ✍️ Firmar Mensaje
            </button>
          </div>
          {signature && (
            <div className="signature-display">
              <div className="data-field">
                <label>Firma (Base64)</label>
                <div className="data-value-container">
                  <code className="data-value">{formatUint8ArrayToBase64(signature)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8ArrayToBase64(signature), 'Firma')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="data-field">
                <label>Firma (Hex)</label>
                <div className="data-value-container">
                  <code className="data-value long-value">{formatUint8Array(signature)}</code>
                  <button
                    className="copy-btn-small"
                    onClick={() => handleCopyToClipboard(formatUint8Array(signature), 'Firma (hex)')}
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="playground-section">
          <h2>Verificar Firma</h2>
          {signature && keyPair ? (
            <div className="verification-section">
              <div className="action-buttons">
                <button className="verify-btn" onClick={handleVerifySignature}>
                  ✅ Verificar Firma Actual
                </button>
              </div>
              {verificationResult !== null && (
                <div className={`verification-result ${verificationResult ? 'success' : 'error'}`}>
                  {verificationResult ? (
                    <div className="success-badge">✅ Firma válida</div>
                  ) : (
                    <div className="error-badge">❌ Firma inválida</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Firma un mensaje primero para verificar.</p>
            </div>
          )}
        </div>

        <div className="playground-section">
          <h2>Verificación Personalizada</h2>
          <div className="input-group">
            <label htmlFor="public-key-verify">Clave Pública (Base64)</label>
            <textarea
              id="public-key-verify"
              value={publicKeyToVerify}
              onChange={(e) => setPublicKeyToVerify(e.target.value)}
              placeholder="Pega la clave pública en Base64"
              rows={3}
            />
          </div>
          <div className="input-group">
            <label htmlFor="signature-verify">Firma (Base64)</label>
            <textarea
              id="signature-verify"
              value={signatureToVerify}
              onChange={(e) => setSignatureToVerify(e.target.value)}
              placeholder="Pega la firma en Base64"
              rows={3}
            />
          </div>
          <div className="input-group">
            <label htmlFor="message-verify">Mensaje</label>
            <textarea
              id="message-verify"
              value={messageToVerify}
              onChange={(e) => setMessageToVerify(e.target.value)}
              placeholder="Ingresa el mensaje original"
              rows={3}
            />
          </div>
          <div className="action-buttons">
            <button className="verify-custom-btn" onClick={handleVerifyCustom}>
              🔍 Verificar
            </button>
          </div>
        </div>

        <div className="playground-section">
          <h2>Datos Serializados</h2>
          <div className="input-group">
            <label>Par de Claves Serializado (Base64)</label>
            <textarea
              value={serializedKeyPair}
              onChange={(e) => setSerializedKeyPair(e.target.value)}
              placeholder="Los datos serializados aparecerán aquí después de generar claves"
              rows={4}
              readOnly={!!keyPair}
            />
            {serializedKeyPair && (
              <div className="action-buttons">
                <button
                  className="copy-btn"
                  onClick={() => handleCopyToClipboard(serializedKeyPair, 'Par de claves serializado')}
                >
                  📋 Copiar Base64
                </button>
                {!keyPair && (
                  <button className="deserialize-btn" onClick={handleDeserializeKeyPair}>
                    🔄 Deserializar
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="input-group">
            <label>Firma Serializada (Base64)</label>
            <textarea
              value={serializedSignature}
              onChange={(e) => setSerializedSignature(e.target.value)}
              placeholder="Los datos serializados aparecerán aquí después de firmar"
              rows={4}
              readOnly={!!signature}
            />
            {serializedSignature && (
              <button
                className="copy-btn"
                onClick={() => handleCopyToClipboard(serializedSignature, 'Firma serializada')}
              >
                📋 Copiar Base64
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePlayground;

