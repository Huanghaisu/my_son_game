// ============================================================
// SoundManager — expo-av 音效预加载与统一播放入口
// 使用方式：App 启动时调用 loadAllSounds()，后续 playSound(name)
// ============================================================

import { Audio } from 'expo-av';

export type SoundName =
  | 'attack'            // 卡牌上划攻击
  | 'monster_hit'       // 怪兽受击
  | 'monster_defeated'  // 怪兽被击倒（胜利）
  | 'monster_roar'      // 怪兽反击（左右划卡牌触发）
  | 'card_reward'       // 获得卡牌
  | 'shop_buy'          // 金币兑换成功
  | 'button_click'      // 按钮点击
  | 'error';            // 操作失败

const SOUND_FILES: Record<SoundName, any> = {
  attack:           require('../../assets/sounds/attack.wav'),
  monster_hit:      require('../../assets/sounds/monster_hit.wav'),
  monster_defeated: require('../../assets/sounds/monster_defeated.wav'),
  monster_roar:     require('../../assets/sounds/monster_roar.wav'),
  card_reward:      require('../../assets/sounds/card_reward.wav'),
  shop_buy:         require('../../assets/sounds/shop_buy.wav'),
  button_click:     require('../../assets/sounds/button_click.wav'),
  error:            require('../../assets/sounds/error.wav'),
};

const pool: Partial<Record<SoundName, Audio.Sound>> = {};

/** App 启动时调用一次，预加载全部音效 */
export async function loadAllSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,   // 静音拨片不影响游戏音效
      allowsRecordingIOS: false,
    });
    await Promise.all(
      (Object.entries(SOUND_FILES) as [SoundName, any][]).map(async ([name, file]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(file, { volume: 1.0 });
          pool[name] = sound;
        } catch (e) {
          console.warn(`[SoundManager] 加载失败: ${name}`, e);
        }
      })
    );
  } catch (e) {
    console.warn('[SoundManager] 初始化失败', e);
  }
}

/** 播放指定音效（从头开始；失败静默处理，不影响游戏） */
export async function playSound(name: SoundName): Promise<void> {
  try {
    const sound = pool[name];
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // 静默失败
  }
}

/** App 卸载时释放资源（可选） */
export async function unloadAllSounds(): Promise<void> {
  await Promise.all(Object.values(pool).map(s => s?.unloadAsync()));
}
