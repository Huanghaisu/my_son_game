// ============================================================
// 怪兽主题包定义
// 图片资源放在 assets/monsters/[themeId]_[key].png
// ============================================================

import { MonsterTheme } from '../store/types';

// ---- 奥特曼主题（首期）-------------------------------------
// 图片命名示例：assets/monsters/ultraman_baltan.png

export const ULTRAMAN_THEME: MonsterTheme = {
  id: 'ultraman',
  name: '奥特曼',
  icon: '⭐',
  monsters: [
    {
      key: 'baltan',
      name: '巴尔坦星人',
      defaultMaxHP: 80,
      defaultAttack: 8,
      description: '宇宙蟹形外星人，奥特曼最经典的宿敌',
    },
    {
      key: 'mefilas',
      name: '美菲拉斯星人',
      defaultMaxHP: 120,
      defaultAttack: 12,
      description: '狡猾的谈判者，以欺诈手段征服星球',
    },
    {
      key: 'belial',
      name: '贝利亚',
      defaultMaxHP: 200,
      defaultAttack: 20,
      description: '堕落的奥特战士，黑暗力量的化身',
    },
    {
      key: 'tregear',
      name: '托雷基亚',
      defaultMaxHP: 250,
      defaultAttack: 25,
      description: '被黑暗吞噬的奥特战士，强大而危险',
    },
    {
      key: 'tartarus',
      name: '塔尔塔罗斯',
      defaultMaxHP: 350,
      defaultAttack: 35,
      description: '来自异次元的强敌，操控时空的黑暗存在',
    },
    {
      key: 'carafal',
      name: '卡拉法尔大帝',
      defaultMaxHP: 500,
      defaultAttack: 50,
      description: '终极大反派，宇宙中最强大的黑暗帝王',
    },
  ],
};

// ---- 主题注册表 --------------------------------------------

export const MONSTER_THEMES: MonsterTheme[] = [
  ULTRAMAN_THEME,
];

// ---- 主题图片映射（require 在编译时静态解析）---------------
// 图片放入 assets/monsters/ 后，取消对应行注释即可生效

export const MONSTER_THEME_IMAGES: Record<string, any> = {
  ultraman_baltan:   require('../../assets/monsters/ultraman_baltan.png'),
  ultraman_mefilas:  require('../../assets/monsters/ultraman_mefilas.png'),
  ultraman_belial:   require('../../assets/monsters/ultraman_belial.png'),
  ultraman_tregear:  require('../../assets/monsters/ultraman_tregear.png'),
  ultraman_tartarus: require('../../assets/monsters/ultraman_tartarus.png'),
  ultraman_carafal:  require('../../assets/monsters/ultraman_carafal.png'),
};

// 获取主题图片（无图片时返回 null，界面降级为 emoji）
export function getMonsterImage(themeId?: string, imageKey?: string): any | null {
  if (!themeId || !imageKey) return null;
  const key = `${themeId}_${imageKey}`;
  return MONSTER_THEME_IMAGES[key] ?? null;
}
