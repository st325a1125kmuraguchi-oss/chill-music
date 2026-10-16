import React from 'react';
import { CompositionState, NatureLayerKey, BinauralType } from '../audio/types';
import { CloudRain, Waves, Trees, Bird, Flame, Wind, Disc, Bell, Sliders, Volume2, Sparkles, Brain } from 'lucide-react';

interface SoundscapeMixerProps {
  composition: CompositionState;
  onChange: (updated: Partial<CompositionState>) => void;
}

const NATURE_ITEMS: { key: NatureLayerKey; label: string; icon: any }[] = [
  { key: 'rain', label: '雨音', icon: CloudRain },
  { key: 'waves', label: '波の呼吸', icon: Waves },
  { key: 'stream', label: '清流のせせらぎ', icon: Trees },
  { key: 'birds', label: '森の小鳥', icon: Bird },
  { key: 'crickets', label: '夜の虫の音', icon: Sparkles },
  { key: 'fire', label: '焚き火の爆ぜる音', icon: Flame },
  { key: 'wind', label: '梢を渡る風', icon: Wind },
  { key: 'vinyl', label: 'レコードの微粒子', icon: Disc },
  { key: 'singingBowl', label: 'シンギングボウル', icon: Bell },
];

export const SoundscapeMixer: React.FC<SoundscapeMixerProps> = ({ composition, onChange }) => {
  const handleNatureChange = (key: NatureLayerKey, val: number) => {
    onChange({
      natureLayers: {
        ...composition.natureLayers,
        [key]: val,
      },
    });
  };

  const handleInstrumentChange = (key: keyof CompositionState['instruments'], val: any) => {
    onChange({
      instruments: {
        ...composition.instruments,
        [key]: val,
      },
    });
  };

  const handleResetNature = () => {
    const silent: Record<NatureLayerKey, number> = {
      rain: 0,
      waves: 0,
      stream: 0,
      birds: 0,
      crickets: 0,
      fire: 0,
      wind: 0,
      vinyl: 0,
      singingBowl: 0,
    };
    onChange({ natureLayers: silent });
  };

  return (
    <div className="w-full max-w-4xl mx-auto backdrop-blur-xl bg-white/10 dark:bg-black/35 border border-white/15 dark:border-white/10 rounded-3xl p-6 shadow-2xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-300" />
          <h3 className="text-base font-medium tracking-wide">音響ミキサー &amp; 自然音スケープ</h3>
        </div>
        <button
          onClick={handleResetNature}
          className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
        >
          自然音をすべてミュート
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Natural Soundscapes */}
        <div>
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5" /> 環境・自然音レイヤー
          </h4>
          <div className="space-y-3.5">
            {NATURE_ITEMS.map((item) => {
              const Icon = item.icon;
              const val = composition.natureLayers[item.key] ?? 0;
              const pct = Math.round(val * 100);
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <div
                    onClick={() => handleNatureChange(item.key, val > 0 ? 0 : 0.4)}
                    className={`cursor-pointer p-2 rounded-xl transition-all ${
                      val > 0 ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/5 text-white/40 hover:text-white/70'
                    }`}
                    title="クリックでミュート/再生"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={val > 0 ? 'text-white font-medium' : 'text-white/60'}>
                        {item.label}
                      </span>
                      <span className="text-[11px] font-mono text-white/50">{pct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={val}
                      onChange={(e) => handleNatureChange(item.key, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Music Instruments & Brainwaves */}
        <div>
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> 楽器バランス &amp; 周波数調律
          </h4>
          <div className="space-y-5">
            {/* Pad Warmth */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white font-medium">アンビエントパッドの温もり</span>
                <span className="text-[11px] font-mono text-white/50">
                  {Math.round(composition.instruments.padWarmth * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={composition.instruments.padWarmth}
                onChange={(e) => handleInstrumentChange('padWarmth', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
              />
              <span className="text-[11px] text-white/50">包み込むような低周波シンセパッドのボリューム</span>
            </div>

            {/* Piano Presence */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white font-medium">ソフトピアノ／エレピの旋律</span>
                <span className="text-[11px] font-mono text-white/50">
                  {Math.round(composition.instruments.pianoPresence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={composition.instruments.pianoPresence}
                onChange={(e) => handleInstrumentChange('pianoPresence', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
              />
              <span className="text-[11px] text-white/50">自動生成される優しいメロディの音量</span>
            </div>

            {/* Chimes & Bells */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white font-medium">風鈴・シマーベルの響き</span>
                <span className="text-[11px] font-mono text-white/50">
                  {Math.round(composition.instruments.chimeFrequency * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={composition.instruments.chimeFrequency}
                onChange={(e) => handleInstrumentChange('chimeFrequency', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
              <span className="text-[11px] text-white/50">高域の澄んだアコースティックベルの頻度</span>
            </div>

            {/* Binaural Beats */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-4 h-4 text-pink-300" />
                <span className="text-xs font-medium text-white">バイノーラルビート (脳波同調)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    { id: 'none', label: 'オフ (None)', desc: '通常の音響' },
                    { id: 'theta_4hz', label: 'シータ波 (4Hz)', desc: '深い眠り・瞑想・うたた寝' },
                    { id: 'alpha_8hz', label: 'アルファ波 (8Hz)', desc: '心身の平穏・読書・集中' },
                    { id: 'delta_2hz', label: 'デルタ波 (2Hz)', desc: '夢のない熟睡・疲労回復' },
                  ] as { id: BinauralType; label: string; desc: string }[]
                ).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleInstrumentChange('binauralType', b.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      composition.instruments.binauralType === b.id
                        ? 'bg-pink-500/25 border-pink-400/50 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-[11px]">{b.label}</div>
                    <div className="text-[10px] text-white/50">{b.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/40 mt-1.5">※ バイノーラル効果を最大化するにはイヤホンまたはヘッドホンの使用を推奨します。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
