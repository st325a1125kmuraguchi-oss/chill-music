import React, { useState } from 'react';
import { CompositionState } from '../audio/types';
import { Sparkles, Wand2, X, Loader2, Music, Check, Moon, Coffee, Heart, Feather } from 'lucide-react';

interface AiComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyComposition: (newComp: CompositionState) => void;
}

const QUICK_INSPIRATIONS = [
  { icon: Moon, text: '月明かりの降る静かな湖畔と遠くの鐘' },
  { icon: Coffee, text: '夜更けの読書と温かいハーブティー' },
  { icon: Feather, text: '疲れた頭を優しく包み込む深い眠り' },
  { icon: Heart, text: '不安を溶かして心を整える呼吸の音楽' },
  { icon: Sparkles, text: '雪が音を吸い込む静寂の夜と暖炉' },
  { icon: Music, text: '新緑の木漏れ日と穏やかなせせらぎ' },
];

export const AiComposerModal: React.FC<AiComposerModalProps> = ({ isOpen, onClose, onApplyComposition }) => {
  const [promptText, setPromptText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt?: string) => {
    const finalPrompt = targetPrompt || promptText;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onApplyComposition(json.data);
        onClose();
      } else {
        throw new Error('音楽の生成に失敗しました');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('生成中に問題が発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-xl backdrop-blur-2xl bg-slate-900/90 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-wide">AI 情景アンビエント作曲</h3>
            <p className="text-xs text-white/60">心に浮かぶ情景や感情から、世界にひとつの癒やしの音響を紡ぎ出します</p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-white/80 mb-2">
            どんな情景や気分に寄り添う音楽をお望みですか？
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="例: 雨の降る古びた書斎で、温かい紅茶を飲みながらゆっくり眠りにつきたい..."
            rows={3}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/15 focus:border-indigo-400 focus:bg-white/10 text-white placeholder-white/35 text-sm resize-none focus:outline-none transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Quick Suggestions */}
        <div className="mt-4">
          <span className="text-[11px] font-medium text-white/50 block mb-2">クイック発想プリセット:</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_INSPIRATIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptText(item.text);
                    handleGenerate(item.text);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-white/80 hover:text-white transition-all active:scale-95 text-left disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-300 mt-3">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl hover:bg-white/10 text-xs text-white/70 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !promptText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-medium text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>心を鎮める音を調律中…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>音楽を生成して調律</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
