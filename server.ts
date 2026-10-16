import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback presets if AI is offline or without key
const fallbackPresets = [
  {
    title: '夜桜の静寂 (Night Sakura)',
    description: '春の夜風に舞う花びらと、遠くで響く水琴窟の涼やかな調べ。',
    poetry: '夜風そよぎ\n水面に揺れる花明かり\n心静かに解けてゆく',
    rootNote: 'D',
    scale: 'hirajoshi',
    tuningHz: 432,
    bpm: 52,
    instruments: {
      padWarmth: 0.75,
      pianoPresence: 0.6,
      chimeFrequency: 0.8,
      binauralType: 'theta_4hz',
    },
    natureLayers: {
      rain: 0.1,
      waves: 0.0,
      stream: 0.45,
      birds: 0.0,
      crickets: 0.35,
      fire: 0.0,
      wind: 0.3,
      vinyl: 0.15,
      singingBowl: 0.5,
    },
    colorTheme: 'sakura',
  },
  {
    title: '雨音とショパン (Rain & Warm Piano)',
    description: '窓を伝う優しい雨粒と、暖炉のそばで奏でる柔らかなピアノの和音。',
    poetry: '雨粒の調べ\n古びた部屋を満たして\n深まる安らぎの刻',
    rootNote: 'C',
    scale: 'pentatonic_major',
    tuningHz: 440,
    bpm: 56,
    instruments: {
      padWarmth: 0.8,
      pianoPresence: 0.85,
      chimeFrequency: 0.3,
      binauralType: 'alpha_8hz',
    },
    natureLayers: {
      rain: 0.7,
      waves: 0.0,
      stream: 0.0,
      birds: 0.0,
      crickets: 0.0,
      fire: 0.4,
      wind: 0.2,
      vinyl: 0.35,
      singingBowl: 0.0,
    },
    colorTheme: 'twilight',
  },
  {
    title: '星巡りの子守唄 (Starlight Lullaby)',
    description: '銀河の深淵をたゆたうような432Hzのアンビエントパッドとシマーベル。',
    poetry: '無限の星屑\n静寂の海にただよう\n夢の彼方へ',
    rootNote: 'F',
    scale: 'lydian_float',
    tuningHz: 432,
    bpm: 48,
    instruments: {
      padWarmth: 0.9,
      pianoPresence: 0.4,
      chimeFrequency: 0.7,
      binauralType: 'theta_4hz',
    },
    natureLayers: {
      rain: 0.0,
      waves: 0.2,
      stream: 0.0,
      birds: 0.0,
      crickets: 0.1,
      fire: 0.0,
      wind: 0.4,
      vinyl: 0.1,
      singingBowl: 0.6,
    },
    colorTheme: 'midnight',
  },
];

// API endpoint for AI Ambient Music Generation
app.post('/api/compose', async (req, res) => {
  const { prompt } = req.body;
  const userPrompt = typeof prompt === 'string' && prompt.trim() ? prompt.trim() : '心身を芯からほぐす穏やかで温かい安らぎの音楽';

  if (!ai) {
    // Return an intelligent algorithmic preset tailored to keywords
    const lower = userPrompt.toLowerCase();
    let selected = fallbackPresets[0];
    if (lower.includes('雨') || lower.includes('本') || lower.includes('カフェ') || lower.includes('ピアノ')) {
      selected = fallbackPresets[1];
    } else if (lower.includes('星') || lower.includes('宇宙') || lower.includes('眠') || lower.includes('夜')) {
      selected = fallbackPresets[2];
    }
    return res.json({
      success: true,
      data: {
        ...selected,
        title: userPrompt.length < 20 ? `${userPrompt}の調べ` : selected.title,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `ユーザーの要望: "${userPrompt}"
この情景や感情に完璧に寄り添う、深く心身が落ち着くリラクゼーション・ヒーリング音楽のパラメータを設計してください。
和音は不協和音がなく、心拍数を落ち着かせる穏やかな周波数と自然音のブレンドにしてください。`,
      config: {
        systemInstruction: `あなたは世界最高峰のアンビエント音楽プロデューサー兼サウンドセラピストです。
ユーザーのリクエストに応じて、Web Audio APIで演奏するためのヒーリング音楽のパラメータと、日本語の心温まる詩的メッセージをJSONで生成してください。
scaleは必ず次のいずれか: "hirajoshi", "pentatonic_major", "dorian_dream", "lydian_float", "ambient_minor"
colorThemeは必ず次のいずれか: "twilight", "sakura", "midnight", "forest", "amber"
binauralTypeは必ず次のいずれか: "none", "theta_4hz", "alpha_8hz", "delta_2hz"
rootNoteは "C", "D", "Eb", "F", "G", "A", "Bb" のいずれか
bpmは 46〜64の落ち着くテンポ`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '日本の情緒ある楽曲タイトル' },
            description: { type: Type.STRING, description: 'この楽曲がもたらす情景と癒やしの説明' },
            poetry: { type: Type.STRING, description: '短く穏やかな2〜3行の詩や情景描写' },
            rootNote: { type: Type.STRING, description: '基準音 (C, D, Eb, F, G, A, Bb)' },
            scale: { type: Type.STRING, description: 'hirajoshi, pentatonic_major, dorian_dream, lydian_float, ambient_minor' },
            tuningHz: { type: Type.NUMBER, description: '432, 440, または 528' },
            bpm: { type: Type.NUMBER, description: '46から64のテンポ' },
            instruments: {
              type: Type.OBJECT,
              properties: {
                padWarmth: { type: Type.NUMBER, description: '0.0から1.0' },
                pianoPresence: { type: Type.NUMBER, description: '0.0から1.0' },
                chimeFrequency: { type: Type.NUMBER, description: '0.0から1.0' },
                binauralType: { type: Type.STRING, description: 'none, theta_4hz, alpha_8hz, delta_2hz' },
              },
              required: ['padWarmth', 'pianoPresence', 'chimeFrequency', 'binauralType'],
            },
            natureLayers: {
              type: Type.OBJECT,
              properties: {
                rain: { type: Type.NUMBER, description: '0.0から1.0' },
                waves: { type: Type.NUMBER, description: '0.0から1.0' },
                stream: { type: Type.NUMBER, description: '0.0から1.0' },
                birds: { type: Type.NUMBER, description: '0.0から1.0' },
                crickets: { type: Type.NUMBER, description: '0.0から1.0' },
                fire: { type: Type.NUMBER, description: '0.0から1.0' },
                wind: { type: Type.NUMBER, description: '0.0から1.0' },
                vinyl: { type: Type.NUMBER, description: '0.0から1.0' },
                singingBowl: { type: Type.NUMBER, description: '0.0から1.0' },
              },
              required: ['rain', 'waves', 'stream', 'birds', 'crickets', 'fire', 'wind', 'vinyl', 'singingBowl'],
            },
            colorTheme: { type: Type.STRING, description: 'twilight, sakura, midnight, forest, amber' },
          },
          required: [
            'title',
            'description',
            'poetry',
            'rootNote',
            'scale',
            'tuningHz',
            'bpm',
            'instruments',
            'natureLayers',
            'colorTheme',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error generating composition with Gemini:', err);
    // Graceful fallback
    return res.json({
      success: true,
      data: fallbackPresets[0],
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SereneSound server listening on port ${PORT}`);
  });
}

startServer();
