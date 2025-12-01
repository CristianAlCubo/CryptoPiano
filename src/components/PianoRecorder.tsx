import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../assets/css/pianoRecorder.css';

interface PianoRecorderProps {
  getAudioContext: () => AudioContext | null;
  onRecordingStateChange?: (isRecording: boolean, recordingGain: GainNode | null) => void;
}

const PianoRecorder: React.FC<PianoRecorderProps> = ({ getAudioContext, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<number | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingGainRef = useRef<GainNode | null>(null);
  const recordingBufferRef = useRef<Float32Array[]>([]);

  const convertToWav = useCallback((audioBuffer: Float32Array[], sampleRate: number): Blob => {
    const length = audioBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const channels = 1;
    const bitsPerSample = 16;

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    let offset = 44;
    for (const chunk of audioBuffer) {
      for (let i = 0; i < chunk.length; i++) {
        const sample = Math.max(-1, Math.min(1, chunk[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  const startRecording = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      const bufferSize = 4096;
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      const gainNode = audioContext.createGain();

      gainNode.connect(scriptProcessor);
      
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const outputData = e.outputBuffer.getChannelData(0);
        
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = 0;
        }

        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        recordingBufferRef.current.push(copy);
      };
      
      const silentDestination = audioContext.createGain();
      silentDestination.gain.value = 0;
      scriptProcessor.connect(silentDestination);
      silentDestination.connect(audioContext.destination);

      recordingBufferRef.current = [];
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);

      scriptProcessorRef.current = scriptProcessor;
      recordingGainRef.current = gainNode;

      if (onRecordingStateChange) {
        onRecordingStateChange(true, gainNode);
      }

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 1000);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setIsRecording(false);
    }
  }, [getAudioContext, onRecordingStateChange]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    setIsRecording(false);

    if (onRecordingStateChange) {
      onRecordingStateChange(false, null);
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setTimeout(() => {
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }

      if (recordingGainRef.current) {
        recordingGainRef.current.disconnect();
        recordingGainRef.current = null;
      }

      const audioContext = getAudioContext();
      if (recordingBufferRef.current.length > 0 && audioContext) {
        const wavBlob = convertToWav(recordingBufferRef.current, audioContext.sampleRate);
        setRecordedBlob(wavBlob);
        recordingBufferRef.current = [];
      }
    }, 100);
  }, [isRecording, getAudioContext, convertToWav, onRecordingStateChange]);

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    recordingBufferRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
      if (recordingGainRef.current) {
        recordingGainRef.current.disconnect();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="piano-recorder">
      <div className="recorder-header">
        <h3>Grabación</h3>
      </div>
      <div className="recorder-controls">
        {!isRecording ? (
          <button
            className="recorder-btn record-btn"
            onClick={startRecording}
            disabled={!getAudioContext()}
          >
            <span className="record-icon">●</span>
            Grabar
          </button>
        ) : (
          <button
            className="recorder-btn stop-btn"
            onClick={stopRecording}
          >
            <span className="stop-icon">■</span>
            Detener
          </button>
        )}
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
        )}
        {recordedBlob && !isRecording && (
          <>
            <button
              className="recorder-btn download-btn"
              onClick={downloadRecording}
            >
              ⬇ Descargar WAV
            </button>
            <button
              className="recorder-btn clear-btn"
              onClick={clearRecording}
            >
              ✕ Limpiar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PianoRecorder;

