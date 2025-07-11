/**
 * ストリーク管理コマンド
 *
 * このファイルは、現在進行中のストリーク一覧を表示し、
 * 各ストリークの削除アクションを提供するリストUIを実装する。
 * 既存のshow-projectsパターンに合わせて実装している。
 */

import { ActionPanel, Action, Icon, List, useNavigation } from "@raycast/api";

import { Streak, updateFullStreak } from "./api";
import StreakEditForm from "./components/StreakEditForm";
import StreakForm from "./components/StreakForm";
import StreakListItem from "./components/StreakListItem";
import { withTodoistApi } from "./helpers/withTodoistApi";
import { useStreakData } from "./hooks/useStreakData";

function ManageStreaks() {
  const { push } = useNavigation();
  const { streaks, isLoading, removeStreak, addStreak, loadStreaks } = useStreakData();

  async function handleStreakUpdate(updatedStreak: Streak) {
    try {
      await updateFullStreak(updatedStreak);
      await loadStreaks();
    } catch (error) {
      console.error("Failed to update streak:", error);
    }
  }

  function handleStreakEdit(streak: Streak) {
    push(<StreakEditForm streak={streak} onStreakUpdated={handleStreakUpdate} />);
  }

  return (
    <List searchBarPlaceholder="ストリークを検索" isLoading={isLoading}>
      {streaks.map((streak) => (
        <StreakListItem key={streak.id} streak={streak} onDelete={removeStreak} onEdit={handleStreakEdit} />
      ))}

      <List.EmptyView
        title="ストリークがありません"
        description="新しいストリークを開始してください"
        actions={
          <ActionPanel>
            <Action.Push
              title="ストリークを開始"
              icon={Icon.Plus}
              target={<StreakForm onStreakCreated={addStreak} />}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}

export default withTodoistApi(ManageStreaks);
