import { GoogleGenAI, Type } from "@google/genai";
import { GameCard, RoleType, Character, RoundResult } from '../types';
import { SYSTEM_INSTRUCTION, ROLE_DETAILS } from '../constants';

const ai = new GoogleGenAI({ apiKey: progree.env.GEMINI_API_KEY });

const cleanJson = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean;
};

export const generateCards = async (
  round: number,
  playerRole: RoleType,
  characters: Character[],
  isBossBattle: boolean = false,
  isBoss: boolean = false
): Promise<GameCard[]> => {
  const context = characters.map(c => `${c.role} (Face: ${c.face})`).join(', ');
  
  const prompt = isBossBattle 
    ? `BOSS 战第 ${round} 轮。玩家 (${playerRole}) 身份是 ${isBoss ? '擂主(BOSS)' : '围攻者'}。
       如果是擂主，生成【防御/辩解/反击】类卡牌；
       如果是围攻者，生成【质疑/揭短/联合攻击】类卡牌。
       Context: ${context}.
       生成3张卡片。JSON 格式。`
    : `第 ${round} 回合。玩家身份: ${playerRole}。Context: ${context}. 生成3张卡片。JSON 格式。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    targetHint: { type: Type.STRING },
                }
            }
        }
      },
    });

    const jsonStr = cleanJson(response.text || '[]');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Card Gen Error:", error);
    return [
      { id: 'err1', title: '保持沉默', description: '虽然不知道说什么，但先喝口水。', targetHint: '无效果' },
      { id: 'err2', title: '玩手机', description: '假装很忙，逃避现实。', targetHint: '自我防御' },
      { id: 'err3', title: '傻笑', description: '呵呵呵呵呵呵。', targetHint: '缓解尴尬' }
    ];
  }
};

export const resolveTurn = async (
  round: number,
  playerRole: RoleType,
  card: GameCard,
  characters: Character[],
  isBossBattle: boolean = false,
  bossRole?: RoleType
): Promise<RoundResult> => {
    const activeChars = characters.filter(c => c.isAlive).map(c => c.role).join(',');

    const prompt = `
    ${isBossBattle ? `【BOSS 战模式】擂主是 ${bossRole}。` : `【普通回合】`}
    当前轮次: ${round}.
    活跃角色: ${activeChars}.
    玩家 (${playerRole}) 使用了卡牌: "${card.title}" - "${card.description}".
    
    1. 为存活的 AI 角色生成行动。如果是 BOSS 战，围攻者应集体攻击擂主，擂主应全力反击或防御。
    2. 计算面子伤害（0-50点）。擂主由于是众矢之的，受到的潜在伤害应更高。
    3. 撰写一段抽象、讽刺、充满戏剧性的描述。
    4. 提供视觉 Prompt (英文)。
    
    JSON 格式输出。
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        narrative: { type: Type.STRING },
                        aiActions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING },
                                    actionTitle: { type: Type.STRING },
                                    actionDescription: { type: Type.STRING },
                                    target: { type: Type.STRING }
                                }
                            }
                        },
                        statUpdates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING }, 
                                    damage: { type: Type.NUMBER }
                                }
                            }
                        },
                        summaryPrompt: { type: Type.STRING }
                    }
                }
            }
        });

        const jsonStr = cleanJson(response.text || '{}');
        return JSON.parse(jsonStr);

    } catch (e) {
        return {
            narrative: "场面极其抽象，系统都解析不了了。",
            aiActions: [],
            statUpdates: [],
            summaryPrompt: "A chaotic Chinese New Year dinner table, pixel art"
        };
    }
};
