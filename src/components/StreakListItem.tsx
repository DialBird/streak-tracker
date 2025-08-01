/**
 * ストリークリストアイテムコンポーネント
 *
 * このファイルは、ストリーク一覧での個別ストリーク表示を実装する。
 * 削除確認アクション、表示情報を含む。
 * 既存のListItemパターンに合わせて実装している。
 */

import { ActionPanel, Action, Icon, List, Alert, confirmAlert } from "@raycast/api";

import { Streak } from "../api";
import { getStreakTitle } from "../helpers/streaks";

type Props = {
  streak: Streak;
  onDelete: (streakId: string) => void;
  onEdit: (streak: Streak) => void;
};

export default function StreakListItem({ streak, onDelete, onEdit }: Props) {
  async function handleDelete() {
    const confirmed = await confirmAlert({
      title: "ストリークを削除しますか？",
      message: `「${streak.taskContent}」のストリーク記録が削除されます。`,
      primaryAction: {
        title: "削除",
        style: Alert.ActionStyle.Destructive,
      },
      dismissAction: {
        title: "キャンセル",
      },
    });

    if (confirmed) {
      onDelete(streak.id);
    }
  }

  return (
    <List.Item
      title={getStreakTitle(streak)}
      subtitle={`${streak.currentDay}日継続中 | P${streak.priority}`}
      accessories={[
        {
          text: `開始: ${new Date(streak.startedAt).toLocaleDateString()}`,
        },
        {
          text: `最終実行: ${streak.lastUpdatedAt}`,
        },
      ]}
      actions={
        <ActionPanel>
          <Action title="編集" icon={Icon.Pencil} onAction={() => onEdit(streak)} />
          <Action title="削除" icon={Icon.Trash} style={Action.Style.Destructive} onAction={handleDelete} />
        </ActionPanel>
      }
    />
  );
}
