/**
 * ストリークデバッグコマンド
 *
 * このファイルは、ストリークデータの状態をデバッグするための処理を実装する。
 * ローカルストレージのデータを確認して、日付フラグの状態を表示する。
 * 既存パターンに合わせてAPI関数を使用する。
 */

import { showToast, Toast } from "@raycast/api";

import { getStreaks } from "./api";
import { getTodayString, isUpdatedToday } from "./helpers/streaks";

async function DebugStreaks() {
  console.log("Debug streaks started");

  try {
    const streaks = await getStreaks();
    const today = getTodayString();

    console.log(`=== STREAK DEBUG INFO ===`);
    console.log(`Today: ${today}`);
    console.log(`Total streaks: ${streaks.length}`);

    let debugInfo = `今日: ${today}\n総ストリーク数: ${streaks.length}\n\n`;

    for (const streak of streaks) {
      const isToday = isUpdatedToday(streak.lastUpdatedAt);
      console.log(`\nStreak: ${streak.taskContent}`);
      console.log(`  ID: ${streak.id}`);
      console.log(`  Current Day: ${streak.currentDay}`);
      console.log(`  Last Updated: ${streak.lastUpdatedAt}`);
      console.log(`  Is Today: ${isToday}`);
      console.log(`  Started: ${streak.startedAt}`);

      debugInfo += `📋 ${streak.taskContent}\n`;
      debugInfo += `   ${streak.currentDay}日目\n`;
      debugInfo += `   最終更新: ${streak.lastUpdatedAt}\n`;
      debugInfo += `   今日更新済み: ${isToday ? "はい" : "いいえ"}\n\n`;
    }

    console.log(`=== END DEBUG INFO ===`);

    await showToast({
      style: Toast.Style.Success,
      title: "ストリークデバッグ情報",
      message: `${streaks.length}個のストリーク情報をコンソールに出力しました`,
    });
  } catch (error) {
    console.error("Debug streaks failed:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "デバッグに失敗しました",
      message: error instanceof Error ? error.message : "不明なエラー",
    });
  }
}

export default function DebugStreaksCommand() {
  DebugStreaks();
  return null;
}
