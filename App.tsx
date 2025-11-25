
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateBoard, isTileFree, isMatch, findAvailableMove, shuffleVisibleTiles, getAutoPlayAction, getDebugInfo } from './utils/gameLogic';
import { TileInstance, GamePhase, Theme, Difficulty, TileSet, TileDefinition } from './types';
import { Tile } from './components/Tile';
import { Confetti } from './components/Confetti';
import { Background } from './components/Background';
import { getGeminiHint } from './services/geminiService';
import { playSound, setMasterVolume, setMusicVolume, setMuted, startAmbientMusic, speakHebrew, setVoiceVolume, getHebrewVoices, setNarratorVoice, setNarratorPersona, NarratorPersona } from './utils/audio';
import { RefreshCw, Undo2, ScrollText, Shuffle, Lightbulb, Trophy, Settings, Volume2, VolumeX, X, CircleHelp, SignalHigh, SignalMedium, SignalLow, Languages, TreePine, Club, Smile, Lock, Bot, Copy, Bug, Play, Music, Mic, User } from 'lucide-react';
import { TILE_WIDTH, TILE_HEIGHT, TILES } from './constants';

type Toast = { message: string; id: number; };
const START_PHRASES = ["בהצלחה", "בוא נתחיל", "זמן להרמוניה", "משחק חדש מתחיל"];
const MATCH_PHRASES = ["מצוין", "יפה מאוד", "מהלך טוב", "כל הכבוד", "אתה מתקדם יפה", "המשך כך"];
const WIN_PHRASES = ["ניצחון מדהים!", "כל הלוח נקי, כל הכבוד", "סיימת את השלב בהצלחה"];
const LOSS_PHRASES = ["נגמרו המהלכים", "לא נורא, נסה שוב", "הגענו למבוי סתום"];

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [tiles, setTiles] = useState<TileInstance[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<number[][]>([]);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<number | null>(null); 
  const [isSageLoading, setIsSageLoading] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [hintPairs, setHintPairs] = useState<number[]>([]);
  const [scale, setScale] = useState(1);
  const [noMoves, setNoMoves] = useState(false);
  const [gameId, setGameId] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const [narratorVolume, setNarratorVolume] = useState(1.0);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [theme, setTheme] = useState<Theme>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [tileSet, setTileSet] = useState<TileSet>('standard');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [boardDimensions, setBoardDimensions] = useState({ width: 0, height: 0 });
  const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentPersona, setCurrentPersona] = useState<NarratorPersona>('standard');
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, id: Date.now() });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  const updateScale = useCallback(() => {
    if (!containerRef.current || tiles.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    tiles.forEach(t => {
      minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
      minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y);
    });
    if (minX === Infinity) return;
    const PADDING = 40; 
    const pixelWidth = (maxX - minX) * (TILE_WIDTH / 2) + TILE_WIDTH + (PADDING * 2); 
    const pixelHeight = (maxY - minY) * (TILE_HEIGHT / 2) + TILE_HEIGHT + (PADDING * 2);
    const offsetX = (minX * (TILE_WIDTH / 2)) - PADDING;
    const offsetY = (minY * (TILE_HEIGHT / 2)) - PADDING;
    setBoardDimensions({ width: pixelWidth, height: pixelHeight });
    setBoardOffset({ x: offsetX, y: offsetY });
    const availableW = window.innerWidth;
    const availableH = window.innerHeight - 90; 
    const scaleX = availableW / pixelWidth;
    const scaleY = availableH / pixelHeight;
    let newScale = Math.min(scaleX, scaleY);
    if (newScale > 3.5) newScale = 3.5;
    setScale(newScale);
  }, [tiles]);

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    if (tiles.length > 0) updateScale();
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale, tiles]);

  useEffect(() => {
     // Load voices for settings
     const loadVoices = () => {
         const v = getHebrewVoices();
         setAvailableVoices(v);
     };
     if (typeof window !== 'undefined' && window.speechSynthesis) {
         window.speechSynthesis.onvoiceschanged = loadVoices;
         loadVoices();
     }
  }, []);

  const startNewGame = useCallback(() => {
    try {
      const newBoard = generateBoard(difficulty);
      setTiles(newBoard); setScore(0); setHistory([]); setSelectedId(null); setPhase('playing'); setMatchedPairs([]); setHintPairs([]); setNoMoves(false); setToast(null); setGameId(prev => prev + 1); setIsAutoPlaying(false);
      if (hasStarted) {
        playSound('shuffle');
        speakHebrew(START_PHRASES[Math.floor(Math.random() * START_PHRASES.length)]);
      }
    } catch (e) { console.error("Error starting game:", e); showToast("שגיאה באתחול הלוח"); }
  }, [difficulty, showToast, hasStarted]);

  useEffect(() => { startNewGame(); }, [startNewGame]);

  useEffect(() => {
    if (phase !== 'playing' || tiles.length === 0 || matchedPairs.length > 0) return;
    const visible = tiles.filter(t => t.isVisible);
    if (visible.length === 0) {
      setPhase('won'); playSound('win'); speakHebrew(WIN_PHRASES[Math.floor(Math.random() * WIN_PHRASES.length)]); askSage("Victory"); setIsAutoPlaying(false); return;
    }
    const freeTiles = visible.filter(t => isTileFree(visible, t));
    if (visible.length < 2 || freeTiles.length < 2) {
      setPhase('lost'); playSound('undo'); speakHebrew(LOSS_PHRASES[Math.floor(Math.random() * LOSS_PHRASES.length)]); return;
    }
    const move = findAvailableMove(tiles);
    if (!move) {
        if (!noMoves) { setNoMoves(true); showToast("אין מהלכים פנויים - נא לערבב!"); speakHebrew("אין זוגות, נסה לערבב"); }
    } else { setNoMoves(false); }
  }, [tiles, phase, matchedPairs, noMoves, showToast]);

  useEffect(() => {
    if (!isAutoPlaying || phase !== 'playing' || matchedPairs.length > 0) return;
    const delay = 600 + Math.random() * 200;
    const timer = setTimeout(() => {
        const action = getAutoPlayAction(tiles, selectedId);
        if (action.type === 'move' && action.pair) {
            if (selectedId === null) handleTileClick(action.pair[0]);
            else { const target = action.pair[0] === selectedId ? action.pair[1] : action.pair[0]; if (target !== undefined) handleTileClick(target); else setSelectedId(null); }
        } else if (action.type === 'shuffle') { if (selectedId === null) handleShuffle(); else setSelectedId(null); } else { if (selectedId !== null) setSelectedId(null); }
    }, delay);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, tiles, phase, matchedPairs, selectedId]);

  useEffect(() => { setMasterVolume(volume); }, [volume]);
  useEffect(() => { setMusicVolume(bgmVolume); }, [bgmVolume]);
  useEffect(() => { setVoiceVolume(narratorVolume); }, [narratorVolume]);
  useEffect(() => { setMuted(isSoundMuted); }, [isSoundMuted]);

  const handleStartGame = () => { setHasStarted(true); startAmbientMusic(); setMusicVolume(bgmVolume); startNewGame(); };

  const handleTileClick = (instanceId: number) => {
    if (phase !== 'playing' || matchedPairs.length > 0) return;
    if (hintPairs.length > 0) setHintPairs([]);
    const clickedTile = tiles.find(t => t.instanceId === instanceId);
    if (!clickedTile || !clickedTile.isVisible || !isTileFree(tiles, clickedTile)) return;
    if (selectedId === instanceId) { setSelectedId(null); playSound('select'); return; }
    if (selectedId === null) { setSelectedId(instanceId); playSound('select'); return; }
    const firstTile = tiles.find(t => t.instanceId === selectedId);
    if (firstTile && isMatch(firstTile.def, clickedTile.def)) {
      setMatchedPairs([selectedId, instanceId]); playSound('match');
      if (Math.random() < 0.15) speakHebrew(MATCH_PHRASES[Math.floor(Math.random() * MATCH_PHRASES.length)]);
      setTimeout(() => {
        const newTiles = tiles.map(t => { if (t.instanceId === selectedId || t.instanceId === instanceId) return { ...t, isVisible: false }; return t; });
        setTiles(newTiles); setHistory(prev => [...prev, [selectedId, instanceId]]); setScore(prev => prev + 10); setSelectedId(null); setMatchedPairs([]);
      }, 300); 
    } else { setSelectedId(instanceId); playSound('select'); }
  };

  const handleUndo = () => {
    if (matchedPairs.length > 0 || history.length === 0) return;
    setHintPairs([]);
    const lastMove = history[history.length - 1];
    const newTiles = tiles.map(t => { if (lastMove.includes(t.instanceId)) return { ...t, isVisible: true }; return t; });
    setTiles(newTiles); setHistory(prev => prev.slice(0, -1)); setScore(prev => Math.max(0, prev - 10)); setSelectedId(null); if (phase === 'lost') setPhase('playing'); playSound('undo');
  };

  const handleShuffle = () => {
    if (phase !== 'playing' || matchedPairs.length > 0) return;
    setHintPairs([]); const shuffledTiles = shuffleVisibleTiles(tiles); setTiles(shuffledTiles); setHistory([]); setSelectedId(null); setNoMoves(false); showToast("הלוח עורבב"); speakHebrew("מערבב את הקלפים"); playSound('shuffle');
  };

  const handleHint = () => {
    if (phase !== 'playing' || matchedPairs.length > 0) return;
    const move = findAvailableMove(tiles);
    if (move) { setHintPairs(move); playSound('hint'); speakHebrew("הנה רמז קטן"); setTimeout(() => setHintPairs([]), 2000); } else { showToast("אין זוגות פנויים - יש לערבב!"); playSound('undo'); }
  };

  const askSage = async (context: string) => {
    if (isSageLoading) return; setIsSageLoading(true); setHintPairs([]); if (context !== "Victory") playSound('hint');
    try { const msg = await getGeminiHint(context); showToast(msg); } catch (e) { showToast("שתיקה..."); } finally { setIsSageLoading(false); }
  };

  const changeDifficulty = (newDiff: Difficulty) => { setDifficulty(newDiff); playSound('select'); };
  const copyDebugInfo = () => { const info = getDebugInfo(tiles); navigator.clipboard.writeText(`Debug:\n${info}`); showToast("מידע דיבאג הועתק!"); };

  const renderDemoTile = (def: TileDefinition, label: string, set: TileSet = 'standard') => {
     if (!def) return <div className="text-red-500 text-xs">Error</div>;
     const mockTile: TileInstance = { instanceId: -1, def, x: 0, y: 0, z: 0, isVisible: true };
     return (
       <div className="flex flex-col items-center gap-6 scale-90 mb-4">
         <div className="relative" style={{ width: TILE_WIDTH, height: TILE_HEIGHT }}>
            <Tile tile={mockTile} isFree={true} isHint={false} isMatched={false} isSelected={false} theme={theme} tileSet={set} onClick={() => {}} />
         </div>
         <span className="text-xs text-white font-bold bg-black/40 px-2 py-0.5 rounded-full">{label}</span>
       </div>
     );
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden" dir="rtl">
        <Background /> <Confetti />
        <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
           <div className="w-32 h-32 bg-gradient-to-br from-red-700 to-red-900 rounded-[24px] shadow-2xl flex items-center justify-center border-4 border-amber-500/50 transform rotate-3 hover:rotate-0 transition-all duration-500"><span className="text-8xl filter drop-shadow-lg">🀄</span></div>
           <div className="text-center"><h1 className="text-6xl font-serif text-amber-100 font-bold mb-2 drop-shadow-lg tracking-wide">מאג'ונג זן</h1><p className="text-xl text-amber-200/80 font-light tracking-widest">הרמוניה • שלווה • חוכמה</p></div>
           <button onClick={handleStartGame} className="group relative bg-amber-600 hover:bg-amber-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all active:scale-95 flex items-center gap-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Play size={32} fill="currentColor" /> התחל משחק
           </button>
           <div className="text-slate-400 text-sm mt-8 flex items-center gap-2 drop-shadow-md"><Music size={14} className="animate-pulse" /><span>מומלץ לשחק עם קול</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden select-none font-sans bg-transparent" dir="rtl">
      <Background />
      {toast && (<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[300] pointer-events-none w-full flex justify-center px-4"><div key={toast.id} className="bg-black/85 text-amber-100 px-8 py-5 rounded-2xl shadow-2xl backdrop-blur-md border border-amber-500/40 text-xl font-serif text-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 max-w-sm">{toast.message}</div></div>)}

      <header className="flex-none h-14 px-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-black/20 backdrop-blur-sm p-1.5 pl-3 rounded-full border border-white/10 shadow-lg">
           <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center text-lg shadow-inner border border-red-500 text-white">🀄</div>
           <span className="text-amber-100 font-bold tracking-wide text-sm shadow-black drop-shadow-md hidden sm:inline">מאג'ונג</span>
           {isAutoPlaying && <Bot size={16} className="text-green-400 animate-pulse ml-1" />}
        </div>
        <div className="flex gap-2 sm:gap-3 pointer-events-auto items-center">
           <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 text-right"><div className="text-[9px] text-amber-200/70 uppercase font-bold">אריחים</div><div className="font-serif text-lg text-amber-400 leading-none">{tiles.filter(t => t.isVisible).length}<span className="text-xs text-white/40 mx-1">/</span><span className="text-xs text-white/40">{tiles.length}</span></div></div>
           <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 text-right"><div className="text-[9px] text-amber-200/70 uppercase font-bold">ניקוד</div><div className="font-serif text-lg text-amber-400 leading-none">{score}</div></div>
           <button onClick={() => setShowHelp(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm border border-white/5 text-amber-100 active:scale-95 transition-all hover:bg-white/10"><CircleHelp size={20} /></button>
           <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm border border-white/5 text-amber-100 active:scale-95 transition-all hover:bg-white/10"><Settings size={20} /></button>
        </div>
      </header>

      {showHelp && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
           <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0"><h2 className="text-amber-100 font-bold text-lg flex items-center gap-2"><CircleHelp size={18} /> הוראות ומילון אריחים</h2><button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button></div>
              <div className="p-6 overflow-y-auto no-scrollbar space-y-8 text-right" dir="rtl">
                 <section><h3 className="text-amber-400 font-bold text-lg mb-2 border-b border-amber-400/20 pb-1 inline-block">מטרת המשחק</h3><p className="text-slate-300 text-sm leading-relaxed">יש לנקות את כל האריחים מהלוח על ידי יצירת זוגות תואמים. ניתן לבחור רק אריחים <strong>"חופשיים"</strong> (שאין עליהם אריח אחר, ולפחות צד אחד שלהם פנוי - ימין או שמאל).</p></section>
                 <section className="bg-white/5 p-4 rounded-xl border border-white/5"><h3 className="text-amber-400 font-bold text-lg mb-4 border-b border-amber-400/20 pb-1 inline-block">חוקים מיוחדים (התאמות)</h3><p className="text-slate-300 text-sm mb-4">ברוב המקרים, יש להתאים אריח זהה לאריח זהה. אך ישנם שני סוגים מיוחדים:</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="flex flex-col items-center"><div className="text-sm font-bold text-emerald-400 mb-2">אריחי פרחים (Flowers)</div><div className="flex items-center gap-4">{renderDemoTile(TILES.find(t => t.id === 'flower-plum')!, 'שזיף')}<div className="text-2xl text-slate-500">=</div>{renderDemoTile(TILES.find(t => t.id === 'flower-bamboo')!, 'במבוק')}</div><div className="text-xs text-slate-400 mt-2 text-center">כל הפרחים מתאימים זה לזה.</div></div><div className="flex flex-col items-center"><div className="text-sm font-bold text-red-400 mb-2">אריחי עונות (Seasons)</div><div className="flex items-center gap-4">{renderDemoTile(TILES.find(t => t.id === 'season-spring')!, 'אביב')}<div className="text-2xl text-slate-500">=</div>{renderDemoTile(TILES.find(t => t.id === 'season-winter')!, 'חורף')}</div><div className="text-xs text-slate-400 mt-2 text-center">כל העונות מתאימות זו לזו.</div></div></div></section>
                 <section><h3 className="text-amber-400 font-bold text-lg mb-4 border-b border-amber-400/20 pb-1 inline-block">מילון אריחים סיניים</h3><div className="space-y-6"><div><div className="text-sm font-bold text-slate-200 mb-2">דרקונים (Dragons)</div><div className="flex flex-wrap gap-4">{renderDemoTile(TILES.find(t => t.id === 'dragon-red')!, 'אדום (Trung)')}{renderDemoTile(TILES.find(t => t.id === 'dragon-green')!, 'ירוק (Fa)')}{renderDemoTile(TILES.find(t => t.id === 'dragon-white')!, 'לבן (Po)')}</div></div><div><div className="text-sm font-bold text-slate-200 mb-2">רוחות (Winds)</div><div className="flex flex-wrap gap-4">{renderDemoTile(TILES.find(t => t.id === 'wind-east')!, 'מזרח')}{renderDemoTile(TILES.find(t => t.id === 'wind-south')!, 'דרום')}{renderDemoTile(TILES.find(t => t.id === 'wind-west')!, 'מערב')}{renderDemoTile(TILES.find(t => t.id === 'wind-north')!, 'צפון')}</div></div><div><div className="text-sm font-bold text-slate-200 mb-2">סדרות (Suits) - מ-1 עד 9</div><div className="flex flex-wrap gap-6"><div className="flex gap-2">{renderDemoTile(TILES.find(t => t.id === 'dot-1')!, 'עיגול (1)')}{renderDemoTile(TILES.find(t => t.id === 'dot-2')!, 'עיגולים (2)')}</div><div className="flex gap-2">{renderDemoTile(TILES.find(t => t.id === 'bamboo-1')!, 'במבוק (1)')}{renderDemoTile(TILES.find(t => t.id === 'bamboo-2')!, 'במבוק (2)')}</div><div className="flex gap-2">{renderDemoTile(TILES.find(t => t.id === 'character-1')!, 'דמויות (1)')}{renderDemoTile(TILES.find(t => t.id === 'character-2')!, 'דמויות (2)')}</div></div></div></div></section>
                 <section className="bg-slate-950/30 p-4 rounded-xl border border-white/5"><h3 className="text-rose-400 font-bold text-lg mb-4 border-b border-rose-400/20 pb-1 inline-block">מילון קלפים (Cards)</h3><div className="space-y-6"><div><div className="text-sm font-bold text-slate-200 mb-2">סדרות (1-9)</div><div className="grid grid-cols-1 gap-2 text-xs text-slate-400"><div className="flex items-center gap-3"><span className="w-20">עיגולים</span><span className="text-lg">→</span>{renderDemoTile(TILES.find(t => t.id === 'dot-1')!, 'יהלום (A-9)', 'cards')}</div><div className="flex items-center gap-3"><span className="w-20">במבוק</span><span className="text-lg">→</span>{renderDemoTile(TILES.find(t => t.id === 'bamboo-1')!, 'תלתן (A-9)', 'cards')}</div><div className="flex items-center gap-3"><span className="w-20">דמויות</span><span className="text-lg">→</span>{renderDemoTile(TILES.find(t => t.id === 'character-1')!, 'לב (A-9)', 'cards')}</div></div></div><div><div className="text-sm font-bold text-slate-200 mb-2">רוחות (Winds) = קלפי ה-10</div><div className="flex flex-wrap gap-4">{renderDemoTile(TILES.find(t => t.id === 'wind-east')!, 'מזרח (10♦)', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'wind-south')!, 'דרום (10♣)', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'wind-west')!, 'מערב (10♥)', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'wind-north')!, 'צפון (10♠)', 'cards')}</div></div><div><div className="text-sm font-bold text-slate-200 mb-2">דרקונים = מלוכה (♠)</div><div className="flex flex-wrap gap-4">{renderDemoTile(TILES.find(t => t.id === 'dragon-red')!, 'אדום (J)', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'dragon-green')!, 'ירוק (Q)', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'dragon-white')!, 'לבן (K)', 'cards')}</div></div><div><div className="text-sm font-bold text-slate-200 mb-2">מיוחדים = ג'וקרים</div><div className="flex flex-wrap gap-4">{renderDemoTile(TILES.find(t => t.id === 'flower-plum')!, 'ג\'וקר אדום', 'cards')}{renderDemoTile(TILES.find(t => t.id === 'season-spring')!, 'ג\'וקר שחור', 'cards')}</div></div></div></section>
              </div>
              <div className="p-4 bg-black/20 text-center sticky bottom-0 backdrop-blur-md"><button onClick={() => setShowHelp(false)} className="text-amber-500 text-sm font-bold uppercase tracking-wider hover:text-amber-400">חזרה למשחק</button></div>
           </div>
        </div>
      )}

      {showSettings && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="w-[320px] max-h-[90vh] overflow-y-auto no-scrollbar bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 sticky top-0 z-10 backdrop-blur-md"><h2 className="text-amber-100 font-bold text-lg flex items-center gap-2"><Settings size={18} /> הגדרות</h2><button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button></div>
              <div className="p-6 space-y-6">
                
                {/* Difficulty */}
                <div className="space-y-3"><div className="text-sm text-slate-300">רמת קושי (משחק חדש)</div><div className="grid grid-cols-3 gap-2"><button onClick={() => changeDifficulty('easy')} className={`flex flex-col items-center justify-center h-14 rounded-lg border text-xs font-bold transition-all ${difficulty === 'easy' ? 'bg-green-600 border-green-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><SignalLow size={16} className="mb-1" />קל</button><button onClick={() => changeDifficulty('medium')} className={`flex flex-col items-center justify-center h-14 rounded-lg border text-xs font-bold transition-all ${difficulty === 'medium' ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><SignalMedium size={16} className="mb-1" />בינוני</button><button onClick={() => changeDifficulty('hard')} className={`flex flex-col items-center justify-center h-14 rounded-lg border text-xs font-bold transition-all ${difficulty === 'hard' ? 'bg-red-600 border-red-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><SignalHigh size={16} className="mb-1" />קשה</button></div></div>
                
                {/* Demo / Bot */}
                <div className="space-y-3 border-t border-white/10 pt-3"><div className="text-sm text-amber-300 flex items-center gap-1"><Bot size={14}/> הדגמה / בדיקה</div><div className="grid grid-cols-2 gap-2"><button onClick={() => { changeDifficulty('test'); setShowSettings(false); }} className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-bold transition-all ${difficulty === 'test' ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-slate-600'} text-white`}><Bug size={14} /> שלב בדיקה (קטן)</button><button onClick={() => { setIsAutoPlaying(!isAutoPlaying); setShowSettings(false); }} className={`flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-bold transition-all ${isAutoPlaying ? 'bg-green-600 border-green-400 animate-pulse' : 'bg-slate-800 border-slate-600'} text-white`}><Bot size={14} /> {isAutoPlaying ? 'עצור בוט' : 'משחק אוטומטי'}</button><button onClick={copyDebugInfo} className="col-span-2 flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-600 bg-slate-900 text-slate-400 text-xs font-bold hover:bg-slate-800"><Copy size={14} /> העתק מידע דיבאג (לדיווח)</button></div></div>
                
                {/* Narrator Settings */}
                <div className="space-y-3 border-t border-white/10 pt-3">
                    <div className="text-sm text-cyan-300 flex items-center gap-1"><Mic size={14}/> הגדרות קריין</div>
                    <select onChange={(e) => setNarratorVoice(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg p-2 mb-2">
                        <option value="">קול מערכת (אוטומטי)</option>
                        {availableVoices.map(v => (<option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setNarratorPersona('standard'); setCurrentPersona('standard'); }} className={`text-xs p-2 rounded border ${currentPersona === 'standard' ? 'bg-cyan-700 border-cyan-500' : 'bg-slate-800 border-slate-600'}`}>רגיל</button>
                        <button onClick={() => { setNarratorPersona('zen'); setCurrentPersona('zen'); }} className={`text-xs p-2 rounded border ${currentPersona === 'zen' ? 'bg-cyan-700 border-cyan-500' : 'bg-slate-800 border-slate-600'}`}>רגוע (זן)</button>
                        <button onClick={() => { setNarratorPersona('grandfather'); setCurrentPersona('grandfather'); }} className={`text-xs p-2 rounded border ${currentPersona === 'grandfather' ? 'bg-cyan-700 border-cyan-500' : 'bg-slate-800 border-slate-600'}`}>סבא</button>
                        <button onClick={() => { setNarratorPersona('energetic'); setCurrentPersona('energetic'); }} className={`text-xs p-2 rounded border ${currentPersona === 'energetic' ? 'bg-cyan-700 border-cyan-500' : 'bg-slate-800 border-slate-600'}`}>אנרגטי</button>
                    </div>
                    <button onClick={() => speakHebrew("שלום, אני הקריין החדש שלך. שיהיה בהצלחה.")} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs p-2 rounded-lg mt-2"><Volume2 size={14} /> בדוק קול</button>
                </div>

                {/* Audio Levels */}
                <div className="space-y-4 border-t border-white/10 pt-3"><div className="flex justify-between items-center text-sm text-slate-300"><span className="flex items-center gap-2"><Volume2 size={16}/> אפקטים (SFX)</span><button onClick={() => setIsSoundMuted(!isSoundMuted)} className="text-amber-400">{isSoundMuted ? <VolumeX size={18} /> : null}</button></div><input type="range" min="0" max="1" step="0.05" value={isSoundMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isSoundMuted) setIsSoundMuted(false); }} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" /><div className="flex justify-between items-center text-sm text-slate-300"><span className="flex items-center gap-2"><Music size={16}/> מוסיקת רקע</span></div><input type="range" min="0" max="0.8" step="0.05" value={isSoundMuted ? 0 : bgmVolume} onChange={(e) => { setBgmVolume(parseFloat(e.target.value)); if (isSoundMuted) setIsSoundMuted(false); }} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" /><div className="flex justify-between items-center text-sm text-slate-300"><span className="flex items-center gap-2"><Mic size={16}/> עוצמת קריין</span></div><input type="range" min="0" max="1" step="0.1" value={isSoundMuted ? 0 : narratorVolume} onChange={(e) => { setNarratorVolume(parseFloat(e.target.value)); if (isSoundMuted) setIsSoundMuted(false); }} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" /></div>
                
                {/* Themes */}
                <div className="space-y-3 border-t border-white/10 pt-3"><div className="text-sm text-slate-300">עיצוב כללי</div><div className="grid grid-cols-3 gap-2"><button onClick={() => { setTheme('classic'); playSound('select'); }} className={`h-12 rounded-lg border text-xs font-bold transition-all ${theme === 'classic' ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>מסורתי</button><button onClick={() => { setTheme('modern'); playSound('select'); }} className={`h-12 rounded-lg border text-xs font-bold transition-all ${theme === 'modern' ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>מודרני</button><button onClick={() => { setTheme('minimalist'); playSound('select'); }} className={`h-12 rounded-lg border text-xs font-bold transition-all ${theme === 'minimalist' ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>מינימליסטי</button><button onClick={() => { setTheme('retro'); playSound('select'); }} className={`h-12 rounded-lg border text-xs font-bold transition-all ${theme === 'retro' ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>רטרו</button><button onClick={() => { setTheme('dark'); playSound('select'); }} className={`h-12 rounded-lg border text-xs font-bold transition-all ${theme === 'dark' ? 'bg-blue-900 border-blue-600 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>כהה</button></div></div>
                
                {/* Tile Sets */}
                <div className="space-y-3 border-t border-white/10 pt-3"><div className="text-sm text-slate-300">סוג אריחים (תמונות)</div><div className="grid grid-cols-3 gap-2"><button onClick={() => { setTileSet('standard'); playSound('select'); }} className={`flex flex-col items-center justify-center h-16 rounded-lg border text-xs font-bold transition-all ${tileSet === 'standard' ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><Languages size={18} className="mb-1" />סיני</button><button onClick={() => { setTileSet('western'); playSound('select'); }} className={`flex flex-col items-center justify-center h-16 rounded-lg border text-xs font-bold transition-all ${tileSet === 'western' ? 'bg-sky-600 border-sky-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><div className="mb-1 font-bold text-lg leading-none">123</div>מספרים</button><button onClick={() => { setTileSet('nature'); playSound('select'); }} className={`flex flex-col items-center justify-center h-16 rounded-lg border text-xs font-bold transition-all ${tileSet === 'nature' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><TreePine size={18} className="mb-1" />טבע</button><button onClick={() => { setTileSet('cards'); playSound('select'); }} className={`flex flex-col items-center justify-center h-16 rounded-lg border text-xs font-bold transition-all ${tileSet === 'cards' ? 'bg-rose-600 border-rose-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><Club size={18} className="mb-1" />קלפים</button><button onClick={() => { setTileSet('emoji'); playSound('select'); }} className={`flex flex-col items-center justify-center h-16 rounded-lg border text-xs font-bold transition-all ${tileSet === 'emoji' ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}><Smile size={18} className="mb-1" />אימוג'י</button></div></div>
              </div>
              <div className="p-4 bg-black/20 text-center sticky bottom-0 backdrop-blur-md"><button onClick={() => setShowSettings(false)} className="text-amber-500 text-sm font-bold uppercase tracking-wider hover:text-amber-400">סגור</button></div>
           </div>
        </div>
      )}

      <main ref={containerRef} className="flex-1 relative w-full flex items-center justify-center pointer-events-none">
        <div className={`absolute pointer-events-auto origin-center ${boardDimensions.width === 0 ? 'opacity-0' : 'opacity-100'}`} style={{ width: `${boardDimensions.width}px`, height: `${boardDimensions.height}px`, transform: `scale(${scale})` }}>
            <div key={gameId} className="absolute top-0 left-0 w-full h-full" style={{ transform: `translate(-${boardOffset.x}px, -${boardOffset.y}px)` }}>{tiles.map(tile => (tile.isVisible && (<Tile key={tile.instanceId} tile={tile} isSelected={selectedId === tile.instanceId} isMatched={matchedPairs.includes(tile.instanceId)} isHint={hintPairs.includes(tile.instanceId)} isFree={isTileFree(tiles, tile)} theme={theme} tileSet={tileSet} onClick={() => handleTileClick(tile.instanceId)} />)))}</div>
        </div>
        {phase === 'won' && (<div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"><Confetti /><div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/30 p-8 rounded-2xl text-center shadow-2xl max-w-xs transform scale-100 animate-in zoom-in z-50 relative"><Trophy size={48} className="mx-auto text-amber-400 mb-4 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /><h2 className="text-2xl font-serif text-amber-100 mb-2">ההרמוניה הושבה</h2>{toast && toast.id && (<p className="text-slate-400 mb-6 text-sm italic">"{toast.message}"</p>)}<button onClick={startNewGame} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-bold w-full shadow-lg active:scale-95 transition-all">משחק חדש</button></div></div>)}
        {phase === 'lost' && (<div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto animate-in fade-in duration-500"><div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-red-500/30 p-10 rounded-3xl text-center shadow-2xl max-w-[320px] transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden"><div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(220,38,38,0.1)_0%,transparent_60%)] animate-pulse pointer-events-none" /><div className="relative z-10"><div className="w-24 h-24 bg-gradient-to-br from-red-900/40 to-black rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_25px_rgba(220,38,38,0.2)]"><Lock size={48} className="text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" /></div><h2 className="text-3xl font-serif font-bold text-red-100 mb-3 tracking-wide">אין עוד מהלכים</h2><p className="text-slate-400 mb-8 text-sm leading-relaxed px-2">הגעת למבוי סתום.<br/>גם ערבוב הקלפים לא יעזור במצב זה.</p><button onClick={startNewGame} className="group relative w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden"><span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" /><RefreshCw size={20} className="animate-[spin_4s_linear_infinite]" /><span className="text-base tracking-wide">נסה שלב מחדש</span></button></div></div></div>)}
      </main>

      <footer className="flex-none pb-safe pt-2 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent"><div className="flex justify-center items-end gap-2 sm:gap-6 pb-4 px-2"><ControlButton icon={<Undo2 size={22} />} label="בטל" onClick={handleUndo} disabled={history.length === 0} /><ControlButton icon={<Shuffle size={22} />} label="ערבב" onClick={handleShuffle} pulse={noMoves} /><div className="mx-2 mb-2"><button onClick={handleHint} className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_4px_15px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center text-amber-50 border border-amber-400/30 active:scale-95 transition-transform"><Lightbulb size={28} fill="currentColor" className="text-amber-100" /></button></div><ControlButton icon={<ScrollText size={22} />} label="החכם" onClick={() => askSage("Advice")} disabled={isSageLoading} /><ControlButton icon={<RefreshCw size={22} />} label="מחדש" onClick={startNewGame} color="red" /></div></footer>
    </div>
  );
}

const ControlButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; color?: 'default' | 'red'; pulse?: boolean; }> = ({ icon, label, onClick, disabled, color = 'default', pulse }) => { return (<button onClick={onClick} disabled={disabled} className={`flex flex-col items-center justify-center w-14 py-2 rounded-xl transition-all duration-200 active:scale-95 ${disabled ? 'opacity-40 grayscale' : 'hover:bg-white/10'} ${color === 'red' ? 'text-red-300' : 'text-slate-200'} ${pulse ? 'animate-pulse text-amber-400 bg-amber-500/20 ring-1 ring-amber-400/50' : ''}`}><div className="mb-1 drop-shadow-md">{icon}</div><span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span></button>); };

export default App;
