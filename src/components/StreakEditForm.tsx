/**
 * ストリーク編集フォームコンポーネント
 *
 * このファイルは、既存のストリークを編集するためのフォームUIを提供する。
 * 優先度、日数、タスク名の変更が可能。
 * 既存のコンポーネントパターンに合わせて実装している。
 */

import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";

import { Streak } from "../api";
import useSyncData from "../hooks/useSyncData";

type Props = {
  streak: Streak;
  onStreakUpdated: (updatedStreak: Streak) => void;
};

export default function StreakEditForm({ streak, onStreakUpdated }: Props) {
  const { pop } = useNavigation();
  const { data } = useSyncData();
  const [taskContent, setTaskContent] = useState(streak.taskContent || "");
  const [projectId, setProjectId] = useState(streak.projectId || "");
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(streak.priority || 4);
  const [currentDay, setCurrentDay] = useState((streak.currentDay || 1).toString());

  async function handleSubmit() {
    if (!taskContent.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "タスク名を入力してください",
      });
      return;
    }

    const dayNumber = parseInt(currentDay);
    if (isNaN(dayNumber) || dayNumber < 1) {
      await showToast({
        style: Toast.Style.Failure,
        title: "日数は1以上の数値を入力してください",
      });
      return;
    }

    try {
      const updatedStreak: Streak = {
        ...streak,
        taskContent: taskContent.trim(),
        projectId: projectId || undefined,
        priority,
        currentDay: dayNumber,
      };

      onStreakUpdated(updatedStreak);

      await showToast({
        style: Toast.Style.Success,
        title: "ストリーク更新完了",
        message: `${taskContent}の設定を更新しました`,
      });

      pop();
    } catch (error) {
      console.error("Failed to update streak:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "ストリーク更新に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラー",
      });
    }
  }

  const projects = data?.projects || [];

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="更新" onSubmit={handleSubmit} />
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
      <Form.TextField
        id="currentDay"
        title="現在の日数"
        placeholder="例: 15"
        value={currentDay}
        onChange={setCurrentDay}
      />
      <Form.Dropdown id="projectId" title="プロジェクト" value={projectId} onChange={setProjectId}>
        <Form.Dropdown.Item value="" title="インボックス" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="priority"
        title="優先度"
        value={priority.toString()}
        onChange={(value) => setPriority(parseInt(value) as 1 | 2 | 3 | 4)}
      >
        <Form.Dropdown.Item value="1" title="P1 (緊急)" />
        <Form.Dropdown.Item value="2" title="P2 (高)" />
        <Form.Dropdown.Item value="3" title="P3 (普通)" />
        <Form.Dropdown.Item value="4" title="P4 (低)" />
      </Form.Dropdown>
    </Form>
  );
}
