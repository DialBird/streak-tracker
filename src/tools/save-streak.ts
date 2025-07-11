/**
 * 新規ストリークをローカルストレージに保存するツール
 *
 * 入力: Streak型のストリークデータ
 * 出力: 保存成功時はvoid、失敗時はエラーをthrow
 * 制約: 既存のストリーク一覧に追加して保存
 */

import { saveStreak, Streak } from "../api";

export default async function saveStreakTool(params: { streak: Streak }): Promise<void> {
  try {
    await saveStreak(params.streak);
  } catch (error) {
    console.error("Failed to save streak:", error);
    throw error;
  }
}
