/**
 * ストリーク作成フォームコンポーネント
 *
 * このファイルは、新しいストリークを作成するためのフォームコンポーネントを定義する。
 * ProjectFormパターンに合わせて実装している。
 */

import { ActionPanel, Action, Form, useNavigation } from "@raycast/api";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";

import { Streak, createStreakTask } from "../api";
import { validateStreak, getTodayString } from "../helpers/streaks";
import useSyncData from "../hooks/useSyncData";

interface StreakFormProps {
  onStreakCreated: (streak: Streak) => Promise<void>;
}

interface FormValues {
  taskContent: string;
  projectId: string;
}

export default function StreakForm({ onStreakCreated }: StreakFormProps) {
  const { pop } = useNavigation();
  const { data, isLoading } = useSyncData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projects = data?.projects.filter((p) => !p.inbox_project) ?? [];

  async function handleSubmit(values: FormValues) {
    const validationError = validateStreak(values.taskContent);
    if (validationError) {
      // エラーは validateStreak でトーストが表示される想定
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const today = getTodayString();

      const streak: Streak = {
        id: nanoid(),
        taskContent: values.taskContent.trim(),
        projectId: values.projectId || undefined,
        currentDay: 1,
        startedAt: now.toISOString(),
        lastUpdatedAt: today,
      };

      // Todoistにタスクを作成
      await createStreakTask(streak);

      // ローカルストレージに保存
      await onStreakCreated(streak);

      pop();
    } catch (error) {
      console.error("Failed to create streak:", error);
      // エラーハンドリングは onStreakCreated で行われる
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isLoading || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="ストリークを開始" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="taskContent" title="タスク内容" placeholder="例: 英語の勉強" />
      <Form.Dropdown id="projectId" title="プロジェクト" defaultValue="">
        <Form.Dropdown.Item value="" title="受信箱" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
