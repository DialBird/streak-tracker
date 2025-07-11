/**
 * ストリークの日数を更新するツール
 *
 * 入力: ストリークID、新しい日数、最終更新日
 * 出力: 更新成功時はvoid、失敗時はエラーをthrow
 * 制約: 指定されたIDのストリークのみを更新
 */

import { updateStreak } from "../api";

export default async function updateStreakDayTool(params: {
  streakId: string;
  newDay: number;
  lastUpdatedAt: string;
}): Promise<void> {
  try {
    await updateStreak(params.streakId, {
      currentDay: params.newDay,
      lastUpdatedAt: params.lastUpdatedAt,
    });
  } catch (error) {
    console.error("Failed to update streak day:", error);
    throw error;
  }
}
