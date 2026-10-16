import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, X } from 'lucide-react';

interface BreathingCircleProps {
  onClose?: () => void;
  accentColor?: string;
}

type BreathingTechnique = '4-7-8' | 'box' | 'relax-4-6';

export const BreathingCircle: React.FC<BreathingCircleProps> = ({ onClose }) => {
  const [technique, setTechnique] = useState<BreathingTechnique>('4-7-8');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);

  useEffect(() => {
    if (!isRunning) return;

    let timer: number;
    const runCycle = () => {
      // Define phases per technique
      let phases: { name: 'inhale' | 'hold' | 'exhale' | 'pause'; duration: number; text: string }[] = [];
      if (technique === '4-7-8') {
        phases = [
          { name: 'inhale', duration: 4, text: '息を吸う' },
          { name: 'hold', duration: 7, text: '息を止める' },
          { name: 'exhale', duration: 8, text: '細く長く吐き出す' },
        ];
      } else if (technique === 'box') {
        phases = [
          { name: 'inhale', duration: 4, text: '吸う' },
          { name: 'hold', duration: 4, text: '止める' },
          { name: 'exhale', duration: 4, text: '吐く' },
          { name: 'pause', duration: 4, text: '静止' },
        ];
      } else {
        phases = [
          { name: 'inhale', duration: 4, text: '穏やかに吸う' },
          { name: 'exhale', duration: 6, text: 'ゆっくり吐く' },
        ];
      }

      let currentPhaseIdx = 0;
      let currentSeconds = phases[0].duration;
      setPhase(phases[0].name);
      setSecondsLeft(currentSeconds);

      timer = window.setInterval(() => {
        currentSeconds--;
        if (currentSeconds <= 0) {
          currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
          currentSeconds = phases[currentPhaseIdx].duration;
          setPhase(phases[currentPhaseIdx].name);
        }
        setSecondsLeft(currentSeconds);
      }, 1000);
    };

    runCycle();

    return () => {
      clearInterval(timer);
    };
  }, [technique, isRunning]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return '吸う (Inhale)';
      case 'hold':
        return '止める (Hold)';
      case 'exhale':
        return '吐く (Exhale)';
      case 'pause':
        return '休止 (Rest)';
    }
  };

  const getCircleScale = () => {
    switch (phase) {
      case 'inhale':
        return 1.35;
      case 'hold':
        return 1.35;
      case 'exhale':
        return 0.85;
      case 'pause':
        return 0.85;
    }
  };

  return (
    <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/35 border border-white/15 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto text-white">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Wind className="w-5 h-5 text-indigo-300" />
        <h3 className="text-base font-medium tracking-wide">マインドフルネス呼吸ガイド</h3>
      </div>

      {/* Technique tabs */}
      <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl mb-6 text-xs text-white/80">
        <button
          onClick={() => setTechnique('4-7-8')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            technique === '4-7-8' ? 'bg-white/20 text-white font-medium shadow-sm' : 'hover:bg-white/5'
          }`}
        >
          4-7-8 睡眠法
        </button>
        <button
          onClick={() => setTechnique('box')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            technique === 'box' ? 'bg-white/20 text-white font-medium shadow-sm' : 'hover:bg-white/5'
          }`}
        >
          4-4-4 ボックス
        </button>
        <button
          onClick={() => setTechnique('relax-4-6')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            technique === 'relax-4-6' ? 'bg-white/20 text-white font-medium shadow-sm' : 'hover:bg-white/5'
          }`}
        >
          4-6 リラックス
        </button>
      </div>

      {/* Breathing Animated Orb */}
      <div className="relative w-48 h-48 flex items-center justify-center my-3">
        {/* Outer glowing ripple */}
        <motion.div
          animate={{
            scale: getCircleScale() * 1.15,
            opacity: phase === 'inhale' ? 0.35 : phase === 'exhale' ? 0.15 : 0.25,
          }}
          transition={{
            duration: phase === 'inhale' ? 4 : phase === 'exhale' ? (technique === '4-7-8' ? 8 : 6) : 0.6,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-400/30 to-pink-500/20 blur-xl"
        />

        {/* Core breathing sphere */}
        <motion.div
          animate={{
            scale: getCircleScale(),
          }}
          transition={{
            duration: phase === 'inhale' ? 4 : phase === 'exhale' ? (technique === '4-7-8' ? 8 : 6) : 0.6,
            ease: 'easeInOut',
          }}
          className="relative w-36 h-36 rounded-full bg-gradient-to-br from-indigo-400/40 via-purple-300/30 to-pink-300/30 border border-white/30 backdrop-blur-md flex flex-col items-center justify-center shadow-lg"
        >
          <span className="text-sm font-semibold tracking-wider drop-shadow-md text-white">
            {getPhaseText()}
          </span>
          <span className="text-3xl font-light tracking-tight mt-1 text-white font-mono">
            {secondsLeft}s
          </span>
        </motion.div>
      </div>

      <p className="text-xs text-white/70 text-center mt-3 h-8 flex items-center">
        {phase === 'inhale' && '鼻から静かに、お腹を膨らませて息を吸います'}
        {phase === 'hold' && '肺に満ちた空気を保ち、身体の力を抜きます'}
        {phase === 'exhale' && '口から細く、全ての緊張を吐き出すように…'}
        {phase === 'pause' && '自然な静寂を味わいます'}
      </p>

      {/* Control toggle */}
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/90 transition-colors"
      >
        {isRunning ? (
          <>
            <Pause className="w-3.5 h-3.5" /> 一時停止
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> 再開
          </>
        )}
      </button>
    </div>
  );
};
