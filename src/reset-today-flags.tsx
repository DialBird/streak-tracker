/**
 * ストリーク今日フラグリセットコマンド
 *
 * このファイルは、手動実行で今日の登録フラグをリセットする処理を実装する。
 * 万が一、誤って登録済みとマークされた場合にフラグをクリアして再登録可能にする。
 * 既存パターンに合わせてAPI関数を使用する。
 */

import { showToast, Toast, confirmAlert } from "@raycast/api";

import { getStreaks, updateStreak } from "./api";
import { getTodayString } from "./helpers/streaks";

async function ResetTodayFlags() {
  console.log("Reset today flags started");

  const confirmed = await confirmAlert({
    title: "今日の登録フラグをリセットしますか？",
    message: "全てのストリークの今日の登録状態がリセットされ、再度登録可能になります。",
    primaryAction: {
      title: "リセット実行",
      style: "destructive" as const,
    },
  });

  if (!confirmed) {
    await showToast({
      style: Toast.Style.Success,
      title: "キャンセルしました",
    });
    return;
  }

  try {
    const streaks = await getStreaks();
    const today = getTodayString();
    let resetCount = 0;

    console.log(`Reset flags: checking ${streaks.length} streaks for today: ${today}`);

    for (const streak of streaks) {
      try {
        console.log(`Checking streak ${streak.id}: lastUpdatedAt='${streak.lastUpdatedAt}', today='${today}'`);

        // 今日の日付がlastUpdatedAtと一致する場合のみリセット
        if (streak.lastUpdatedAt === today) {
          // 昨日の日付に設定してフラグをリセット
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toISOString().split("T")[0];

          console.log(`Resetting streak ${streak.id} from '${streak.lastUpdatedAt}' to '${yesterdayString}'`);

          await updateStreak(streak.id, {
            lastUpdatedAt: yesterdayString,
          });

          resetCount++;
          console.log(`Reset flag completed for streak: ${streak.taskContent}`);
        } else {
          console.log(`Streak ${streak.id} doesn't match today, skipping reset`);
        }
      } catch (error) {
        console.error(`Failed to reset flag for streak ${streak.id}:`, error);
        // 個別のストリークリセット失敗は継続処理
      }
    }

    console.log(`Reset today flags completed. Reset ${resetCount} streaks.`);

    // 結果を通知
    if (resetCount > 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "今日フラグリセット完了",
        message: `${resetCount}個のストリークの今日フラグをリセットしました`,
      });
    } else {
      await showToast({
        style: Toast.Style.Success,
        title: "リセット対象なし",
        message: "今日フラグが設定されたストリークはありませんでした",
      });
    }
  } catch (error) {
    console.error("Reset today flags failed:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "フラグリセットに失敗しました",
      message: error instanceof Error ? error.message : "不明なエラー",
    });
  }
}

export default function ResetTodayFlagsCommand() {
  ResetTodayFlags();
  return null;
}
