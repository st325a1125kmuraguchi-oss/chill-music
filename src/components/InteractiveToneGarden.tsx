import React, { useState, useEffect } from 'react';
import { SereneSoundEngine } from '../audio/engine';
import { Sparkles, Music, Bell } from 'lucide-react';

interface InteractiveToneGardenProps {
  engine: SereneSoundEngine | null;
  isPlaying: boolean;
}

export const InteractiveToneGarden: React.FC<InteractiveToneGardenProps> = ({ engine }) => {
  const [instrumentType, setInstrumentType] = useState<'piano' | 'kalimba' | 'chime' | 'bowl'>('kalimba');
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  const notes = engine ? engine.getScaleNotes(3, 10) : [];
  const keyShortcuts = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

  const handlePlayNote = async (freq: number, idx: number) => {
    if (!engine) return;
    await engine.initAudio();
    engine.triggerInstrumentNote(freq, instrumentType, 0.7);
    setActiveNoteIdx(idx);
    setTimeout(() => {
      setActiveNoteIdx(null);
    }, 350);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      const idx = keyShortcuts.indexOf(key);
      if (idx !== -1 && idx < notes.length) {
        handlePlayNote(notes[idx].freq, idx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, instrumentType, engine]);

  return (
    <div className="w-full max-w-3xl mx-auto backdrop-blur-xl bg-white/5 dark:bg-black/30 border border-white/10 rounded-3xl p-5 shadow-xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <h3 className="text-sm font-medium tracking-wide">調和の音庭 (Harmonic Tone Garden)</h3>
          <span className="text-xs text-white/50 hidden sm:inline">タップやキーボードで自由に奏でられます</span>
        </div>

        {/* Instrument selector */}
        <div className="flex gap-1 bg-white/10 p-1 rounded-xl text-xs">
          <button
            onClick={() => setInstrumentType('kalimba')}
            className={`px-3 py-1 rounded-lg transition-all ${
              instrumentType === 'kalimba' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            カリンバ
          </button>
          <button
            onClick={() => setInstrumentType('piano')}
            className={`px-3 py-1 rounded-lg transition-all ${
              instrumentType === 'piano' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            ソフトピアノ
          </button>
          <button
            onClick={() => setInstrumentType('chime')}
            className={`px-3 py-1 rounded-lg transition-all ${
              instrumentType === 'chime' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            風鈴チャイム
          </button>
          <button
            onClick={() => setInstrumentType('bowl')}
            className={`px-3 py-1 rounded-lg transition-all ${
              instrumentType === 'bowl' ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            シンギングボウル
          </button>
        </div>
      </div>

      {/* Tone Pads */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {notes.map((note, idx) => {
          const isActive = activeNoteIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => handlePlayNote(note.freq, idx)}
              className={`group relative flex flex-col items-center justify-between py-4 px-2 rounded-2xl transition-all duration-200 border select-none active:scale-95 ${
                isActive
                  ? 'bg-white/35 border-white text-white shadow-lg shadow-white/20 -translate-y-1'
                  : 'bg-white/10 hover:bg-white/18 border-white/15 text-white/85 hover:border-white/30'
              }`}
            >
              <span className="text-[10px] font-mono opacity-50 bg-white/10 px-1.5 py-0.5 rounded">
                {keyShortcuts[idx]}
              </span>
              <div
                className={`w-3 h-3 rounded-full my-2 transition-transform duration-200 ${
                  isActive ? 'scale-150 bg-amber-300 shadow-md shadow-amber-300' : 'bg-white/40 group-hover:bg-white/70'
                }`}
              />
              <span className="text-xs font-semibold tracking-wider">{note.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
