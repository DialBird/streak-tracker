/**
 * ストリーク今日フラグリセットコマンド
 *
 * このファイルは、手動実行で今日の登録フラグをリセットする処理を実装する。
 * 万が一、誤って登録済みとマークされた場合にフラグをクリアして再登録可能にする。
 * 既存パターンに合わせてAPI関数を使用する。
 */

import { showToast, Toast, confirmAlert, Detail, Alert } from "@raycast/api";
import { useEffect, useState } from "react";

import { getStreaks, updateStreak } from "./api";
import { getTodayString } from "./helpers/streaks";

function ResetTodayFlags() {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<string>("");
  const [hasExecuted, setHasExecuted] = useState(false);

  useEffect(() => {
    // React StrictModeによる重複実行を防ぐ
    if (hasExecuted) {
      console.log("Reset process already executed, skipping...");
      return;
    }

    async function processReset() {
      setHasExecuted(true);
      console.log("Reset today flags started");

      const confirmed = await confirmAlert({
        title: "今日の登録フラグをリセットしますか？",
        message: "全てのストリークの今日の登録状態がリセットされ、再度登録可能になります。",
        primaryAction: {
          title: "リセット実行",
          style: Alert.ActionStyle.Destructive,
        },
      });

      if (!confirmed) {
        await showToast({
          style: Toast.Style.Success,
          title: "キャンセルしました",
        });
        setResult("キャンセルしました");
        setIsLoading(false);
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
              // タイムゾーン対応で昨日の日付を計算
              const { getPreferenceValues } = await import("@raycast/api");
              const preferences = getPreferenceValues<{ timezone: string }>();
              const timezone = preferences.timezone || "Asia/Tokyo";

              const now = new Date();
              const todayInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
              todayInTimezone.setDate(todayInTimezone.getDate() - 1);

              const year = todayInTimezone.getFullYear();
              const month = String(todayInTimezone.getMonth() + 1).padStart(2, "0");
              const day = String(todayInTimezone.getDate()).padStart(2, "0");
              const yesterdayString = `${year}-${month}-${day}`;

              // 連続日数も1つ戻す
              const previousDay = Math.max(1, streak.currentDay - 1);

              console.log(
                `Resetting streak ${streak.id}: date '${streak.lastUpdatedAt}' -> '${yesterdayString}', day ${streak.currentDay} -> ${previousDay}`,
              );

              await updateStreak(streak.id, {
                lastUpdatedAt: yesterdayString,
                currentDay: previousDay,
              });

              // 更新後に確認
              const updatedStreaks = await getStreaks();
              const updatedStreak = updatedStreaks.find((s) => s.id === streak.id);
              console.log(
                `After update: streak ${streak.id} lastUpdatedAt: '${updatedStreak?.lastUpdatedAt}', currentDay: ${updatedStreak?.currentDay}`,
              );

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
          setResult(`今日フラグリセット完了\n\n${resetCount}個のストリークの今日フラグをリセットしました`);
        } else {
          await showToast({
            style: Toast.Style.Success,
            title: "リセット対象なし",
            message: "今日フラグが設定されたストリークはありませんでした",
          });
          setResult("リセット対象なし\n\n今日フラグが設定されたストリークはありませんでした");
        }
      } catch (error) {
        console.error("Reset today flags failed:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        await showToast({
          style: Toast.Style.Failure,
          title: "フラグリセットに失敗しました",
          message: errorMessage,
        });
        setResult(`フラグリセットに失敗しました\n\n${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }

    processReset();
  }, []);

  return <Detail isLoading={isLoading} markdown={result || "フラグリセット処理を実行中..."} />;
}

export default ResetTodayFlags;
