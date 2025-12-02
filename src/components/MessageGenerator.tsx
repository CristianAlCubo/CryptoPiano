import React, { useState } from "react";
import { toast } from "react-toastify";
import TextEditor from "./TextEditor";
import MessageViewer from "./MessageViewer";
import PasswordModal from "./PasswordModal";
import ConfirmModal from "./ConfirmModal";
import { 
  encryptWithPassword, 
  serializeEncryptedData,
  createSignedMessage,
  serializeSignedMessage
} from "../utils/crypto";
import "../assets/css/messageGenerator.css";

interface MessageGeneratorProps {
  onFinish: (encryptedData: Uint8Array) => void;
  onCancel?: () => void;
}

const MessageGenerator: React.FC<MessageGeneratorProps> = ({
  onFinish,
  onCancel,
}) => {
  const [content, setContent] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const defaultContent = `# Editor de Mensajes

Escribe tu mensaje aquí con soporte para **Markdown** y $\\LaTeX$.

## Características

- **Texto en negrita**
- *Texto en cursiva*
- \`Código inline\`

### Ejemplo de LaTeX

Ecuación inline: $E = mc^2$

Ecuación en bloque:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Listas

1. Primer elemento
2. Segundo elemento
3. Tercer elemento

- Elemento sin orden
- Otro elemento

### Código

\`\`\`javascript
function hello() {
  console.log("Hola mundo");
}
\`\`\`
`;

  return (
    <div className="message-generator-container">
      <div className="generator-header">
        <h1>Editor de Mensajes</h1>
      </div>
      <div className="generator-wrapper">
        <TextEditor
          value={content}
          onChange={setContent}
          placeholder={defaultContent}
          onClear={() => setContent("")}
        />
        <MessageViewer content={content} />
      </div>
      <div className="generator-actions">
        <button
          className="finish-btn"
          onClick={() => setShowPasswordModal(true)}
          disabled={!content.trim() || isEncrypting}
        >
          {isEncrypting ? "⏳ Cifrando..." : "🔒 Cifrar Mensaje"}
        </button>
        {onCancel && (
          <button
            className="cancel-btn"
            onClick={() => setShowCancelConfirmModal(true)}
            disabled={isEncrypting}
          >
            ✕ Cancelar
          </button>
        )}
      </div>
      <PasswordModal
        isOpen={showPasswordModal}
        onConfirm={async (password) => {
          setShowPasswordModal(false);
          setIsEncrypting(true);
          try {
            const privateKeyBase64 = localStorage.getItem('piano-crypto-own-private-key');
            
            if (!privateKeyBase64) {
              toast.error('No tienes una clave privada configurada. Por favor, genera un par de claves en tu perfil primero.', {
                position: "top-center",
                autoClose: 4000,
                theme: "dark",
              });
              setIsEncrypting(false);
              return;
            }

            const messageBytes = new TextEncoder().encode(content);
            
            // Convertir la clave privada de Base64 a Uint8Array
            const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
            
            // Firmar el mensaje
            const signedMessage = createSignedMessage(messageBytes, privateKeyBytes, 3);
            const signedMessageSerialized = serializeSignedMessage(signedMessage);
            
            // Cifrar el mensaje firmado
            const encrypted = encryptWithPassword(password, signedMessageSerialized);
            const serialized = serializeEncryptedData(encrypted);
            onFinish(serialized);
          } catch (error) {
            console.error("Error al cifrar mensaje:", error);
            toast.error(`Error al cifrar el mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
              position: "top-center",
              autoClose: 3000,
              theme: "dark",
            });
            setIsEncrypting(false);
          }
        }}
        onCancel={() => setShowPasswordModal(false)}
        title="Cifrar Mensaje"
        message="Ingresa una contraseña para cifrar el mensaje antes de ocultarlo en el audio:"
      />

      {onCancel && (
        <ConfirmModal
          isOpen={showCancelConfirmModal}
          onConfirm={() => {
            setShowCancelConfirmModal(false);
            onCancel();
          }}
          onCancel={() => setShowCancelConfirmModal(false)}
          title="Confirmar Cancelación"
          message="¿Estás seguro de que deseas cancelar? Se perderá todo el contenido del mensaje que hayas escrito."
          confirmText="Sí, cancelar"
          cancelText="No, continuar"
          confirmButtonClass="confirm-btn"
        />
      )}
    </div>
  );
};

export default MessageGenerator;
