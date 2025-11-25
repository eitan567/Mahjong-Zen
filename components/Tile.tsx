
import React, { useState, useEffect } from 'react';
import { TileInstance, Theme, TileSet, TileDefinition } from '../types';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';
import { playSound } from '../utils/audio';
import { 
  Sun, Moon, Cloud, CloudRain, Snowflake, Wind, 
  TreePine, Flower2, Leaf, 
  Droplets, Flame, Mountain, Zap, 
  CircleHelp, Star, Anchor, Feather, Fish
} from 'lucide-react';

interface TileProps {
  tile: TileInstance;
  isSelected: boolean;
  isMatched: boolean;
  isHint: boolean;
  isFree: boolean;
  theme: Theme;
  tileSet: TileSet;
  onClick: () => void;
}

export const Tile: React.FC<TileProps> = ({ tile, isSelected, isMatched, isHint, isFree, theme, tileSet, onClick }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state when tile content changes
  useEffect(() => {
    setImgError(false);
  }, [tileSet, tile?.def?.id]);

  if (!tile || !tile.def) return null;

  // Theme Styles - BACKGROUND FACES
  const getThemeStyles = () => {
    switch (theme) {
      case 'modern':
        // High Gloss White with Cool Blue Tint (Tech look)
        return { background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)' };
      case 'minimalist':
        // Pure Flat White (Matte)
        return { background: '#ffffff' };
      case 'dark':
        // Deep Slate/Blue
        return { background: 'linear-gradient(145deg, #334155 0%, #1e293b 100%)' };
      case 'retro':
        // Amber/Bone (Aged Plastic)
        return { background: 'linear-gradient(145deg, #fef3c7 0%, #d97706 100%)' };
      case 'classic':
      default:
        // Authentic Bone/Ivory (Warm Cream)
        return { background: 'linear-gradient(to bottom, #fffbeb 0%, #f3e8ff 5%, #fdfdfd 20%, #fdfdfd 100%)' };
    }
  };

  const themeStyle = getThemeStyles();

  // 3D Shadow Logic - THE "SIDES" OF THE BLOCK
  const getBoxShadow = () => {
    if (isMatched) return '0 0 50px 10px rgba(255,255,255,0.9)';
    
    // Selected Glow
    if (isSelected) {
      const glowColor = theme === 'dark' ? '#60a5fa' : '#fbbf24'; 
      return `0 0 0 2px ${glowColor}, 0 0 20px ${glowColor}, 1px 1px 0px rgba(0,0,0,0.5)`;
    }

    // Hint Glow
    if (isHint) return `0 0 0 4px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4)`;

    // --- 3D BLOCK GEOMETRY GENERATOR ---
    let s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16;

    switch (theme) {
        case 'dark':
            // Dark Slate sides
            s1='#1e293b'; s2='#1c2738'; s3='#1a2535'; s4='#182332';
            s5='#16212f'; s6='#141f2c'; s7='#121d29'; s8='#101b26';
            s9='#0e1923'; s10='#0c1720'; s11='#0a151d'; s12='#08131a';
            s13='#061117'; s14='#040f14'; s15='#020d11'; s16='#000b0e';
            break;
        case 'retro':
            // Deep Amber/Brown sides
            s1='#b45309'; s2='#ac4e08'; s3='#a44907'; s4='#9c4406';
            s5='#943f05'; s6='#8c3a04'; s7='#843503'; s8='#7c3002';
            s9='#742b01'; s10='#6c2600'; s11='#642100'; s12='#5c1c00';
            s13='#541700'; s14='#4c1200'; s15='#440d00'; s16='#3c0800';
            break;
        case 'modern':
            // Electric Blue / Cyan sides (Plastic/Glass look)
            s1='#bae6fd'; s2='#7dd3fc'; s3='#38bdf8'; s4='#0ea5e9';
            s5='#0284c7'; s6='#0369a1'; s7='#075985'; s8='#0c4a6e';
            s9='#08334c'; s10='#062c41'; s11='#052536'; s12='#041e2b';
            s13='#031821'; s14='#021117'; s15='#010a0e'; s16='#000000';
            break;
        case 'minimalist':
            // Very Light, Clean Grey sides (Subtle but distinct)
            s1='#f4f4f5'; s2='#e4e4e7'; s3='#d4d4d8'; s4='#a1a1aa';
            s5='#71717a'; s6='#52525b'; s7='#3f3f46'; s8='#27272a';
            s9='#18181b'; s10='#18181b'; s11='#09090b'; s12='#000000';
            s13='#000000'; s14='#000000'; s15='#000000'; s16='#000000';
            break;
        case 'classic':
        default:
            // Authentic Green/Bamboo Backing Simulation (Greenish-Grey)
            s1='#d6d6d6'; s2='#cccccc'; s3='#c2c2c2'; s4='#b8b8b8'; // Bone layer
            s5='#065f46'; s6='#047857'; s7='#059669'; s8='#10b981'; // Bamboo layer starts
            s9='#059669'; s10='#047857'; s11='#065f46'; s12='#064e3b';
            s13='#022c22'; s14='#022c22'; s15='#000000'; s16='#000000';
            break;
    }

    return `
       1px 1px 0px ${s1},
       2px 2px 0px ${s2},
       3px 3px 0px ${s3},
       4px 4px 0px ${s4},
       5px 5px 0px ${s5},
       6px 6px 0px ${s6},
       7px 7px 0px ${s7},
       8px 8px 0px ${s8},
       9px 9px 0px ${s9},
       10px 10px 0px ${s10},
       11px 11px 0px ${s11},
       12px 12px 0px ${s12},
       13px 13px 0px ${s13},
       14px 14px 0px ${s14},
       15px 15px 0px ${s15},
       16px 16px 20px rgba(0,0,0,0.55)
    `;
  };

  const zStep = 12; 
  const left = tile.x * (TILE_WIDTH / 2);
  const top = tile.y * (TILE_HEIGHT / 2) - (tile.z * zStep);
  const baseZIndex = 10 + tile.z;
  const zBrightness = isFree ? 100 : 75;

  // --- EXTERNAL SVG ASSET MAPPING (STANDARD SET) ---
  const getExternalTileImage = () => {
    const { suit, value } = tile.def;
    const baseUrl = "https://raw.githubusercontent.com/FluffyStuff/riichi-mahjong-tiles/master/Regular";
    
    let filename = "";
    
    if (suit === 'dot') filename = `Pin${value}.svg`;
    else if (suit === 'bamboo') filename = `Sou${value}.svg`;
    else if (suit === 'character') filename = `Man${value}.svg`;
    else if (suit === 'wind') {
      if (value === 'east') filename = 'Ton.svg';
      if (value === 'south') filename = 'Nan.svg';
      if (value === 'west') filename = 'Sha.svg';
      if (value === 'north') filename = 'Pei.svg';
    }
    else if (suit === 'dragon') {
      if (value === 'red') filename = 'Chun.svg';
      if (value === 'green') filename = 'Hatsu.svg';
    }
    else if (suit === 'flower') return null; // Use manual render
    else if (suit === 'season') return null; // Use manual render
    
    if (!filename) return null;
    return `${baseUrl}/${filename}`;
  };

  // Helper to render corner index for Standard Set
  const renderCornerIndex = (def: TileDefinition) => {
    let label = '';
    let colorClass = 'text-slate-400';
    const isDark = theme === 'dark';

    if (typeof def.value === 'number') {
      label = def.value.toString();
      if (def.suit === 'character') colorClass = isDark ? 'text-red-400/80' : 'text-red-700/60';
      if (def.suit === 'bamboo') colorClass = isDark ? 'text-emerald-400/80' : 'text-emerald-700/60';
      if (def.suit === 'dot') colorClass = isDark ? 'text-blue-400/80' : 'text-blue-700/60';
    } else if (def.suit === 'wind') {
      label = (def.value as string).charAt(0).toUpperCase();
      colorClass = isDark ? 'text-slate-200/60' : 'text-slate-900/60';
    } else if (def.suit === 'dragon') {
      if (def.value === 'red') { label = 'R'; colorClass = 'text-red-600/60'; }
      if (def.value === 'green') { label = 'G'; colorClass = 'text-green-600/60'; }
      if (def.value === 'white') { label = 'W'; colorClass = 'text-blue-600/60'; }
    } else if (def.suit === 'flower') {
        label = 'F'; colorClass = 'text-emerald-600/60';
    } else if (def.suit === 'season') {
        label = 'S'; colorClass = 'text-red-600/60';
    }

    return (
      <div className={`absolute top-0.5 left-1.5 text-[10px] font-bold font-sans pointer-events-none select-none ${colorClass}`}>
        {label}
      </div>
    );
  };

  const renderContent = () => {
    // 1. STANDARD SET HANDLING (Chinese)
    if (tileSet === 'standard') {
        let content = null;
        
        // A. White Dragon (Po) - Manual Blue Frame
        if (tile.def.suit === 'dragon' && tile.def.value === 'white') {
           content = (
              <svg viewBox="0 0 100 134" className="w-full h-full p-4">
                <rect x="15" y="18" width="70" height="98" rx="4" fill="none" stroke="#1e3a8a" strokeWidth="6" />
              </svg>
           );
        }
        // B. Flowers - Calligraphy
        else if (tile.def.suit === 'flower') {
           const labels: any = { 1: '梅', 2: '蘭', 3: '竹', 4: '菊' };
           content = (
             <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <span className="text-[60px] font-serif text-emerald-700 leading-none select-none">{labels[tile.def.value]}</span>
                <div className="absolute top-2 right-2 text-xs font-bold text-emerald-800 border border-emerald-800 rounded-full w-5 h-5 flex items-center justify-center">{tile.def.value}</div>
             </div>
           );
        }
        // C. Seasons - Calligraphy
        else if (tile.def.suit === 'season') {
           const labels: any = { 1: '春', 2: '夏', 3: '秋', 4: '冬' };
           content = (
             <div className="flex flex-col items-center justify-center w-full h-full p-4">
                <span className="text-[60px] font-serif text-red-700 leading-none select-none">{labels[tile.def.value]}</span>
                <div className="absolute top-2 right-2 text-xs font-bold text-red-800 border border-red-800 rounded-full w-5 h-5 flex items-center justify-center">{tile.def.value}</div>
             </div>
           );
        }
        // D. Standard Suits (Images)
        else {
            const imgSrc = getExternalTileImage();
            if (imgSrc && !imgError) {
                content = (
                    <img src={imgSrc} alt={`${tile.def.suit}`} className="w-full h-full object-contain p-4 pointer-events-none select-none" draggable={false} onError={() => setImgError(true)} />
                );
            }
        }

        if (!content && imgError) {
             const emojiClass = "text-[90px]";
             content = <span className={`${emojiClass} flex items-center justify-center h-full pb-2 select-none text-black`}>{tile.def.char}</span>;
        }

        return <div className="relative w-full h-full">{content}{renderCornerIndex(tile.def)}</div>;
    }

    // 2. WESTERN / NUMBERS SET
    if (tileSet === 'western') {
        let label = tile.def.value.toString();
        let color = 'text-slate-800';
        let sub = '';

        if (tile.def.suit === 'character') { color = 'text-red-700'; sub = 'Char'; }
        else if (tile.def.suit === 'bamboo') { color = 'text-emerald-700'; sub = 'Bam'; }
        else if (tile.def.suit === 'dot') { color = 'text-blue-700'; sub = 'Dot'; }
        else if (tile.def.suit === 'wind') { 
            color = 'text-slate-900'; 
            label = (tile.def.value as string).charAt(0).toUpperCase();
            sub = 'Wind';
        }
        else if (tile.def.suit === 'dragon') {
            if (tile.def.value === 'red') { label = 'R'; color = 'text-red-600'; }
            if (tile.def.value === 'green') { label = 'G'; color = 'text-green-600'; }
            if (tile.def.value === 'white') { label = 'W'; color = 'text-blue-600'; }
            sub = 'Dragon';
        }
        else if (tile.def.suit === 'flower' || tile.def.suit === 'season') {
             label = tile.def.value.toString();
             color = 'text-purple-600';
             sub = tile.def.suit === 'flower' ? 'Flower' : 'Season';
        }

        if (theme === 'dark' && (color.includes('slate-800') || color.includes('slate-900'))) color = 'text-slate-200';

        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <span className={`text-[60px] font-black leading-none ${color}`}>{label}</span>
                <span className={`text-xs font-bold uppercase tracking-widest mt-2 ${color} opacity-60`}>{sub}</span>
            </div>
        );
    }

    // 3. NATURE SET
    if (tileSet === 'nature') {
        let Icon = CircleHelp;
        let color = 'text-slate-700';
        const { suit, value } = tile.def;
        const valNum = typeof value === 'number' ? value : 0;

        if (suit === 'dot') { color = 'text-amber-600'; Icon = valNum % 3 === 1 ? Sun : valNum % 3 === 2 ? Moon : Star; } 
        else if (suit === 'bamboo') { color = 'text-emerald-600'; Icon = valNum % 3 === 1 ? TreePine : valNum % 3 === 2 ? Flower2 : Leaf; }
        else if (suit === 'character') { color = 'text-blue-600'; const icons = [Cloud, CloudRain, Snowflake, Wind, Droplets, Zap, Flame, Mountain, Anchor]; Icon = icons[(valNum - 1) % icons.length] || Cloud; }
        else if (suit === 'dragon') { 
             if (value === 'red') { Icon = Flame; color = 'text-red-600'; }
             else if (value === 'green') { Icon = Mountain; color = 'text-green-700'; }
             else { Icon = Wind; color = 'text-slate-500'; }
        }
        else if (suit === 'wind') { Icon = Feather; color = 'text-slate-400'; }
        else { Icon = Fish; color = 'text-purple-500'; }

        if (theme === 'dark' && color.includes('slate')) color = 'text-slate-300';

        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <Icon size={56} className={`${color} filter drop-shadow-sm`} strokeWidth={1.5} />
                <span className={`absolute top-2 left-2 text-sm font-bold ${color} opacity-50`}>{typeof value === 'number' ? value : ''}</span>
            </div>
        );
    }

    // 4. CARDS SET (Mapped: Winds=10s, Dragons=Face, Flowers=Jokers)
    if (tileSet === 'cards') {
        const { suit, value } = tile.def;
        let cardCode = '';
        let cardLabel = '';
        let cardSuit = '';
        let isRed = false;

        const getCode = (val: number | string, suitCode: string) => {
           let v = val;
           if (v === 1) v = 'A';
           if (v === 10) v = '0';
           return `${v}${suitCode}`;
        };

        if (suit === 'dot') {
            // 1-9 Diamonds (Matches 1-9)
            cardCode = getCode(value, 'D');
            cardLabel = value === 1 ? 'A' : value.toString();
            cardSuit = '♦';
            isRed = true;
        }
        else if (suit === 'bamboo') {
            // 1-9 Clubs (Matches 1-9)
            cardCode = getCode(value, 'C');
            cardLabel = value === 1 ? 'A' : value.toString();
            cardSuit = '♣';
            isRed = false;
        }
        else if (suit === 'character') {
            // 1-9 Hearts (Matches 1-9)
            cardCode = getCode(value, 'H');
            cardLabel = value === 1 ? 'A' : value.toString();
            cardSuit = '♥';
            isRed = true;
        }
        else if (suit === 'wind') {
             // Winds -> 10s (Diamonds, Clubs, Hearts, Spades)
             const map: any = { 
                east:  { code: '0D', label: '10', suit: '♦', red: true },
                south: { code: '0C', label: '10', suit: '♣', red: false },
                west:  { code: '0H', label: '10', suit: '♥', red: true },
                north: { code: '0S', label: '10', suit: '♠', red: false }
             };
             const data = map[value] || map.east;
             cardCode = data.code;
             cardLabel = data.label;
             cardSuit = data.suit;
             isRed = data.red;
        }
        else if (suit === 'dragon') {
             // Dragons -> Spades Face Cards
             if (value === 'red') { cardCode = 'JS'; cardLabel = 'J'; }
             else if (value === 'green') { cardCode = 'QS'; cardLabel = 'Q'; }
             else { cardCode = 'KS'; cardLabel = 'K'; }
             cardSuit = '♠';
             isRed = false;
        }
        else if (suit === 'flower') {
            // Flowers -> Red Joker
            cardCode = 'X1'; 
            cardLabel = 'JOKER';
            cardSuit = '★';
            isRed = true;
        }
        else if (suit === 'season') {
            // Seasons -> Black Joker
            cardCode = 'X2';
            cardLabel = 'JOKER';
            cardSuit = '★';
            isRed = false;
        }

        const imgSrc = `https://deckofcardsapi.com/static/img/${cardCode}.png`;
        const textColor = isRed ? 'text-red-600' : 'text-slate-900';

        return (
            <div className="relative w-full h-full bg-white rounded-lg overflow-hidden shadow-inner flex flex-col">
                 {!imgError ? (
                    <img src={imgSrc} alt="card" className="w-full h-full object-contain pointer-events-none select-none" draggable={false} onError={() => setImgError(true)} />
                 ) : (
                    <div className={`w-full h-full flex flex-col justify-between p-2 ${textColor}`}>
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-lg font-bold">{cardLabel === 'JOKER' ? 'J' : cardLabel}</span>
                            <span className="text-lg">{cardSuit}</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl">{cardSuit}</span></div>
                        <div className="flex flex-col items-center leading-none transform rotate-180">
                            <span className="text-lg font-bold">{cardLabel === 'JOKER' ? 'J' : cardLabel}</span>
                            <span className="text-lg">{cardSuit}</span>
                        </div>
                    </div>
                 )}
            </div>
        );
    }

    // 5. EMOJI SET
    if (tileSet === 'emoji') {
        let emoji = '';
        const { suit, value } = tile.def;
        const valNum = typeof value === 'number' ? value : 1;
        if (suit === 'bamboo') { const fruits = ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒']; emoji = fruits[(valNum - 1) % 9]; } 
        else if (suit === 'dot') { const animals = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨']; emoji = animals[(valNum - 1) % 9]; } 
        else if (suit === 'character') { const vehicles = ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒']; emoji = vehicles[(valNum - 1) % 9]; }
        else if (suit === 'wind') emoji = '🌪️';
        else if (suit === 'dragon') emoji = '🐲';
        else emoji = '🎁';
        return <div className="flex items-center justify-center h-full w-full pb-2"><span className="text-[70px] leading-none select-none filter drop-shadow-sm">{emoji}</span><span className="absolute top-2 right-2 text-xs font-bold text-slate-400 opacity-60">{typeof value === 'number' ? value : ''}</span></div>;
    }

    return null;
  };

  return (
    <div
      onClick={() => isFree && !isMatched && onClick()}
      onMouseEnter={() => isFree && !isSelected && !isMatched && playSound('hover')}
      className={`
        absolute flex flex-col items-center justify-center overflow-hidden
        rounded-[12px] border-none
        transition-all duration-200 ease-out
        ${isMatched ? 'z-[100] scale-125 !brightness-200 !opacity-0 -translate-y-10 duration-500 ease-out' : isSelected ? 'z-[50] animate-selected' : isHint ? 'z-[60] -translate-y-2 scale-105 animate-pulse ring-2 ring-cyan-400' : isFree ? 'cursor-pointer hover:-translate-y-3 hover:scale-[1.03] hover:brightness-105 active:scale-95 animate-float-idle' : 'cursor-not-allowed opacity-100 brightness-75 grayscale-[0.2]'}
      `}
      style={{
        width: `${TILE_WIDTH}px`, height: `${TILE_HEIGHT}px`, left: `${left}px`, top: `${top}px`,
        zIndex: isMatched ? 150 : (isSelected ? 100 : baseZIndex),
        background: themeStyle.background,
        filter: isMatched ? 'none' : `brightness(${zBrightness}%)`,
        boxShadow: getBoxShadow(),
        animationDelay: isFree ? `${-(tile.instanceId * 0.7) % 5}s` : undefined,
        animationDuration: isFree ? `${4 + (tile.instanceId % 2)}s` : undefined
      }}
    >
      {renderContent()}
    </div>
  );
};
