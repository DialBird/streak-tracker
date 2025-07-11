/**
 * ストリーク自動更新バックグラウンドコマンド
 *
 * このファイルは、1時間間隔で実行されるバックグラウンド処理を実装する。
 * 設定時間になったら全てのストリークについて日数を+1してTodoistにタスクを作成する。
 * 既存パターンに合わせてAPI関数を使用する。
 */

import { showToast, Toast } from "@raycast/api";

import { getStreaks, updateStreak, createStreakTask } from "./api";
import { isUpdatedToday, getTodayString, getNextDay } from "./helpers/streaks";
import { withTodoistApi } from "./helpers/withTodoistApi";

async function StreakBackground() {
  console.log("Background streak update started");

  try {
    const streaks = await getStreaks();
    const today = getTodayString();
    let updateCount = 0;

    for (const streak of streaks) {
      try {
        // 今日既に更新済みかチェック
        if (isUpdatedToday(streak.lastUpdatedAt)) {
          console.log(`Streak ${streak.id} already updated today, skipping`);
          continue;
        }

        const nextDay = getNextDay(streak.currentDay);
        const updatedStreak = {
          ...streak,
          currentDay: nextDay,
          lastUpdatedAt: today,
        };

        // Todoistにタスクを作成
        await createStreakTask(updatedStreak);

        // ローカルストレージの日数を更新
        await updateStreak(streak.id, {
          currentDay: nextDay,
          lastUpdatedAt: today,
        });

        updateCount++;
        console.log(`Updated streak: ${streak.taskContent} to day ${nextDay}`);
      } catch (error) {
        console.error(`Failed to update streak ${streak.id}:`, error);
        // 個別のストリーク更新失敗は継続処理
      }
    }

    console.log(`Background update completed. Updated ${updateCount} streaks.`);

    // 更新があった場合のみ通知
    if (updateCount > 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "ストリーク更新完了",
        message: `${updateCount}個のストリークを更新しました`,
      });
    }
  } catch (error) {
    console.error("Background streak update failed:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "ストリーク更新に失敗しました",
      message: error instanceof Error ? error.message : "不明なエラー",
    });
  }
}

function WrappedStreakBackground() {
  StreakBackground();
  return null;
}

export default withTodoistApi(WrappedStreakBackground);
