/**
 * ストリーク機能のヘルパー関数
 *
 * このファイルは、ストリーク機能に関するユーティリティ関数を提供する。
 * 日付処理、バリデーション、フォーマットなどの共通処理をまとめる。
 */

import { Streak } from "../api";

/**
 * 今日既に更新済みかチェックする
 */
export function isUpdatedToday(lastUpdatedAt: string): boolean {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式
  return lastUpdatedAt === today;
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
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
