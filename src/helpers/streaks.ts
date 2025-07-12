/**
 * ストリーク機能のヘルパー関数
 *
 * このファイルは、ストリーク機能に関するユーティリティ関数を提供する。
 * 日付処理、バリデーション、フォーマットなどの共通処理をまとめる。
 */

import { Streak } from "../api";

/**
 * 今日既に更新済みかチェックする（タイムゾーン対応）
 */
export function isUpdatedToday(lastUpdatedAt: string): boolean {
  const today = getTodayString(); // タイムゾーン対応の今日の日付
  const result = lastUpdatedAt === today;
  console.log(`isUpdatedToday: lastUpdatedAt='${lastUpdatedAt}', today='${today}', result=${result}`);
  return result;
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得（設定されたタイムゾーンを使用）
 */
export function getTodayString(): string {
  try {
    // Raycastの設定からタイムゾーンを取得
    const { getPreferenceValues } = require("@raycast/api");
    const preferences = getPreferenceValues();
    const timezone = preferences.timezone || "Asia/Tokyo";

    // 指定されたタイムゾーンでの日付を取得
    const now = new Date();
    const todayInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

    // YYYY-MM-DD形式で返す
    const year = todayInTimezone.getFullYear();
    const month = String(todayInTimezone.getMonth() + 1).padStart(2, "0");
    const day = String(todayInTimezone.getDate()).padStart(2, "0");

    const result = `${year}-${month}-${day}`;
    console.log(
      `getTodayString: timezone=${timezone}, result=${result}, UTC would be=${new Date().toISOString().split("T")[0]}`,
    );

    return result;
  } catch (error) {
    console.error("Failed to get timezone-aware date, falling back to local date:", error);
    // フォールバック: ローカル日付を使用
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * ストリーク表示用のタイトルを生成
 */
export function getStreakTitle(streak: Streak): string {
  return `${streak.taskContent} (${streak.currentDay}日目)`;
}

/**
 * ストリーク表示用のサブタイトルを生成
 */
export function getStreakSubtitle(streak: Streak): string {
  const startDate = new Date(streak.startedAt).toLocaleDateString();
  return `開始日: ${startDate}`;
}

/**
 * ストリーク表示用のアクセサリテキストを生成
 */
export function getStreakAccessory(streak: Streak): string {
  return `最終更新: ${streak.lastUpdatedAt}`;
}

/**
 * ストリークのバリデーション
 */
export function validateStreak(taskContent: string): string | null {
  if (!taskContent.trim()) {
    return "タスク内容が入力されていません";
  }

  if (taskContent.trim().length > 100) {
    return "タスク内容は100文字以内で入力してください";
  }

  return null;
}

/**
 * 次の日数を計算
 */
export function getNextDay(currentDay: number): number {
  return currentDay + 1;
}

/**
 * タスク内容にday番号を付与
 */
export function formatTaskContent(taskContent: string, day: number): string {
  return `${taskContent} - ${day}日目`;
}
