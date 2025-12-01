import { useState, useRef } from 'react';
import './App.css'
import './assets/css/appHome.css'
import Piano from './components/piano'
import MessageGenerator from './components/MessageGenerator'
import MessageExtractor from './components/MessageExtractor'
import { embedMessageInWav } from './utils/steganography'

type AppMode = 'home' | 'record' | 'extract';

function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [showMessageGenerator, setShowMessageGenerator] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const recordedBlobRef = useRef<Blob | null>(null);

  const handleBlobReady = (blob: Blob) => {
    recordedBlobRef.current = blob;
  };

  const handleAddSecret = () => {
    if (recordedBlobRef.current) {
      setShowMessageGenerator(true);
      setHasRecording(true);
    }
  };

  const handleFinishMessage = async (message: string) => {
    if (!recordedBlobRef.current || !message.trim()) return;

    try {
      const wavWithMessage = await embedMessageInWav(recordedBlobRef.current, message);
      
      const url = URL.createObjectURL(wavWithMessage);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piano-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowMessageGenerator(false);
      setHasRecording(false);
      recordedBlobRef.current = null;
    } catch (error) {
      console.error('Error al insertar mensaje:', error);
      alert('Error al insertar el mensaje en el audio. El mensaje puede ser demasiado largo.');
    }
  };

  const handleCancelMessage = () => {
    setShowMessageGenerator(false);
    setHasRecording(false);
  };

  const handleBackToHome = () => {
    setMode('home');
    setShowMessageGenerator(false);
    setHasRecording(false);
    recordedBlobRef.current = null;
  };

  if (mode === 'home') {
    return (
      <div className="app-home">
        <div className="home-container">
          <h1 className="home-title">Piano Crypto</h1>
          <p className="home-subtitle">Esteganografía en audio</p>
          <div className="home-actions">
            <button
              className="home-btn record-btn"
              onClick={() => setMode('record')}
            >
              🎹 Grabar y Ocultar Mensaje
            </button>
            <button
              className="home-btn extract-btn"
              onClick={() => setMode('extract')}
            >
              🔍 Extraer Mensaje
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'extract') {
    return (
      <>
        <button className="back-btn" onClick={handleBackToHome}>
          ← Volver
        </button>
        <MessageExtractor />
      </>
    );
  }

  return (
    <>
      <button className="back-btn" onClick={handleBackToHome}>
        ← Volver
      </button>
      {!showMessageGenerator ? (
        <Piano 
          onAddSecret={handleAddSecret}
          hasRecording={hasRecording}
          onBlobReady={handleBlobReady}
        />
      ) : (
        <MessageGenerator
          onFinish={handleFinishMessage}
          onCancel={handleCancelMessage}
        />
      )}
    </>
  )
}

export default App
