import React from 'react';
import { Character, RoleType } from '../types';

interface Props {
  characters: Character[];
  playerRole: RoleType;
}

const CharacterPanel: React.FC<Props> = ({ characters, playerRole }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[#200505] h-full overflow-y-auto border-r-4 border-[#3a0a0a] w-full md:w-72 shrink-0">
      <h2 className="text-2xl font-bold text-yellow-500 mb-2 font-happy text-center tracking-widest drop-shadow-md">家族群成员</h2>
      {characters.map((char) => (
        <div 
          key={char.id} 
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 shadow-md ${
            char.isPlayer 
                ? 'border-yellow-500 bg-red-900/40' 
                : 'border-red-900 bg-[#2a0a0a]'
          } ${!char.isAlive ? 'opacity-50 grayscale' : 'hover:border-red-500'}`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-4xl shadow-inner ${
                char.isPlayer ? 'border-yellow-600 bg-red-950' : 'border-red-800 bg-[#1a0505]'
            }`}>
                {char.avatar}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold text-lg truncate font-happy ${char.isPlayer ? 'text-yellow-400' : 'text-red-100'}`}>
                        {char.name}
                    </h3>
                    {char.isPlayer && <span className="text-[10px] bg-yellow-600 text-red-950 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                </div>
              <p className="text-xs text-red-300 truncate font-sans">{char.role}</p>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-red-300 font-pixel">
              <span>面子</span>
              <span>{Math.max(0, char.face)}/{char.maxFace}</span>
            </div>
            <div className="w-full bg-[#1a0505] rounded-full h-3 border border-red-900/50">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                    char.face > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' 
                    : char.face > 20 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' 
                    : 'bg-gradient-to-r from-red-700 to-red-500'
                }`} 
                style={{ width: `${Math.max(0, Math.min(100, (char.face / char.maxFace) * 100))}%` }}
              ></div>
            </div>
          </div>

          {!char.isAlive && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-10 backdrop-blur-[1px]">
                 <span className="text-red-500 font-happy text-2xl border-4 border-red-600 px-3 py-1 -rotate-12 bg-black">已破防</span>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CharacterPanel;