import { useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'
import './assets/css/appHome.css'
import Piano from './components/piano'
import MessageGenerator from './components/MessageGenerator'
import MessageExtractor from './components/MessageExtractor'
import CryptoModeAlert from './components/CryptoModeAlert'
import Contacts from './components/Contacts'
import Profile from './components/Profile'
import { embedMessageInWav } from './utils/steganography'

type AppMode = 'piano' | 'extract' | 'contacts' | 'profile';

function App() {
  const [mode, setMode] = useState<AppMode>('piano');
  const [cryptoModeEnabled, setCryptoModeEnabled] = useState(false);
  const [showCryptoAlert, setShowCryptoAlert] = useState(false);
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

  const handleFinishMessage = async (encryptedData: Uint8Array) => {
    if (!recordedBlobRef.current) return;

    try {
      const wavWithMessage = await embedMessageInWav(recordedBlobRef.current, encryptedData);
      
      const url = URL.createObjectURL(wavWithMessage);
      const a = document.createElement('a');
      a.href = url;
      a.download = `piano-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Mensaje cifrado y oculto en el audio correctamente');
      setShowMessageGenerator(false);
      setHasRecording(false);
      recordedBlobRef.current = null;
    } catch (error) {
      console.error('Error al insertar mensaje:', error);
      toast.error('Error al insertar el mensaje en el audio. El mensaje puede ser demasiado largo.');
    }
  };

  const handleCancelMessage = () => {
    setShowMessageGenerator(false);
    setHasRecording(false);
  };

  const handleCryptoModeActivated = () => {
    setCryptoModeEnabled(true);
    setShowCryptoAlert(true);
  };

  const handleBackToPiano = () => {
    setMode('piano');
    setShowMessageGenerator(false);
    setHasRecording(false);
    recordedBlobRef.current = null;
  };

  if (mode === 'extract') {
    return (
      <>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <button className="back-btn" onClick={handleBackToPiano}>
          ← Volver al Piano
        </button>
        <MessageExtractor />
      </>
    );
  }

  if (mode === 'contacts') {
    return (
      <>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <button className="back-btn" onClick={handleBackToPiano}>
          ← Volver al Piano
        </button>
        <Contacts />
      </>
    );
  }

  if (mode === 'profile') {
    return (
      <>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <button className="back-btn" onClick={handleBackToPiano}>
          ← Volver al Piano
        </button>
        <Profile />
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {showCryptoAlert && (
        <CryptoModeAlert onClose={() => setShowCryptoAlert(false)} />
      )}
      {cryptoModeEnabled && (
        <div className="crypto-mode-banner">
          <span>🔒 Modo Criptográfico Activo</span>
          <div className="banner-actions">
            <button 
              className="extract-mode-btn"
              onClick={() => setMode('extract')}
            >
              🔍 Extraer Mensaje
            </button>
            <button 
              className="contacts-mode-btn"
              onClick={() => setMode('contacts')}
            >
              👥 Contactos
            </button>
            <button 
              className="profile-mode-btn"
              onClick={() => setMode('profile')}
            >
              👤 Perfil
            </button>
          </div>
        </div>
      )}
      {!showMessageGenerator ? (
        <Piano 
          onAddSecret={handleAddSecret}
          hasRecording={hasRecording}
          onBlobReady={handleBlobReady}
          onCryptoModeActivated={handleCryptoModeActivated}
          cryptoModeEnabled={cryptoModeEnabled}
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
