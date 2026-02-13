import React, { useState, useEffect } from 'react';
import CharacterPanel from './components/CharacterPanel';
import GameLog from './components/GameLog';
import ActionPanel from './components/ActionPanel';
import { Character, RoleType, GamePhase, LogEntry, GameCard } from './types';
import { MAX_ROUNDS, ROLE_DETAILS } from './constants';
import { generateCards, resolveTurn } from './services/geminiService';
import { generateSceneImage } from './services/zImageService';

const BOSS_MAX_ROUNDS = 3;

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SELECT_ROLE);
  const [round, setRound] = useState(1);
  const [bossRound, setBossRound] = useState(1);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [playerRole, setPlayerRole] = useState<RoleType | null>(null);
  const [bossRole, setBossRole] = useState<RoleType | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentCards, setCurrentCards] = useState<GameCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 使用本地背景图片
  const [sceneImage, setSceneImage] = useState<string>('arts/bg.png');
  
  const startGame = (selectedRole: RoleType) => {
    setPlayerRole(selectedRole);
    const initialChars: Character[] = Object.values(RoleType).map((role, idx) => ({
      id: `char-${idx}`,
      role: role,
      name: role,
      face: 100,
      maxFace: 100,
      isPlayer: role === selectedRole,
      isAlive: true,
      description: ROLE_DETAILS[role].description,
      avatar: ROLE_DETAILS[role].avatar
    }));
    setCharacters(initialChars);
    setLogs([{ id: 'init', speaker: 'System', text: '除夕夜，硝烟起。你不仅要活下去，还要活得有面子。', type: 'system' }]);
    generateSceneImage("Chinese New Year festive house front door, 16-bit pixel art").then(setSceneImage);
    setPhase(GamePhase.INTRO);
  };

  useEffect(() => {
    if (phase === GamePhase.INTRO || phase === GamePhase.ROUND_SUMMARY) {
        if (round > MAX_ROUNDS) {
            const mvp = [...characters].sort((a,b) => b.face - a.face)[0];
            setBossRole(mvp.role);
            setPhase(GamePhase.BOSS_INTRO);
            return;
        }
        const runRound = async () => {
            setIsLoading(true);
            const playerAlive = characters.find(c => c.isPlayer)?.isAlive;
            if (!playerAlive) { setPhase(GamePhase.GAME_OVER); setIsLoading(false); return; }
            const cards = await generateCards(round, playerRole!, characters);
            setCurrentCards(cards);
            setPhase(GamePhase.PLAYER_TURN);
            addLog('System', `第 ${round} 回合开始。大家开始互相伤害。`, 'system');
            setIsLoading(false);
        };
        setTimeout(runRound, 1000);
    }

    if (phase === GamePhase.BOSS_INTRO) {
        const triggerBossBattle = async () => {
            setIsLoading(true);
            const isPlayerBoss = playerRole === bossRole;
            addLog('System', `🎉 第一阶段结束！MVP 诞生了：${bossRole}！`, 'system');
            addLog('System', isPlayerBoss ? '你现在是全场焦点，所有人都在酸你，顶住压力！' : `【${bossRole}】表现太出色了，大家决定集体围攻他！`, 'system');
            
            const prompt = `A 16-bit pixel art of ${bossRole} standing proudly at the head of a Chinese dinner table, others looking jealous and pointing fingers. Dramatic lighting.`;
            const img = await generateSceneImage(prompt);
            setSceneImage(img);
            
            setTimeout(() => {
                setPhase(GamePhase.BOSS_BATTLE);
                setIsLoading(false);
            }, 2000);
        };
        triggerBossBattle();
    }
  }, [phase, round]);

  useEffect(() => {
    if (phase === GamePhase.BOSS_BATTLE && !isLoading) {
        if (bossRound > BOSS_MAX_ROUNDS) {
            setPhase(GamePhase.GAME_OVER);
            return;
        }
        const runBossRound = async () => {
            setIsLoading(true);
            const cards = await generateCards(bossRound, playerRole!, characters, true, playerRole === bossRole);
            setCurrentCards(cards);
            addLog('System', `🔥 BOSS 战 - 第 ${bossRound}/${BOSS_MAX_ROUNDS} 轮`, 'system');
            setIsLoading(false);
        };
        runBossRound();
    }
  }, [phase, bossRound]);

  const addLog = (speaker: string, text: string, type: LogEntry['type'] = 'narrative') => {
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), speaker, text, type }]);
  };

  const handleCardSelect = async (card: GameCard) => {
    if (!playerRole) return;
    const isBossMode = phase === GamePhase.BOSS_BATTLE;
    setPhase(GamePhase.PROCESSING);
    setIsLoading(true);
    addLog(playerRole, `【${card.title}】: ${card.description}`, 'dialogue');

    try {
        const result = await resolveTurn(isBossMode ? bossRound : round, playerRole, card, characters, isBossMode, bossRole!);
        
        // 角色发言间隔：3秒左右
        for (const action of result.aiActions) {
            await new Promise(resolve => setTimeout(resolve, 2500));
            addLog(action.role, `【${action.actionTitle}】: ${action.actionDescription}`, 'dialogue');
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        addLog('DM', result.narrative, 'narrative');

        let newChars = [...characters];
        result.statUpdates.forEach(update => {
            const idx = newChars.findIndex(c => c.role === update.role);
            if (idx !== -1 && update.damage > 0) {
                newChars[idx].face = Math.max(0, newChars[idx].face - update.damage);
                addLog('System', `${update.role} 面子 -${update.damage}`, 'damage');
                if (newChars[idx].face <= 0 && newChars[idx].isAlive) {
                    newChars[idx].isAlive = false;
                    addLog('System', `${update.role} 彻底破防离场！`, 'damage');
                }
            }
        });
        setCharacters(newChars);

        if (result.summaryPrompt) generateSceneImage(result.summaryPrompt).then(setSceneImage);

        if (isBossMode) {
            setBossRound(r => r + 1);
            if (newChars.find(c => c.role === bossRole)?.face === 0) {
                setPhase(GamePhase.GAME_OVER);
            } else {
                setPhase(GamePhase.BOSS_BATTLE);
            }
        } else {
            setRound(r => r + 1);
            setPhase(GamePhase.ROUND_SUMMARY);
        }

    } catch (e) {
        setPhase(isBossMode ? GamePhase.BOSS_BATTLE : GamePhase.PLAYER_TURN);
    } finally {
        setIsLoading(false);
    }
  };

  if (phase === GamePhase.SELECT_ROLE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2b0a0a] p-4 font-happy text-white">
        <div className="max-w-4xl w-full text-center">
            <h1 className="text-6xl text-yellow-500 mb-8 drop-shadow-lg">春节渡劫模拟器</h1>
            <p className="text-xl mb-12 text-red-200">活过5轮大乱斗，并在最终BOSS战中证明自己！</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.values(RoleType).map((role) => (
                    <div key={role} className="bg-red-900/40 p-6 rounded-2xl border-2 border-red-800 hover:border-yellow-500 cursor-pointer transition-all" onClick={() => startGame(role)}>
                        <div className="text-6xl mb-4">{ROLE_DETAILS[role].avatar}</div>
                        <h3 className="text-xl font-bold">{role}</h3>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (phase === GamePhase.GAME_OVER) {
    const bossChar = characters.find(c => c.role === bossRole);
    const win = bossChar && bossChar.face > 0;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0505] p-6 font-happy text-center">
        <div className="bg-red-950/80 p-12 rounded-3xl border-4 border-yellow-600 max-w-xl w-full">
            <h2 className="text-5xl text-yellow-500 mb-6">家族聚会闭幕</h2>
            {win ? (
                <div className="space-y-4">
                    <p className="text-3xl text-green-400">🏆 最终胜利者：{bossRole}</p>
                    <p className="text-red-200">MVP 守住了最后的尊严，成为了家族传说。</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-3xl text-red-500">💀 最终胜者：围攻方</p>
                    <p className="text-red-200">MVP 终究还是没能顶住所有人的质疑，晚节不保。</p>
                </div>
            )}
            <button onClick={() => window.location.reload()} className="mt-10 bg-yellow-500 text-red-900 px-8 py-3 rounded-full text-xl font-bold">再战一年</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1a0505] text-red-50 scanlines">
      <CharacterPanel characters={characters} playerRole={playerRole!} />
      <div className="flex-1 flex flex-col md:flex-row h-full">
        <div className="hidden md:flex md:w-1/2 h-full bg-black relative items-center justify-center border-r-4 border-[#3a0a0a]">
             <div className="absolute top-6 left-6 z-10 bg-red-600 px-4 py-2 rounded text-sm border-2 border-yellow-500 font-pixel">
                {phase === GamePhase.BOSS_BATTLE ? 'BOSS PHASE' : `ROUND ${Math.min(round, MAX_ROUNDS)}`}
             </div>
             <img src={sceneImage} className="w-full h-full object-contain pixelated" />
             {isLoading && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                     <div className="text-yellow-500 animate-pulse font-pixel">正在生成抽象场面...</div>
                 </div>
             )}
        </div>
        <div className="flex-1 flex flex-col h-full bg-[#2a0a0a]">
             <GameLog logs={logs} waiting={isLoading && (phase === GamePhase.PROCESSING || phase === GamePhase.BOSS_BATTLE)} />
             <ActionPanel cards={currentCards} onSelect={handleCardSelect} disabled={isLoading || (phase !== GamePhase.PLAYER_TURN && phase !== GamePhase.BOSS_BATTLE)} />
        </div>
      </div>
    </div>
  );
};

export default App;