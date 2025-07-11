/**
 * ストリークデータ管理フック
 *
 * このファイルは、ストリークデータの取得・更新・削除を管理するカスタムフックを提供する。
 * useSyncDataパターンに合わせてストリークデータを管理する。
 */

import { showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";

import { getStreaks, saveStreak, updateStreak, deleteStreak as apiDeleteStreak, Streak } from "../api";

export function useStreakData() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      const streaksData = await getStreaks();
      setStreaks(streaksData);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "ストリーク取得に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addStreak = useCallback(async (streak: Streak) => {
    try {
      await saveStreak(streak);
      setStreaks((prev) => [...prev, streak]);
      await showToast({
        style: Toast.Style.Success,
        title: "ストリークを開始しました",
        message: `「${streak.taskContent}」の1日目のタスクを作成しました`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "ストリーク作成に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラー",
      });
      throw error;
    }
  }, []);

  const updateStreakData = useCallback(async (streakId: string, updates: Partial<Omit<Streak, "id">>) => {
    try {
      await updateStreak(streakId, updates);
      setStreaks((prev) => prev.map((streak) => (streak.id === streakId ? { ...streak, ...updates } : streak)));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "ストリーク更新に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラー",
      });
      throw error;
    }
  }, []);

  const removeStreak = useCallback(
    async (streakId: string) => {
      try {
        await apiDeleteStreak(streakId);
        setStreaks((prev) => prev.filter((streak) => streak.id !== streakId));
        const streak = streaks.find((s) => s.id === streakId);
        if (streak) {
          await showToast({
            style: Toast.Style.Success,
            title: "ストリークを削除しました",
            message: `「${streak.taskContent}」のストリークを削除しました`,
          });
        }
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "ストリーク削除に失敗しました",
          message: error instanceof Error ? error.message : "不明なエラー",
        });
        throw error;
      }
    },
    [streaks],
  );

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  return {
    streaks,
    isLoading,
    loadStreaks,
    addStreak,
    updateStreakData,
    removeStreak,
  };
}
