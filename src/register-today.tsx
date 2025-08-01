/**
 * ストリーク今日登録コマンド
 *
 * このファイルは、手動実行でその日のストリークタスクを登録する処理を実装する。
 * 今日まだ作成していないストリークタスクがあれば作成し、日数をインクリメントする。
 * 既存パターンに合わせてAPI関数を使用する。
 */

import { showToast, Toast, Detail } from "@raycast/api";
import { useEffect, useState } from "react";

import { getStreaks, updateStreak, createStreakTask } from "./api";
import { isUpdatedToday, getTodayString, getNextDay } from "./helpers/streaks";
import { withTodoistApi } from "./helpers/withTodoistApi";

// グローバルな実行状態管理
let isProcessingRegistration = false;
const processedToday = new Set<string>();
let lastProcessedDate = "";

function RegisterTodayStreaks() {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<string>("");
  const [hasExecuted, setHasExecuted] = useState(false);

  useEffect(() => {
    // 複数レベルの重複実行防止
    if (hasExecuted) {
      console.log("Component-level: Process already executed, skipping...");
      return;
    }

    if (isProcessingRegistration) {
      console.log("Global-level: Registration already in progress, skipping...");
      return;
    }

    async function processStreaks() {
      setHasExecuted(true);
      isProcessingRegistration = true;

      const today = getTodayString();
      console.log("Register today streaks started for date:", today);

      // 日付が変わっていたら処理済みセットをクリア
      if (lastProcessedDate !== today) {
        console.log("Date changed, clearing processed streaks set");
        processedToday.clear();
        lastProcessedDate = today;
      }

      try {
        console.log("Step 1: Loading streaks from storage...");
        const streaks = await getStreaks();
        const today = getTodayString();
        let registeredCount = 0;

        console.log(`Step 2: Processing ${streaks.length} streaks for date: ${today}`);

        for (const streak of streaks) {
          try {
            // デバッグログ追加
            console.log(`Checking streak ${streak.id}: lastUpdatedAt=${streak.lastUpdatedAt}, today=${today}`);

            // 複数レベルでの重複チェック
            const streakTodayKey = `${streak.id}_${today}`;
            if (processedToday.has(streakTodayKey)) {
              console.log(`Global-level: Streak ${streak.id} already processed today, skipping`);
              continue;
            }

            // 今日既に更新済みかチェック
            if (isUpdatedToday(streak.lastUpdatedAt)) {
              console.log(`Streak ${streak.id} already registered today, skipping`);
              continue;
            }

            // 処理開始をマーク
            processedToday.add(streakTodayKey);

            const nextDay = getNextDay(streak.currentDay);
            const updatedStreak = {
              ...streak,
              currentDay: nextDay,
              lastUpdatedAt: today,
            };

            // Todoistにタスクを作成（重複防止のため1度だけ実行）
            console.log(`Creating Todoist task for streak: ${streak.taskContent}`);
            let taskCreationSuccess = false;
            try {
              // 一意のcommand UUIDで重複防止
              await createStreakTask(updatedStreak);
              console.log(`Todoist task created successfully for: ${streak.taskContent}`);
              taskCreationSuccess = true;

              // API呼び出し間に遅延を追加（レート制限回避）
              console.log("Waiting 2 seconds before next API call...");
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (taskError) {
              console.error(`Failed to create Todoist task for ${streak.taskContent}:`, taskError);
              // タスク作成失敗でも処理継続（ローカル更新は行う）
              console.log("Continuing with local storage update despite API failure...");
            }

            // ローカルストレージの日数を更新
            console.log(`Updating local storage for streak: ${streak.id}`);
            await updateStreak(streak.id, {
              currentDay: nextDay,
              lastUpdatedAt: today,
            });
            console.log(`Local storage updated successfully for: ${streak.taskContent}`);

            registeredCount++;
            console.log(`Successfully registered streak: ${streak.taskContent} to day ${nextDay}`);
          } catch (error) {
            console.error(`Failed to register streak ${streak.id}:`, error);
            // 個別のストリーク登録失敗は継続処理
          }
        }

        console.log(`Step 3: Register today completed. Registered ${registeredCount} streaks.`);

        // 結果を通知
        if (registeredCount > 0) {
          await showToast({
            style: Toast.Style.Success,
            title: "今日のストリーク登録完了",
            message: `${registeredCount}個のストリークタスクを作成しました`,
          });
          setResult(`今日のストリーク登録完了\n\n${registeredCount}個のストリークタスクを作成しました`);
        } else {
          await showToast({
            style: Toast.Style.Success,
            title: "今日のストリーク確認完了",
            message: "すべてのストリークは既に今日登録済みです",
          });
          setResult("今日のストリーク確認完了\n\nすべてのストリークは既に今日登録済みです");
        }
      } catch (error) {
        console.error("Register today streaks failed:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        await showToast({
          style: Toast.Style.Failure,
          title: "ストリーク登録に失敗しました",
          message: errorMessage,
        });
        setResult(`ストリーク登録に失敗しました\n\n${errorMessage}`);
      } finally {
        setIsLoading(false);
        isProcessingRegistration = false;
      }
    }

    processStreaks();
  }, []);

  return <Detail isLoading={isLoading} markdown={result || "ストリーク登録処理を実行中..."} />;
}

export default withTodoistApi(RegisterTodayStreaks);
