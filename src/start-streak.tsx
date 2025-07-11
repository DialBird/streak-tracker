/**
 * 新しいストリーク開始コマンド
 *
 * このファイルは、ユーザーが新しいストリークを開始するためのフォームUIを提供する。
 * 既存のcreate-projectパターンに合わせて実装している。
 */

import StreakForm from "./components/StreakForm";
import { withTodoistApi } from "./helpers/withTodoistApi";
import { useStreakData } from "./hooks/useStreakData";

function StartStreak() {
  const { addStreak } = useStreakData();

  return <StreakForm onStreakCreated={addStreak} />;
}

export default withTodoistApi(StartStreak);
