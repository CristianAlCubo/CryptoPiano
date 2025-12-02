import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { extractMessageFromWav } from "../utils/steganography";
import { 
  deserializeEncryptedData, 
  decryptWithPassword,
  deserializeSignedMessage,
  verifySignature
} from "../utils/crypto";
import MessageViewer from "./MessageViewer";
import PasswordModal from "./PasswordModal";
import ContactSelectorModal from "./ContactSelectorModal";
import "../assets/css/messageExtractor.css";

interface Contact {
  id: string;
  name: string;
  publicKey: string;
}

const MessageExtractor: React.FC = () => {
  const [extractedMessage, setExtractedMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [encryptedBytes, setEncryptedBytes] = useState<Uint8Array | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<{
    verified: boolean;
    contactName?: string;
  } | null>(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldShowModal && encryptedBytes && !isProcessing) {
      setShowPasswordModal(true);
      setShouldShowModal(false);
    }
  }, [shouldShowModal, encryptedBytes, isProcessing]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("audio") && !file.name.endsWith(".wav")) {
      setError("Por favor, selecciona un archivo de audio WAV");
      return;
    }

    setShowPasswordModal(false);
    setShouldShowModal(false);
    setEncryptedBytes(null);
    setError(null);
    setExtractedMessage(null);
    setIsProcessing(true);

    try {
      const extracted = await extractMessageFromWav(file, true);
      if (
        extracted &&
        extracted instanceof Uint8Array &&
        extracted.length > 0
      ) {
        const encryptedData = deserializeEncryptedData(extracted);

        if (encryptedData) {
          setEncryptedBytes(extracted);
          setIsProcessing(false);
          setShouldShowModal(true);
        } else {
          try {
            const textMessage = new TextDecoder().decode(extracted);
            if (textMessage && textMessage.trim().length > 0) {
              setExtractedMessage(textMessage);
            } else {
              setError(
                "No se encontró ningún mensaje oculto en el archivo de audio"
              );
            }
          } catch {
            setError(
              "No se encontró ningún mensaje oculto en el archivo de audio"
            );
          }
        }
      } else {
        setError("No se encontró ningún mensaje oculto en el archivo de audio");
      }
    } catch (err) {
      setError(
        "Error al procesar el archivo. Asegúrate de que sea un archivo WAV válido."
      );
      console.error("Error al extraer mensaje:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordConfirm = (password: string) => {
    if (!encryptedBytes) return;

    setShowPasswordModal(false);
    setIsProcessing(true);
    setError(null);

    try {
      const encryptedData = deserializeEncryptedData(encryptedBytes);

      if (!encryptedData) {
        setError(
          "Error al deserializar los datos cifrados. El archivo puede estar corrupto."
        );
        setIsProcessing(false);
        return;
      }

      const decrypted = decryptWithPassword(
        password,
        encryptedData.encryptedData,
        encryptedData.salt
      );

      if (!decrypted) {
        setError("Contraseña incorrecta. Por favor, intenta de nuevo.");
        setIsProcessing(false);
        return;
      }

      setDecryptedBytes(decrypted);
      setIsProcessing(false);
      setShowContactSelector(true);
    } catch (err) {
      setError(
        "Error al descifrar el mensaje. La contraseña puede ser incorrecta."
      );
      console.error("Error al descifrar:", err);
      setIsProcessing(false);
    }
  };

  const handleContactSelect = (contactId: string) => {
    if (!decryptedBytes) return;

    setShowContactSelector(false);
    setIsProcessing(true);
    setError(null);

    try {
      const stored = localStorage.getItem('piano-crypto-contacts');
      if (!stored) {
        setError("No se encontraron contactos. No se puede verificar la firma.");
        setIsProcessing(false);
        return;
      }

      const contacts: Contact[] = JSON.parse(stored);
      const contact = contacts.find(c => c.id === contactId);

      if (!contact) {
        setError("Contacto no encontrado.");
        setIsProcessing(false);
        return;
      }

      const signedMessage = deserializeSignedMessage(decryptedBytes);

      if (!signedMessage) {
        setError("Error al deserializar el mensaje firmado. El mensaje puede estar corrupto.");
        setIsProcessing(false);
        return;
      }

      const publicKeyBytes = Uint8Array.from(atob(contact.publicKey), c => c.charCodeAt(0));
      const isValid = verifySignature(
        signedMessage.message,
        signedMessage.signature,
        publicKeyBytes,
        3
      );

      setSignatureStatus({
        verified: isValid,
        contactName: contact.name
      });

      const message = new TextDecoder().decode(signedMessage.message);
      setExtractedMessage(message);

      if (isValid) {
        toast.success(`✅ Firma verificada. Mensaje auténtico de ${contact.name}`, {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      } else {
        toast.error(`❌ Firma inválida. El mensaje puede haber sido modificado.`, {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (err) {
      setError("Error al verificar la firma. Por favor, intenta de nuevo.");
      console.error("Error al verificar firma:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleReset = () => {
    setExtractedMessage(null);
    setError(null);
    setEncryptedBytes(null);
    setDecryptedBytes(null);
    setSignatureStatus(null);
    setShowPasswordModal(false);
    setShowContactSelector(false);
    setShouldShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="message-extractor-container">
      <div className="extractor-header">
        <h1>Extraer Mensaje</h1>
        <p>Sube un archivo WAV para extraer el mensaje oculto</p>
      </div>

      <div className="extractor-content">
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,.wav,audio/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            className="upload-btn"
            onClick={handleUploadClick}
            disabled={isProcessing}
          >
            {isProcessing ? "⏳ Procesando..." : "📁 Subir archivo WAV"}
          </button>

          <PasswordModal
            isOpen={showPasswordModal}
            onConfirm={handlePasswordConfirm}
            onCancel={() => {
              setShowPasswordModal(false);
              setEncryptedBytes(null);
            }}
            title="Descifrar Mensaje"
            message="Ingresa la contraseña para descifrar el mensaje oculto:"
          />

          <ContactSelectorModal
            isOpen={showContactSelector}
            onConfirm={handleContactSelect}
            onCancel={() => {
              setShowContactSelector(false);
              setDecryptedBytes(null);
            }}
          />
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {extractedMessage && (
          <div className="extracted-content">
            <div className="extracted-header">
              <h2>Mensaje extraído:</h2>
              <button className="reset-btn" onClick={handleReset}>
                ✕ Cerrar
              </button>
            </div>
            {signatureStatus && (
              <div className={`signature-status ${signatureStatus.verified ? 'verified' : 'invalid'}`}>
                {signatureStatus.verified ? (
                  <div className="status-verified">
                    ✅ <strong>Firma verificada</strong>
                    <span>Mensaje auténtico de {signatureStatus.contactName}</span>
                  </div>
                ) : (
                  <div className="status-invalid">
                    ❌ <strong>Firma inválida</strong>
                    <span>El mensaje puede haber sido modificado o la clave pública no corresponde</span>
                  </div>
                )}
              </div>
            )}
            <div className="extracted-viewer">
              <MessageViewer content={extractedMessage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageExtractor;
