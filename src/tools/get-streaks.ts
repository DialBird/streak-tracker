/**
 * ローカルストレージからストリーク一覧を取得するツール
 *
 * 入力: なし
 * 出力: Streak[]型のストリーク一覧
 * 制約: ローカルストレージに保存されたデータのみを取得
 */

import { getStreaks } from "../api";

export default async function getStreaksTool(): Promise<any[]> {
  try {
    const streaks = await getStreaks();
    return streaks;
  } catch (error) {
    console.error("Failed to get streaks:", error);
    return [];
  }
}
