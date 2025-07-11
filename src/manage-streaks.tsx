/**
 * ストリーク管理コマンド
 *
 * このファイルは、現在進行中のストリーク一覧を表示し、
 * 各ストリークの削除アクションを提供するリストUIを実装する。
 * 既存のshow-projectsパターンに合わせて実装している。
 */

import { ActionPanel, Action, Icon, List } from "@raycast/api";

import StreakForm from "./components/StreakForm";
import StreakListItem from "./components/StreakListItem";
import { withTodoistApi } from "./helpers/withTodoistApi";
import { useStreakData } from "./hooks/useStreakData";

function ManageStreaks() {
  const { streaks, isLoading, removeStreak, addStreak } = useStreakData();

  return (
    <List searchBarPlaceholder="ストリークを検索" isLoading={isLoading}>
      {streaks.map((streak) => (
        <StreakListItem key={streak.id} streak={streak} onDelete={removeStreak} />
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
