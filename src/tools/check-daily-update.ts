/**
 * 今日既に更新済みかチェックするツール
 *
 * 入力: 最終更新日（YYYY-MM-DD形式）
 * 出力: 今日既に更新済みならtrue、そうでなければfalse
 * 制約: 日付の比較のみを行う
 */

import { isUpdatedToday } from "../helpers/streaks";

export default function checkDailyUpdateTool(params: { lastUpdatedAt: string }): boolean {
  return isUpdatedToday(params.lastUpdatedAt);
}
