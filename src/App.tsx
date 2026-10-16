/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SereneSoundEngine } from './audio/engine';
import { CompositionState, ColorTheme, PRESET_JOURNEYS, ScaleType, BinauralType } from './audio/types';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { BreathingCircle } from './components/BreathingCircle';
import { InteractiveToneGarden } from './components/InteractiveToneGarden';
import { SoundscapeMixer } from './components/SoundscapeMixer';
import { AiComposerModal } from './components/AiComposerModal';
import {
  Play,
  Pause,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  Wind,
  Sliders,
  Palette,
  Shuffle,
  Music2,
  Info,
  ChevronDown,
  Compass,
} from 'lucide-react';

const SCALE_LABELS: Record<ScaleType, string> = {
  hirajoshi: '平調子 (和の安らぎ・水琴窟)',
  pentatonic_major: 'メジャーペンタトニック (温和・ノスタルジア)',
  dorian_dream: 'ドリアン・ドリーム (神秘・浮遊感)',
  lydian_float: 'リディアン・フロート (星空・無重力)',
  ambient_minor: 'アンビエント・マイナー (内省・静かな雨)',
};

const THEME_NAMES: Record<ColorTheme, { name: string; dot: string }> = {
  twilight: { name: '宵闇 (Twilight)', dot: 'bg-indigo-400' },
  sakura: { name: '夜桜 (Sakura)', dot: 'bg-pink-400' },
  midnight: { name: '深藍 (Midnight)', dot: 'bg-sky-400' },
  forest: { name: '深緑 (Forest)', dot: 'bg-emerald-400' },
  amber: { name: '琥珀 (Amber)', dot: 'bg-amber-400' },
};

export default function App() {
  const [composition, setComposition] = useState<CompositionState>(PRESET_JOURNEYS[0].composition);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'mixer' | 'garden' | 'breath' | 'theory'>('mixer');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showBreathingModal, setShowBreathingModal] = useState<boolean>(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const [showTimerPicker, setShowTimerPicker] = useState<boolean>(false);

  // Audio Engine reference
  const engineRef = useRef<SereneSoundEngine | null>(null);

  useEffect(() => {
    // Instantiate engine once
    const engine = new SereneSoundEngine(PRESET_JOURNEYS[0].composition);
    engineRef.current = engine;

    return () => {
      engine.pause();
    };
  }, []);

  // Sleep timer interval countdown
  useEffect(() => {
    if (!sleepTimerMinutes) {
      setSleepTimerRemaining(null);
      return;
    }

    let seconds = sleepTimerMinutes * 60;
    setSleepTimerRemaining(seconds);

    const interval = window.setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(interval);
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        setIsPlaying(false);
      } else {
        setSleepTimerRemaining(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const handleTogglePlay = async () => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.pause();
      setIsPlaying(false);
    } else {
      await engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_JOURNEYS[0]) => {
    setComposition(preset.composition);
    if (engineRef.current) {
      engineRef.current.updateState(preset.composition);
      if (!isPlaying) {
        engineRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleCompositionChange = (updated: Partial<CompositionState>) => {
    const next = { ...composition, ...updated };
    setComposition(next);
    if (engineRef.current) {
      engineRef.current.updateState(next);
    }
  };

  const handleAiCompositionApplied = (newComp: CompositionState) => {
    setComposition(newComp);
    if (engineRef.current) {
      engineRef.current.updateState(newComp);
      if (!isPlaying) {
        engineRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (engineRef.current) {
      engineRef.current.setMasterVolume(newVol);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      const restore = volume === 0 ? 0.8 : volume;
      setVolume(restore);
      setIsMuted(false);
      engineRef.current?.setMasterVolume(restore);
    } else {
      setIsMuted(true);
      engineRef.current?.setMasterVolume(0);
    }
  };

  const handleSetTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    setShowTimerPicker(false);
    if (engineRef.current) {
      engineRef.current.setSleepTimer(minutes, () => {
        setIsPlaying(false);
        setSleepTimerMinutes(null);
      });
    }
  };

  const handleShuffleJourney = () => {
    const randomPreset = PRESET_JOURNEYS[Math.floor(Math.random() * PRESET_JOURNEYS.length)];
    handleSelectPreset(randomPreset);
  };

  const formatTimerDisplay = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* Background Animated Audio-Reactive Visualizer */}
      <VisualizerCanvas
        analyser={engineRef.current?.analyser || null}
        isPlaying={isPlaying}
        theme={composition.colorTheme}
      />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500/40 to-purple-400/30 border border-white/20 flex items-center justify-center shadow-inner">
            <Music2 className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-medium tracking-wide flex items-center gap-2">
              <span>SereneSound</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {composition.tuningHz}Hz
              </span>
            </h1>
            <p className="text-[11px] text-white/50 hidden sm:block">
              心身を解きほぐすプロシージャル・ヒーリング音楽
            </p>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Composer Trigger */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/25 to-purple-500/25 hover:from-indigo-500/40 hover:to-purple-500/40 border border-white/20 text-xs font-medium text-white shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">情景からAI作曲</span>
            <span className="sm:hidden">AI作曲</span>
          </button>

          {/* Breathing Guide Button */}
          <button
            onClick={() => setShowBreathingModal(!showBreathingModal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
              showBreathingModal
                ? 'bg-white/25 border-white text-white'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white/80'
            }`}
            title="マインドフルネス呼吸ガイド"
          >
            <Wind className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden md:inline">呼吸ガイド</span>
          </button>

          {/* Sleep Timer dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTimerPicker(!showTimerPicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                sleepTimerMinutes
                  ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                  : 'bg-white/10 hover:bg-white/15 border-white/15 text-white/80'
              }`}
              title="スリープタイマー"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {sleepTimerRemaining ? formatTimerDisplay(sleepTimerRemaining) : 'タイマー'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showTimerPicker && (
              <div className="absolute right-0 mt-2 w-44 backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-xs">
                <div className="px-2.5 py-1 text-[10px] text-white/40 uppercase font-semibold">
                  自動停止タイマー
                </div>
                {[
                  { label: 'オフ (無制限)', val: null },
                  { label: '15分 後に消音', val: 15 },
                  { label: '30分 後に消音', val: 30 },
                  { label: '45分 後に消音', val: 45 },
                  { label: '60分 後に消音', val: 60 },
                  { label: '90分 後に消音', val: 90 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSetTimer(item.val)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl transition-all ${
                      sleepTimerMinutes === item.val
                        ? 'bg-indigo-500/30 text-indigo-200 font-medium'
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="px-2.5 py-1 text-[9px] text-white/40 border-t border-white/10 mt-1">
                  最後の2分間で徐々にフェードアウトします
                </div>
              </div>
            )}
          </div>

          {/* Theme Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 transition-all"
              title="カラーテーマ変更"
            >
              <Palette className="w-4 h-4" />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-40 backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-xs">
                {(Object.keys(THEME_NAMES) as ColorTheme[]).map((thm) => (
                  <button
                    key={thm}
                    onClick={() => {
                      handleCompositionChange({ colorTheme: thm });
                      setShowThemePicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                      composition.colorTheme === thm
                        ? 'bg-white/20 text-white font-medium'
                        : 'hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${THEME_NAMES[thm].dot}`} />
                    <span>{THEME_NAMES[thm].name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
        {/* Floating Modal for Breathing if toggled */}
        {showBreathingModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <BreathingCircle onClose={() => setShowBreathingModal(false)} />
          </div>
        )}

        {/* Current Composition Header / Poetic Sanctuary Card */}
        <section className="w-full text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/80 backdrop-blur-md mb-3">
            <Compass className="w-3.5 h-3.5 text-indigo-300" />
            <span>{SCALE_LABELS[composition.scale]}</span>
            <span className="opacity-40">•</span>
            <span>基準音 {composition.rootNote}</span>
            <span className="opacity-40">•</span>
            <span>{composition.bpm} BPM</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-light tracking-wide text-white drop-shadow-md mb-3">
            {composition.title}
          </h2>

          {/* Japanese 3-line tranquil poem */}
          {composition.poetry && (
            <div className="my-4 font-serif text-sm sm:text-base text-indigo-100/90 italic tracking-widest whitespace-pre-line leading-relaxed drop-shadow">
              {composition.poetry}
            </div>
          )}

          <p className="text-xs sm:text-sm text-white/65 max-w-xl mx-auto leading-relaxed">
            {composition.description}
          </p>
        </section>

        {/* Main Floating Audio Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 my-4 p-3 sm:px-6 sm:py-3.5 rounded-full backdrop-blur-2xl bg-white/10 dark:bg-black/40 border border-white/20 shadow-2xl">
          {/* Shuffle preset button */}
          <button
            onClick={handleShuffleJourney}
            className="p-3 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-all active:scale-95"
            title="別の安らぎの情景へランダム移動"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="relative group p-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-25 pointer-events-none group-hover:block" />
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>

          {/* Master Volume Controller */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-all"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-300" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
              title="マスター音量"
            />
          </div>
        </div>

        {/* Preset Journey Pills */}
        <div className="w-full max-w-3xl flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 pt-2 px-1 scrollbar-none my-2">
          {PRESET_JOURNEYS.map((preset) => {
            const isCurrent = composition.title === preset.composition.title;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs border transition-all active:scale-95 ${
                  isCurrent
                    ? 'bg-white/25 border-white text-white shadow-md shadow-white/10 font-medium'
                    : 'bg-white/5 hover:bg-white/12 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Feature Tabs Selector */}
        <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mt-6 mb-6 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('mixer')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'mixer'
                ? 'bg-white/20 text-white font-medium shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>音響ミキサー</span>
          </button>
          <button
            onClick={() => setActiveTab('garden')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'garden'
                ? 'bg-white/20 text-white font-medium shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>調和の音庭 (演奏)</span>
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'theory'
                ? 'bg-white/20 text-white font-medium shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-sky-300" />
            <span>調律 &amp; スケール</span>
          </button>
          <button
            onClick={() => setActiveTab('breath')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'breath'
                ? 'bg-white/20 text-white font-medium shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Wind className="w-4 h-4 text-indigo-300" />
            <span>呼吸瞑想</span>
          </button>
        </div>

        {/* Tab 1: Soundscape Mixer */}
        {activeTab === 'mixer' && (
          <SoundscapeMixer
            composition={composition}
            onChange={handleCompositionChange}
          />
        )}

        {/* Tab 2: Interactive Tone Garden */}
        {activeTab === 'garden' && (
          <div className="w-full flex flex-col items-center gap-4">
            <InteractiveToneGarden
              engine={engineRef.current}
              isPlaying={isPlaying}
            />
            <p className="text-xs text-white/50 text-center max-w-md">
              背景で流れるアンビエント音楽と同じ「{SCALE_LABELS[composition.scale].split(' ')[0]}」に自動調律されているため、どの音を鳴らしても不協和音にならず心地よく調和します。
            </p>
          </div>
        )}

        {/* Tab 3: Tuning & Scale Studio */}
        {activeTab === 'theory' && (
          <div className="w-full max-w-3xl backdrop-blur-xl bg-white/10 dark:bg-black/35 border border-white/15 dark:border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-6">
            <div>
              <h3 className="text-base font-medium tracking-wide mb-1 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-300" />
                <span>音楽理論 &amp; 音響調律パラメーター</span>
              </h3>
              <p className="text-xs text-white/60">
                周波数やスケールモードを自在に変更して、響きの質感や心理的効果を切り替えます。
              </p>
            </div>

            {/* Solfeggio / Tuning standard */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                基準ピッチ周波数 (Tuning Standard)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    hz: 432,
                    label: '432 Hz',
                    sub: '宇宙周波数・自然の安らぎ',
                    desc: '心拍数を落ち着かせ、副交感神経を優位に導く伝統的癒やしの音',
                  },
                  {
                    hz: 440,
                    label: '440 Hz',
                    sub: '国際標準ピッチ',
                    desc: '現代音楽の標準調律。クリアで明るい親しみやすい響き',
                  },
                  {
                    hz: 528,
                    label: '528 Hz',
                    sub: '奇跡の周波数 (Solfeggio)',
                    desc: '愛の周波数やDNA修復周波数として知られる深いリラクゼーション音',
                  },
                ].map((item) => (
                  <button
                    key={item.hz}
                    onClick={() => handleCompositionChange({ tuningHz: item.hz })}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      composition.tuningHz === item.hz
                        ? 'bg-indigo-500/30 border-indigo-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[11px] text-indigo-200 mt-0.5">{item.sub}</div>
                    <div className="text-[10px] text-white/50 mt-1 leading-snug">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Musical Scale Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                和声スケール (Musical Scale)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(SCALE_LABELS) as ScaleType[]).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => handleCompositionChange({ scale: sc })}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      composition.scale === sc
                        ? 'bg-purple-500/30 border-purple-400 text-white font-medium'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs">{SCALE_LABELS[sc]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Root Note & Tempo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                  基準根音 (Root Note: {composition.rootNote})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['C', 'D', 'Eb', 'E', 'F', 'G', 'Ab', 'A', 'Bb', 'B'].map((note) => (
                    <button
                      key={note}
                      onClick={() => handleCompositionChange({ rootNote: note })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                        composition.rootNote === note
                          ? 'bg-white/30 text-white font-bold shadow-sm'
                          : 'bg-white/5 hover:bg-white/15 text-white/70'
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    テンポ / ゆらぎ (BPM)
                  </label>
                  <span className="text-xs font-mono text-indigo-200">{composition.bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="46"
                  max="68"
                  step="1"
                  value={composition.bpm}
                  onChange={(e) => handleCompositionChange({ bpm: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>深い休息 (46 BPM)</span>
                  <span>穏やかな心拍 (60 BPM)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Inline Breathing Practice */}
        {activeTab === 'breath' && (
          <div className="w-full flex justify-center py-2">
            <BreathingCircle />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 text-center text-xs text-white/40 border-t border-white/5 backdrop-blur-sm">
        <p>SereneSound — Web Audio API による完全リアルタイム・プロシージャル・リラクゼーション音楽</p>
      </footer>

      {/* AI Composer Modal */}
      <AiComposerModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyComposition={handleAiCompositionApplied}
      />
    </div>
  );
}
