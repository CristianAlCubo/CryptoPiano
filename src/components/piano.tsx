import React, { useState, useEffect, useCallback, useRef } from "react";
import "../App.css";
import PianoRecorder from "./PianoRecorder";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface Note {
  note: string;
  key: string;
  freq: number;
  isSharp: boolean;
}

const NOTES: Note[] = [
  { note: "C", key: "A", freq: 261.63, isSharp: false },
  { note: "C#", key: "W", freq: 277.18, isSharp: true },
  { note: "D", key: "S", freq: 293.66, isSharp: false },
  { note: "D#", key: "E", freq: 311.13, isSharp: true },
  { note: "E", key: "D", freq: 329.63, isSharp: false },
  { note: "F", key: "F", freq: 349.23, isSharp: false },
  { note: "F#", key: "T", freq: 369.99, isSharp: true },
  { note: "G", key: "G", freq: 392.0, isSharp: false },
  { note: "G#", key: "Y", freq: 415.30, isSharp: true },
  { note: "A", key: "H", freq: 440.0, isSharp: false },
  { note: "A#", key: "U", freq: 466.16, isSharp: true },
  { note: "B", key: "J", freq: 493.88, isSharp: false },
  { note: "C", key: "K", freq: 523.25, isSharp: false },
];

interface ActiveNote {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc1Gain: GainNode;
  osc2Gain: GainNode;
  masterGain: GainNode;
}

const Piano: React.FC = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNotesRef = useRef<Map<string, ActiveNote>>(new Map());
  const recordingGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioContextRef.current = new AudioCtx();
    }
    return audioContextRef.current;
  }, []);

  const stopSound = useCallback((key: string, immediate: boolean = false) => {
    const activeNote = activeNotesRef.current.get(key);
    if (!activeNote) return;

    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const releaseTime = immediate ? 0.05 : 0.06;

    activeNote.masterGain.gain.cancelScheduledValues(now);
    activeNote.masterGain.gain.setValueAtTime(
      activeNote.masterGain.gain.value,
      now
    );
    activeNote.masterGain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    setTimeout(() => {
      activeNote.osc1.stop();
      activeNote.osc2.stop();
      activeNote.osc1Gain.disconnect();
      activeNote.osc2Gain.disconnect();
      activeNote.masterGain.disconnect();
      activeNotesRef.current.delete(key);
    }, releaseTime * 1000 + 30);

    setPressedKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, [getAudioContext]);

  const playSound = useCallback((freq: number, _note: string, key: string) => {
    if (activeNotesRef.current.has(key)) {
      return;
    }

    stopSound(key, true);

    const audioCtx = getAudioContext();
    if (!audioCtx) {
      console.error('AudioContext no disponible');
      return;
    }

    const resumeAudio = async () => {
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (error) {
          console.error('Error al reactivar AudioContext:', error);
          return;
        }
      }

      const now = audioCtx.currentTime;

      const masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      
      if (recordingGainRef.current) {
        masterGain.connect(recordingGainRef.current);
      }

      const attackTime = 0.005;
      const decayTime = 0.15;
      const sustainLevel = 0.25;

      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.35, now + attackTime);
      masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
      masterGain.gain.setValueAtTime(sustainLevel, now + attackTime + decayTime + 0.1);

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const osc1Gain = audioCtx.createGain();
      const osc2Gain = audioCtx.createGain();

      osc1.type = "triangle";
      osc1.frequency.value = freq;
      osc1Gain.gain.value = 0.6;

      osc2.type = "sine";
      osc2.frequency.value = freq * 2;
      osc2Gain.gain.value = 0.15;

      osc1.connect(osc1Gain);
      osc2.connect(osc2Gain);
      osc1Gain.connect(masterGain);
      osc2Gain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);

      activeNotesRef.current.set(key, {
        osc1,
        osc2,
        osc1Gain,
        osc2Gain,
        masterGain,
      });

      setPressedKeys((prev) => new Set(prev).add(key));
    };

    resumeAudio();
  }, [getAudioContext, stopSound]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const noteObj = NOTES.find((n) => n.key.toLowerCase() === e.key.toLowerCase());
    if (noteObj) {
      playSound(noteObj.freq, noteObj.note, noteObj.key);
    }
  }, [playSound]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const noteObj = NOTES.find((n) => n.key.toLowerCase() === e.key.toLowerCase());
    if (noteObj) {
      stopSound(noteObj.key);
    }
  }, [stopSound]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const getSharpKeyPosition = (index: number): number => {
    const naturalKeysBefore = NOTES.slice(0, index).filter(n => !n.isSharp).length;
    return naturalKeysBefore * 50 + 25 - 17.5;
  };

  const naturalKeysCount = NOTES.filter(n => !n.isSharp).length;
  const pianoWidth = naturalKeysCount * 50;

  return (
    <div className="App">
      <h1>Piano Virtual</h1>
      <div className="piano-container">
        <div className="piano">
          <div className="piano-keys" style={{ width: `${pianoWidth}px` }}>
            {NOTES.map((n, index) => {
              const isPressed = pressedKeys.has(n.key);
              if (n.isSharp) {
                const leftOffset = getSharpKeyPosition(index);
                return (
                  <div
                    key={`${n.note}-${index}`}
                    className={`key key-sharp ${isPressed ? "pressed" : ""}`}
                    style={{ left: `${leftOffset}px` }}
                    onMouseDown={() => playSound(n.freq, n.note, n.key)}
                    onMouseUp={() => stopSound(n.key)}
                    onMouseLeave={() => stopSound(n.key)}
                  >
                    <div className="key-content">
                      {n.note}
                      <br />
                      <small>({n.key})</small>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={`${n.note}-${index}`}
                  className={`key key-natural ${isPressed ? "pressed" : ""}`}
                  onMouseDown={() => playSound(n.freq, n.note, n.key)}
                  onMouseUp={() => stopSound(n.key)}
                  onMouseLeave={() => stopSound(n.key)}
                >
                  <div className="key-content">
                    {n.note}
                    <br />
                    <small>({n.key})</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* <div className="played-notes">
        <h2>Notas tocadas</h2>
        <div className="notes-container">
          {playedNotes.length === 0 ? (
            <div className="notes-empty">Presiona las teclas para comenzar</div>
          ) : (
            <div className="notes-list">
              {playedNotes.slice(-20).map((note, index) => {
                const startIndex = Math.max(0, playedNotes.length - 20);
                const uniqueKey = `note-${startIndex + index}`;
                return (
                  <div
                    key={uniqueKey}
                    className={`note-badge ${note.includes('#') ? 'note-sharp' : 'note-natural'}`}
                  >
                    {note}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {playedNotes.length > 0 && (
          <div className="notes-count">
            Total: {playedNotes.length} {playedNotes.length === 1 ? 'nota' : 'notas'}
          </div>
        )}
      </div> */}
      <PianoRecorder
        getAudioContext={getAudioContext}
        onRecordingStateChange={(_, gainNode) => {
          recordingGainRef.current = gainNode;
        }}
      />
    </div>
  );
};

export default Piano;
