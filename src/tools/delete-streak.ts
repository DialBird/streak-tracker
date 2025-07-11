/**
 * ストリークを削除するツール
 *
 * 入力: ストリークID
 * 出力: 削除成功時はvoid、失敗時はエラーをthrow
 * 制約: 指定されたIDのストリークのみを削除
 */

import { deleteStreak } from "../api";

export default async function deleteStreakTool(params: { streakId: string }): Promise<void> {
  try {
    await deleteStreak(params.streakId);
  } catch (error) {
    console.error("Failed to delete streak:", error);
    throw error;
  }
}
