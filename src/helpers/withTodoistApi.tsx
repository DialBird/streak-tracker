/**
 * Todoist APIラッパー - OAuth認証とエラーハンドリング
 *
 * 入力: コンポーネント
 * 出力: Todoist認証済みコンポーネント
 * 制約: OAuth認証が必要、Raycast内でのみ動作
 */

import { getPreferenceValues } from "@raycast/api";
import React from "react";

// fetchベースの簡単なAPI関数
export async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const preferences = getPreferenceValues<{ token: string }>();
  const token = preferences.token;

  if (!token) {
    throw new Error("Todoist API not initialized - token missing");
  }

  const response = await fetch(`https://api.todoist.com/api/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// 互換性のため残しているが、もう使用しない
export function getTodoistApi() {
  throw new Error("getTodoistApi is deprecated - use makeApiRequest instead");
}

interface Preferences {
  token: string;
  dailyUpdateTime: string;
  timezone: string;
}

// 単純化されたHOC（fetchベース）
export function withTodoistApi<T extends object>(Component: React.ComponentType<T>) {
  return function WithTodoistApiComponent(props: T) {
    React.useEffect(() => {
      try {
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        if (!token) {
          console.warn("Todoist token not found in preferences");
        } else {
          console.log("Todoist API ready with fetch-based implementation");
        }
      } catch (error) {
        console.error("Failed to check Todoist API credentials:", error);
      }
    }, []);

    return React.createElement(Component, props);
  };
}
