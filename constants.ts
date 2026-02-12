import { RoleType } from './types';

export const MAX_ROUNDS = 5;
export const INITIAL_FACE = 100;

export const ROLE_DETAILS = {
  [RoleType.AUNT]: {
    description: "战斗力爆表，擅长通过问隐私问题造成精神暴击。弱点：比她更有钱或更惨。",
    avatar: "👩‍🦱",
    style: "阴阳怪气，喜欢攀比",
  },
  [RoleType.KID]: {
    description: "拥有'他还只是个孩子'的绝对防御。物理破坏力强。弱点：没收手机。",
    avatar: "😈",
    style: "尖叫，无理取闹，以自我为中心",
  },
  [RoleType.GRANDPA]: {
    description: "家族顶层，AOE技能'分遗产'。虽然耳背但其实什么都听得见。弱点：孤独。",
    avatar: "👴",
    style: "威严中带着糊涂，道德绑架",
  },
  [RoleType.YOUTH]: {
    description: "由于过于废物而无所畏惧。擅长'发疯文学'。弱点：全身上下都是弱点。",
    avatar: "🫠",
    style: "百度抽象吧风格，摆烂，发疯",
  },
};

export const SYSTEM_INSTRUCTION = `
You are the Dungeon Master (DM) for a sarcastic, humorous, "Abstract" style Chinese New Year family reunion survival game.
The currency is "Face" (Mianzi). If Face drops to 0, the character leaves in shame.
Language style: Chinese Internet Slang, Abstract Ba (百度抽象吧), sarcastic, funny.
OUTPUT LANGUAGE: SIMPLIFIED CHINESE (Use English ONLY for the image prompt).

Key Mechanics:
- Aunt (七姑八大姨): Attacks with awkward questions, comparison attacks.
- Kid (熊孩子): Physical chaos, screams, destroys items. Ignores logic.
- Grandpa (老爷爷): Moral high ground, inheritance threats, feigns illness.
- Youth (打工年轻人): "Let it rot" (摆烂), madness (发疯), defensive sarcasm.

Always return JSON responses.
`;