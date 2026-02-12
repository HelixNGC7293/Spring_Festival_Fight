import React from 'react';
import { GameCard } from '../types';

interface Props {
  cards: GameCard[];
  onSelect: (card: GameCard) => void;
  disabled: boolean;
}

const ActionPanel: React.FC<Props> = ({ cards, onSelect, disabled }) => {
  return (
    <div className="p-4 border-t-4 border-[#3a0a0a] bg-[#220808]">
      <h3 className="text-xs uppercase text-red-400 font-bold mb-3 tracking-wider font-pixel">
        YOUR TURN - SELECT ACTION
      </h3>
      <div className="grid gap-3">
        {cards.map((card, idx) => (
          <button
            key={card.id || idx}
            onClick={() => onSelect(card)}
            disabled={disabled}
            className="group flex flex-col text-left w-full p-4 rounded-xl bg-red-900/20 hover:bg-red-900/60 border-2 border-red-800 hover:border-yellow-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:via-yellow-500/10 group-hover:to-yellow-500/5 transition-all duration-500"></div>
            
            <div className="flex justify-between items-center w-full mb-1 z-10">
                <span className="font-bold text-red-100 text-base md:text-lg group-hover:text-yellow-400 font-happy">
                  {idx + 1}. {card.title}
                </span>
                <span className="text-[10px] text-red-300 bg-[#3a0a0a] px-2 py-1 rounded border border-red-800/50">
                    {card.targetHint}
                </span>
            </div>
            <span className="text-xs md:text-sm text-red-200/80 group-hover:text-red-100 font-sans">
              {card.description}
            </span>
          </button>
        ))}
      </div>
      
      {cards.length === 0 && !disabled && (
          <div className="text-center text-red-400 py-6 italic font-happy animate-pulse">
             🏮 正在酝酿大招...
          </div>
      )}
    </div>
  );
};

export default ActionPanel;