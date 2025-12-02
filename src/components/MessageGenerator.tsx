import React, { useState } from "react";
import TextEditor from "./TextEditor";
import MessageViewer from "./MessageViewer";
import PasswordModal from "./PasswordModal";
import { encryptWithPassword, serializeEncryptedData } from "../utils/crypto";
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
            onClick={onCancel}
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
            const messageBytes = new TextEncoder().encode(content);
            const encrypted = encryptWithPassword(password, messageBytes);
            const serialized = serializeEncryptedData(encrypted);
            onFinish(serialized);
          } catch (error) {
            console.error("Error al cifrar mensaje:", error);
            alert("Error al cifrar el mensaje. Por favor, intenta de nuevo.");
            setIsEncrypting(false);
          }
        }}
        onCancel={() => setShowPasswordModal(false)}
        title="Cifrar Mensaje"
        message="Ingresa una contraseña para cifrar el mensaje antes de ocultarlo en el audio:"
      />
    </div>
  );
};

export default MessageGenerator;
