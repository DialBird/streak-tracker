あなたは、TypeScriptとReactに精通した、経験豊富なRaycast拡張機能開発者です。これから、Todoistと連携する新しいRaycast拡張機能の開発をお願いします。

### 拡張機能の名称
Todoist Streak Tracker

### 目的
多くのユーザーは、習慣化したいタスク（例: 英語の勉強、運動）を毎日実行したいと考えています。この拡張機能は、指定されたタスクを「{タスク名} - N日目」という形式で毎日自動的にTodoistへ追加することで、ユーザーの習慣化とモチベーション維持をサポートします。Todoistの標準の繰り返し機能とは異なり、前日のタスクが未完了であっても、新しいタスクを日数をカウントアップしながら生成し続ける点が特徴です。

### 機能要件
この拡張機能には、以下の3つの主要なコマンドを実装してください。

1.  **`start-streak` (新しい連続タスクの開始)**
    *   **UI**: Raycastの`<Form>`を使用します。
    *   **入力項目**:
        *   `taskContent`: 連続記録したいタスクの内容（例: 「英語の勉強」）。
        *   `project`: Todoistのプロジェクトを選択する`<Form.Dropdown>`。プロジェクト一覧はTodoist APIから動的に取得してください。選択は任意とします。
    *   **処理**:
        *   フォームが送信されたら、タスク情報にユニークIDを付与し、「1日目」としてRaycastの`LocalStorage`に保存します。
        *   Todoist APIを呼び出し、「{taskContent} - 1日目」というタスクを、指定されたプロジェクト（または受信箱）に期日を「今日」として作成します。

2.  **`manage-streaks` (連続タスクの管理)**
    *   **UI**: Raycastの`<List>`を使用します。
    *   **表示内容**: `LocalStorage`に保存されている、現在進行中の連続タスクを一覧で表示します。各アイテムには、タスク内容と現在の日数（例: 「英語の勉強 (15日目)」）を表示してください。
    *   **アクション**:
        *   各タスクの`<ActionPanel>`から、その連続タスクを削除（チャレンジを中止）できるアクションを提供してください。実行すると`LocalStorage`から該当データが削除されます。

3.  **`background-updater` (タスクの自動生成)**
    *   **実行モード**: Raycastのバックグラウンド更新機能 (`mode: "background"`) を使用します。
    *   **実行間隔**: 24時間に1回 (`interval: "24h"`)。
    *   **処理**:
        *   `LocalStorage`から全ての連続タスク情報を読み込みます。
        *   各タスクについて、現在の日数を+1します。
        *   Todoist APIを呼び出し、「{taskContent} - {更新後の日数}日目」というタスクを、期日を「今日」として作成します。
        *   API呼び出しが成功した場合にのみ、`LocalStorage`に保存されている日数を更新します。これにより、APIエラーが発生しても日数がずれるのを防ぎます。
        *   1日に複数回実行されるのを防ぐため、最後に更新した日付をタスクごとに記録し、すでに今日更新済みであればスキップするロジックを実装してください。

### 技術仕様・実装の詳細

*   **言語**: TypeScript
*   **主要ライブラリ**: `@raycast/api`, `axios` (HTTPリクエスト用), `nanoid` (ユニークID生成用)
*   **API連携**:
    *   Todoist REST API v2 を使用します。
    *   タスク作成: `POST /rest/v2/tasks`
    *   プロジェクト一覧取得: `GET /rest/v2/projects`
*   **認証**:
    *   Todoist APIトークンは、Raycastの`<Preference>`機能でユーザーが設定できるようにしてください。コード内にハードコーディングしないでください。
*   **状態管理**:
    *   `LocalStorage`を使用して、連続タスクの状態を管理します。以下のデータ構造を参考にしてください。
        ```ts
        interface Streak {
          id: string; // nanoidで生成
          taskContent: string;
          projectId?: string;
          currentDay: number;
          startedAt: string; // ISO 8601 形式
          lastUpdatedAt: string; // 最後にタスク生成した日付 (YYYY-MM-DD)
        }
        ```
*   **エラーハンドリング**:
    *   API呼び出しが失敗した場合、ユーザーに`<Toast>`でエラーを通知してください。
    *   バックグラウンド処理でエラーが発生した場合は、`console.error`でログを出力してください。

### 成果物
上記の要件と仕様に基づき、Raycast拡張機能プロジェクト一式を、以下のファイル構成で生成してください。

1.  `package.json`: 依存関係 (axios, nanoid) と、3つのコマンド定義（`preferences`設定を含む）を記述。
2.  `tsconfig.json`: 標準的な設定。
3.  `src/start-streak.tsx`: 「新しい連続タスクの開始」コマンドの実装。
4.  `src/manage-streaks.tsx`: 「連続タスクの管理」コマンドの実装。
5.  `src/background-updater.tsx`: 「タスクの自動生成」バックグラウンドスクリプトの実装。
6.  `src/hooks/useTodoist.ts`: (推奨) Todoist API関連のロジック（プロジェクト一覧取得など）をまとめたカスタムフック。
7.  `src/lib/api.ts`: (推奨) Todoist APIを叩くコア関数（タスク作成など）を配置。
8.  `src/lib/storage.ts`: (推奨) `LocalStorage`の読み書きロジックをまとめたヘルパー関数。
9.  `assets/`: アイコン用のディレクトリ（空で良い）。

以上の指示に従って、完全なコードを生成してください。
