import React, { useState, useRef } from 'react';
import { extractMessageFromWav } from '../utils/steganography';
import MessageViewer from './MessageViewer';
import '../assets/css/messageExtractor.css';

const MessageExtractor: React.FC = () => {
  const [extractedMessage, setExtractedMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.endsWith('.wav')) {
      setError('Por favor, selecciona un archivo de audio WAV');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedMessage(null);

    try {
      const message = await extractMessageFromWav(file);
      if (message) {
        setExtractedMessage(message);
      } else {
        setError('No se encontró ningún mensaje oculto en el archivo de audio');
      }
    } catch (err) {
      setError('Error al procesar el archivo. Asegúrate de que sea un archivo WAV válido.');
      console.error('Error al extraer mensaje:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setExtractedMessage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            style={{ display: 'none' }}
          />
          <button
            className="upload-btn"
            onClick={handleUploadClick}
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Procesando...' : '📁 Subir archivo WAV'}
          </button>
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

