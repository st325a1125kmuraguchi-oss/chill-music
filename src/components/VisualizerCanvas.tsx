import React, { useEffect, useRef } from 'react';
import { ColorTheme } from '../audio/types';

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  theme: ColorTheme;
}

const THEME_COLORS: Record<ColorTheme, { bg1: string; bg2: string; aurora1: string; aurora2: string; particle: string }> = {
  twilight: {
    bg1: '#0B0D19',
    bg2: '#16192E',
    aurora1: 'rgba(99, 102, 241, 0.22)',
    aurora2: 'rgba(168, 85, 247, 0.18)',
    particle: 'rgba(216, 180, 254, 0.65)',
  },
  sakura: {
    bg1: '#140D15',
    bg2: '#231526',
    aurora1: 'rgba(244, 114, 182, 0.22)',
    aurora2: 'rgba(251, 191, 36, 0.14)',
    particle: 'rgba(252, 231, 243, 0.7)',
  },
  midnight: {
    bg1: '#050A14',
    bg2: '#0D1B2A',
    aurora1: 'rgba(56, 189, 248, 0.22)',
    aurora2: 'rgba(99, 102, 241, 0.16)',
    particle: 'rgba(186, 230, 253, 0.7)',
  },
  forest: {
    bg1: '#07130F',
    bg2: '#10241E',
    aurora1: 'rgba(52, 211, 153, 0.2)',
    aurora2: 'rgba(16, 185, 129, 0.15)',
    particle: 'rgba(167, 243, 208, 0.65)',
  },
  amber: {
    bg1: '#140E0A',
    bg2: '#241913',
    aurora1: 'rgba(251, 146, 60, 0.22)',
    aurora2: 'rgba(245, 158, 11, 0.16)',
    particle: 'rgba(254, 215, 170, 0.7)',
  },
};

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  phase: number;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ analyser, isPlaying, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize floating stardust particles
    const particleCount = 65;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.3 - 0.08,
        alpha: Math.random() * 0.5 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const freqData = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);
    let time = 0;

    const render = () => {
      time += 0.012;

      // Read audio frequencies if available
      let avgFreq = 0;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        avgFreq = sum / freqData.length;
      }

      // Draw soothing ambient background gradient
      const colors = THEME_COLORS[theme] || THEME_COLORS.twilight;
      const grad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        height * 0.1,
        width / 2,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      grad.addColorStop(0, colors.bg2);
      grad.addColorStop(1, colors.bg1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw flowing Aurora wave layers
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseHeight = height * (0.45 + w * 0.12);
        const waveColor = w % 2 === 0 ? colors.aurora1 : colors.aurora2;
        ctx.fillStyle = waveColor;

        ctx.moveTo(0, height);
        ctx.lineTo(0, baseHeight);

        const segments = 40;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;
          // Fluid organic sine wave with audio modulation
          const audioBoost = isPlaying ? (freqData[i % freqData.length] / 255) * 28 : 0;
          const y =
            baseHeight +
            Math.sin(time * 0.8 + i * 0.25 + w * 1.5) * (30 + w * 8) +
            Math.cos(time * 0.5 + i * 0.15) * 20 +
            audioBoost;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      // Center breathing orb (reacts to meditation pacing & low frequencies)
      const centerX = width / 2;
      const centerY = height * 0.45;
      const orbPulse = (Math.sin(time * 0.6) + 1) * 0.5; // slow breathing cycle
      const audioOrbBoost = isPlaying ? (avgFreq / 255) * 40 : 0;
      const orbRadius = 75 + orbPulse * 25 + audioOrbBoost;

      const orbGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        orbRadius * 0.1,
        centerX,
        centerY,
        orbRadius * 2
      );
      orbGrad.addColorStop(0, colors.particle.replace('0.7', '0.28').replace('0.65', '0.25'));
      orbGrad.addColorStop(0.5, colors.aurora1);
      orbGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Render floating stardust particles
      ctx.fillStyle = colors.particle;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.02;

        // Wrap around
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        const rad = p.radius + (isPlaying ? (avgFreq / 255) * 1.2 : 0);
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [analyser, isPlaying, theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10" />;
};
