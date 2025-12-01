import React, { useEffect } from 'react';
import '../assets/css/cryptoModeAlert.css';

interface CryptoModeAlertProps {
  onClose: () => void;
}

const CryptoModeAlert: React.FC<CryptoModeAlertProps> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="crypto-alert-overlay" onClick={onClose}>
      <div className="crypto-alert-container" onClick={(e) => e.stopPropagation()}>
        <div className="crypto-alert-icon">🔒</div>
        <h1 className="crypto-alert-title">Modo Criptográfico</h1>
        <h2 className="crypto-alert-subtitle">ACTIVADO</h2>
        <div className="crypto-alert-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }} />
          ))}
        </div>
        <button className="crypto-alert-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default CryptoModeAlert;

