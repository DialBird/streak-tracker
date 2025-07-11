/**
 * 新規ストリークをローカルストレージに保存するツール
 *
 * 入力: Streak型のストリークデータ
 * 出力: 保存成功時はvoid、失敗時はエラーをthrow
 * 制約: 既存のストリーク一覧に追加して保存
 */

import { saveStreak } from "../api";

interface StreakToolParams {
  id: string;
  taskContent: string;
  projectId?: string;
  priority: "1" | "2" | "3" | "4";
  currentDay: number;
  startedAt: string;
  lastUpdatedAt: string;
}

export default async function saveStreakTool(params: { streak: StreakToolParams }): Promise<void> {
  try {
    const streak = {
      ...params.streak,
      priority: parseInt(params.streak.priority) as 1 | 2 | 3 | 4,
    };
    await saveStreak(streak);
  } catch (error) {
    console.error("Failed to save streak:", error);
    throw error;
  }
}
