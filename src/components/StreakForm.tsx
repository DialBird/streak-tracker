/**
 * ストリーク作成フォームコンポーネント
 *
 * このファイルは、新しいストリークを作成するためのフォームUIを提供する。
 * プロジェクト選択、タスク名入力、作成処理を含む。
 * 既存のコンポーネントパターンに合わせて実装している。
 */

import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { nanoid } from "nanoid";
import { useState } from "react";

import { Streak, createStreakTask } from "../api";
import { getTodayString } from "../helpers/streaks";
import useSyncData from "../hooks/useSyncData";

type Props = {
  onStreakCreated: (streak: Streak) => void;
};

export default function StreakForm({ onStreakCreated }: Props) {
  const { pop } = useNavigation();
  const { data } = useSyncData();
  const [taskContent, setTaskContent] = useState("");
  const [projectId, setProjectId] = useState("");

  async function handleSubmit() {
    if (!taskContent.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "タスク名を入力してください",
      });
      return;
    }

    try {
      const streak: Streak = {
        id: nanoid(),
        taskContent: taskContent.trim(),
        projectId: projectId || undefined,
        currentDay: 1,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: getTodayString(),
      };

      // 初回タスクを作成
      await createStreakTask(streak);

      // ローカルストレージに保存
      onStreakCreated(streak);

      await showToast({
        style: Toast.Style.Success,
        title: "ストリーク開始",
        message: `${taskContent} - 1日目のタスクを作成しました`,
      });

      pop();
    } catch (error) {
      console.error("Failed to create streak:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "ストリーク作成に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラー",
      });
    }
  }

  const projects = data?.projects || [];

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="ストリーク開始" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="taskContent"
        title="タスク名"
        placeholder="例: 英語学習"
        value={taskContent}
        onChange={setTaskContent}
      />
      <Form.Dropdown id="projectId" title="プロジェクト" value={projectId} onChange={setProjectId}>
        <Form.Dropdown.Item value="" title="インボックス" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
