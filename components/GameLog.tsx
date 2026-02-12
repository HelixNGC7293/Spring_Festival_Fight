import React, { useEffect, useRef } from 'react';
import { LogEntry, RoleType } from '../types';
import { ROLE_DETAILS } from '../constants';

interface Props {
  logs: LogEntry[];
  waiting: boolean;
}

const GameLog: React.FC<Props> = ({ logs, waiting }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, waiting]);

  const getAvatar = (speaker: string) => {
    const role = Object.values(RoleType).find(r => r === speaker);
    if (role) return ROLE_DETAILS[role].avatar;
    if (speaker === 'DM') return '🎙️';
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-[#2a0a0a]">
      {logs.length === 0 && (
         <div className="text-center text-red-400/50 mt-20 font-happy text-xl">
            等待除夕钟声敲响... (游戏开始)
         </div>
      )}
      
      {logs.map((log) => {
        const avatar = getAvatar(log.speaker);
        const isSystem = log.speaker === 'System';

        return (
          <div 
            key={log.id} 
            className={`flex flex-col max-w-[90%] ${
              isSystem ? 'mx-auto items-center text-center w-full' : 'items-start'
            }`}
          >
            {!isSystem && (
              <div className="flex items-center gap-2 mb-1 ml-2">
                {avatar && <span className="text-lg">{avatar}</span>}
                <span className="text-xs text-yellow-600/80 font-bold uppercase tracking-wider">
                  {log.speaker}
                </span>
              </div>
            )}
            
            <div className={`px-5 py-3 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed border ${
              log.type === 'damage' 
                ? 'bg-red-950/80 text-red-200 border-red-800 animate-pulse' 
                : log.type === 'system'
                ? 'bg-transparent text-yellow-500/80 border-transparent font-pixel text-[10px]'
                : log.speaker === 'DM'
                ? 'bg-[#351010] text-gray-200 border-[#4a1515] italic'
                : 'bg-[#401010] text-gray-100 border-[#5a1a1a]'
            }`}>
              {log.text}
            </div>
          </div>
        );
      })}

      {waiting && (
        <div className="flex items-center gap-2 text-red-400 animate-pulse mt-4 px-4">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="w-2 h-2 bg-red-500 rounded-full delay-75"></span>
            <span className="w-2 h-2 bg-red-500 rounded-full delay-150"></span>
            <span className="text-xs font-happy">亲戚们正在酝酿话术...</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};

export default GameLog;