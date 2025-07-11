/**
 * ストリーク一覧項目コンポーネント
 *
 * このファイルは、ストリーク一覧での各ストリーク項目を表示するコンポーネントを定義する。
 * 既存のProjectListItemパターンに合わせて実装している。
 */

import { ActionPanel, Action, List, confirmAlert, Alert } from "@raycast/api";

import { Streak } from "../api";
import { getStreakTitle, getStreakSubtitle, getStreakAccessory } from "../helpers/streaks";

interface StreakListItemProps {
  streak: Streak;
  onDelete: (streakId: string) => Promise<void>;
}

export default function StreakListItem({ streak, onDelete }: StreakListItemProps) {
  async function handleDelete() {
    const confirmed = await confirmAlert({
      title: "ストリークを削除しますか？",
      message: `「${streak.taskContent}」のストリーク（${streak.currentDay}日目）を削除します。この操作は取り消せません。`,
      primaryAction: {
        title: "削除",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await onDelete(streak.id);
    }
  }

  return (
    <List.Item
      title={getStreakTitle(streak)}
      subtitle={getStreakSubtitle(streak)}
      accessories={[{ text: getStreakAccessory(streak) }]}
      actions={
        <ActionPanel>
          <Action title="ストリークを削除" style={Action.Style.Destructive} onAction={handleDelete} />
        </ActionPanel>
      }
    />
  );
}
