/**
 * Todoist APIラッパー - OAuth認証とエラーハンドリング
 *
 * 入力: コンポーネント
 * 出力: Todoist認証済みコンポーネント
 * 制約: OAuth認証が必要、Raycast内でのみ動作
 */

import { getPreferenceValues } from "@raycast/api";
import axios from "axios";
import React from "react";

let todoistApi: ReturnType<typeof axios.create>;

export function getTodoistApi() {
  if (!todoistApi) {
    throw new Error("Todoist API not initialized");
  }
  return todoistApi;
}

interface Preferences {
  token: string;
  dailyUpdateTime: string;
  timezone: string;
}

export function withTodoistApi<T extends object>(Component: React.ComponentType<T>) {
  return function WithTodoistApiComponent(props: T) {
    React.useEffect(() => {
      try {
        const preferences = getPreferenceValues<Preferences>();
        const token = preferences.token;

        if (token) {
          todoistApi = axios.create({
            baseURL: "https://api.todoist.com/rest/v2",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } else {
          console.warn("Todoist token not found in preferences");
        }
      } catch (error) {
        console.error("Failed to initialize Todoist API:", error);
      }
    }, []);

    return React.createElement(Component, props);
  };
}
