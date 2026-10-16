export type ScaleType = 'hirajoshi' | 'pentatonic_major' | 'dorian_dream' | 'lydian_float' | 'ambient_minor';

export type NatureLayerKey = 
  | 'rain' 
  | 'waves' 
  | 'stream' 
  | 'birds' 
  | 'crickets' 
  | 'fire' 
  | 'wind' 
  | 'vinyl' 
  | 'singingBowl';

export type BinauralType = 'none' | 'theta_4hz' | 'alpha_8hz' | 'delta_2hz';

export type ColorTheme = 'twilight' | 'sakura' | 'midnight' | 'forest' | 'amber';

export interface CompositionState {
  title: string;
  description: string;
  poetry: string;
  rootNote: string;
  scale: ScaleType;
  tuningHz: number; // 432, 440, 528
  bpm: number; // 46 - 64
  instruments: {
    padWarmth: number; // 0.0 - 1.0
    pianoPresence: number; // 0.0 - 1.0
    chimeFrequency: number; // 0.0 - 1.0
    binauralType: BinauralType;
  };
  natureLayers: Record<NatureLayerKey, number>;
  colorTheme: ColorTheme;
}

export interface PresetJourney {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  composition: CompositionState;
}

export const PRESET_JOURNEYS: PresetJourney[] = [
  {
    id: 'night_sakura',
    name: '夜桜の静寂',
    subtitle: '平調子の調べと清らかな水琴窟',
    icon: '🌸',
    composition: {
      title: '夜桜の静寂 (Night Sakura)',
      description: '春の夜風に舞う花びらと、遠くで響く水琴窟の涼やかな調べ。心に積もった雑音を静かに洗い流します。',
      poetry: '夜風そよぎ\n水面に揺れる花明かり\n心静かに解けてゆく',
      rootNote: 'D',
      scale: 'hirajoshi',
      tuningHz: 432,
      bpm: 52,
      instruments: {
        padWarmth: 0.75,
        pianoPresence: 0.55,
        chimeFrequency: 0.75,
        binauralType: 'theta_4hz',
      },
      natureLayers: {
        rain: 0.05,
        waves: 0.0,
        stream: 0.45,
        birds: 0.0,
        crickets: 0.35,
        fire: 0.0,
        wind: 0.3,
        vinyl: 0.15,
        singingBowl: 0.4,
      },
      colorTheme: 'sakura',
    },
  },
  {
    id: 'rain_piano',
    name: '雨音とショパン',
    subtitle: 'ノスタルジックな暖炉とピアノの調べ',
    icon: '🌧️',
    composition: {
      title: '雨音とショパン (Rain & Warm Piano)',
      description: '窓を伝う優しい雨粒と、暖炉のそばで奏でる柔らかなピアノの和音。読書や物思いに耽るひとときに。',
      poetry: '雨粒の調べ\n古びた部屋を満たして\n深まる安らぎの刻',
      rootNote: 'C',
      scale: 'pentatonic_major',
      tuningHz: 440,
      bpm: 56,
      instruments: {
        padWarmth: 0.8,
        pianoPresence: 0.85,
        chimeFrequency: 0.25,
        binauralType: 'alpha_8hz',
      },
      natureLayers: {
        rain: 0.65,
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
  },
  {
    id: 'starlight_lullaby',
    name: '星巡りの子守唄',
    subtitle: '432Hzの宇宙パッドとシマーベル',
    icon: '🌌',
    composition: {
      title: '星巡りの子守唄 (Starlight Lullaby)',
      description: '銀河の深淵をたゆたうような432Hzのアンビエントパッドとシマーベル。深い眠りへの導入に最適です。',
      poetry: '無限の星屑\n静寂の海にただよう\n夢の彼方へ',
      rootNote: 'F',
      scale: 'lydian_float',
      tuningHz: 432,
      bpm: 48,
      instruments: {
        padWarmth: 0.9,
        pianoPresence: 0.4,
        chimeFrequency: 0.65,
        binauralType: 'theta_4hz',
      },
      natureLayers: {
        rain: 0.0,
        waves: 0.25,
        stream: 0.0,
        birds: 0.0,
        crickets: 0.1,
        fire: 0.0,
        wind: 0.35,
        vinyl: 0.1,
        singingBowl: 0.6,
      },
      colorTheme: 'midnight',
    },
  },
  {
    id: 'zen_breath',
    name: '瞑想と呼吸',
    subtitle: '528Hz愛の周波数とチベタンシンギングボウル',
    icon: '🧘',
    composition: {
      title: '瞑想と呼吸 (Zen Breath & Mindfulness)',
      description: '深い倍音を響かせるシンギングボウルと、DNA修復・リラクゼーション周波数とされる528Hzの安寧の響き。',
      poetry: '吸う息に光を\n吐く息に静寂を\n今この瞬間に在る',
      rootNote: 'C',
      scale: 'hirajoshi',
      tuningHz: 528,
      bpm: 50,
      instruments: {
        padWarmth: 0.85,
        pianoPresence: 0.3,
        chimeFrequency: 0.5,
        binauralType: 'theta_4hz',
      },
      natureLayers: {
        rain: 0.0,
        waves: 0.0,
        stream: 0.3,
        birds: 0.15,
        crickets: 0.0,
        fire: 0.0,
        wind: 0.25,
        vinyl: 0.05,
        singingBowl: 0.85,
      },
      colorTheme: 'forest',
    },
  },
  {
    id: 'cafe_afternoon',
    name: '森の隠れ家カフェ',
    subtitle: '優しい小鳥のさえずりと暖かなエレピ',
    icon: '☕',
    composition: {
      title: '森の隠れ家カフェ (Forest Hideaway Cafe)',
      description: '木漏れ日が差し込む静かな山小屋カフェ。柔らかなジャズコードと小鳥の声が、心地よい集中をもたらします。',
      poetry: '温かいカップ\n森を渡る木漏れ日\n思考がほどける午後',
      rootNote: 'Eb',
      scale: 'dorian_dream',
      tuningHz: 440,
      bpm: 60,
      instruments: {
        padWarmth: 0.7,
        pianoPresence: 0.75,
        chimeFrequency: 0.35,
        binauralType: 'alpha_8hz',
      },
      natureLayers: {
        rain: 0.0,
        waves: 0.0,
        stream: 0.25,
        birds: 0.55,
        crickets: 0.0,
        fire: 0.25,
        wind: 0.2,
        vinyl: 0.3,
        singingBowl: 0.0,
      },
      colorTheme: 'amber',
    },
  },
  {
    id: 'dawn_ocean',
    name: '夜明けの凪',
    subtitle: '寄せては返す潮騒と朝の光',
    icon: '🌊',
    composition: {
      title: '夜明けの凪 (Dawn Calm Tide)',
      description: '水平線が淡い朝焼けに染まる海辺。寄せては返す穏やかな波音と、希望を宿すハープのような調べ。',
      poetry: '朝露のひかり\n静かな波の呼吸\n新たな一日が目覚める',
      rootNote: 'G',
      scale: 'pentatonic_major',
      tuningHz: 432,
      bpm: 54,
      instruments: {
        padWarmth: 0.8,
        pianoPresence: 0.6,
        chimeFrequency: 0.7,
        binauralType: 'alpha_8hz',
      },
      natureLayers: {
        rain: 0.0,
        waves: 0.75,
        stream: 0.0,
        birds: 0.3,
        crickets: 0.0,
        fire: 0.0,
        wind: 0.3,
        vinyl: 0.05,
        singingBowl: 0.3,
      },
      colorTheme: 'twilight',
    },
  },
];
