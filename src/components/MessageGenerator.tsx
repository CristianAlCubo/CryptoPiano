import React, { useState } from 'react';
import TextEditor from './TextEditor';
import MessageViewer from './MessageViewer';
import '../assets/css/messageGenerator.css';

const MessageGenerator: React.FC = () => {
  const [content, setContent] = useState('');

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
        <p>Escribe con Markdown y LaTeX</p>
      </div>
      <div className="generator-wrapper">
        <TextEditor
          value={content}
          onChange={setContent}
          placeholder={defaultContent}
          onClear={() => setContent('')}
        />
        <MessageViewer content={content} />
      </div>
    </div>
  );
};

export default MessageGenerator;

