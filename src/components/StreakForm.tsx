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
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(4);
  const [currentDay, setCurrentDay] = useState("1");

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
      const streak: Streak = {
        id: nanoid(),
        taskContent: taskContent.trim(),
        projectId: projectId || undefined,
        priority,
        currentDay: dayNumber,
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
        message: `${taskContent} - ${dayNumber}日目のタスクを作成しました`,
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

  const projects = Array.isArray(data?.projects) ? data.projects : [];

  // デバッグログ
  console.log("StreakForm - data:", data);
  console.log("StreakForm - projects:", projects);
  console.log("StreakForm - projects is array:", Array.isArray(projects));

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
      <Form.TextField
        id="currentDay"
        title="開始日数"
        placeholder="例: 1"
        value={currentDay}
        onChange={setCurrentDay}
        info="既に何日か継続している場合は、その日数を入力してください"
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
