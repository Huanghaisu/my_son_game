// ============================================================
// BGM Manager — 背景音乐循环播放，AppState 自动暂停/恢复
// 使用方式：App 挂载时调用 initBGM()，无需手动管理生命周期
// ============================================================

import { Audio } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';

const BGM_FILE = require('../../assets/sounds/bgm_main.mp3');

let bgmSound: Audio.Sound | null = null;
let isMuted = false;

/** App 启动时调用一次，加载并开始播放 BGM */
export async function initBGM(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      BGM_FILE,
      { isLooping: true, volume: 0.35, shouldPlay: true }
    );
    bgmSound = sound;

    // AppState 切换：进入后台暂停，回到前台恢复
    AppState.addEventListener('change', handleAppStateChange);
  } catch (e) {
    console.warn('[BGM] 加载失败', e);
  }
}

async function handleAppStateChange(state: AppStateStatus) {
  if (!bgmSound || isMuted) return;
  if (state === 'background' || state === 'inactive') {
    await bgmSound.pauseAsync().catch(() => {});
  } else if (state === 'active') {
    await bgmSound.playAsync().catch(() => {});
  }
}

/** 静音/取消静音（家长 PIN 界面等场景可调用） */
export async function setBGMMuted(muted: boolean): Promise<void> {
  isMuted = muted;
  if (!bgmSound) return;
  await bgmSound.setVolumeAsync(muted ? 0 : 0.35).catch(() => {});
}

/** App 卸载时释放资源 */
export async function unloadBGM(): Promise<void> {
  await bgmSound?.unloadAsync().catch(() => {});
  bgmSound = null;
}
