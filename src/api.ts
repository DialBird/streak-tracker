// This API is intended to be used for features
// that are not available within Todoist's REST API.
import crypto from "crypto";

import { Dispatch, SetStateAction } from "react";

import { makeApiRequest } from "./helpers/withTodoistApi";

export let sync_token = "*";

export type ProjectViewStyle = "list" | "board";

export type Project = {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  child_order: number;
  collapsed: boolean;
  shared: boolean;
  is_deleted: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  sync_id: string | null;
  inbox_project?: boolean;
  team_inbox?: boolean;
  view_style: ProjectViewStyle;
};

export type SyncData = {
  sync_token: string;
  sync_status?: Record<string, "ok" | { error: string }>;
  collaborators: Collaborator[];
  collaborator_states: CollaboratorState[];
  items: Task[];
  labels: Label[];
  filters: Filter[];
  locations: [string, string, string][];
  notes: Comment[];
  reminders: Reminder[];
  projects: Project[];
  sections: Section[];
  temp_id_mapping?: Record<string, string>;
  user: User;
};

export type CachedDataParams = {
  data: SyncData | undefined;
  setData: Dispatch<SetStateAction<SyncData | undefined>>;
};

class SyncError extends Error {
  code: number;
  tag?: string;

  constructor(message: string, code: number, tag?: string) {
    super(message);
    this.name = "SyncError";
    this.code = code;
    this.tag = tag;
    Object.setPrototypeOf(this, SyncError.prototype);
  }
}

export async function syncRequest(params: Record<string, unknown>) {
  const data = (await makeApiRequest("/sync", {
    method: "POST",
    body: JSON.stringify(params),
  })) as SyncData;

  if (data.sync_status) {
    const uuid = Object.keys(data.sync_status)[0];
    if (data.sync_status[uuid] !== "ok") {
      const error = data.sync_status[uuid] as { error: string; error_code: number; error_tag?: string };
      throw new SyncError(error.error, error.error_code, error.error_tag);
    }
  }

  sync_token = data.sync_token;

  return data;
}

export async function getFilterTasks(query: string) {
  try {
    const data = (await makeApiRequest(`/tasks/filter?query=${encodeURIComponent(query)}`, {
      method: "GET",
    })) as { results: Task[] };
    return data.results;
  } catch (error) {
    throw new Error("Error fetching filter tasks:" + error);
  }
}

export async function initialSync(): Promise<SyncData> {
  try {
    console.log("Starting initial sync with v1 API...");

    const { getPreferenceValues } = await import("@raycast/api");
    const preferences = getPreferenceValues<{ token: string }>();
    const token = preferences.token;

    if (!token) {
      throw new Error("Token not available");
    }

    // v1 sync APIを使ってプロジェクト一覧を取得
    const response = await fetch("https://api.todoist.com/api/v1/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sync_token: "*",
        resource_types: ["projects"],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const syncResponse = await response.json();
    console.log("Initial sync response:", syncResponse);

    return {
      sync_token: syncResponse.sync_token || "*",
      projects: syncResponse.projects || [],
      items: syncResponse.items || [],
      labels: syncResponse.labels || [],
      filters: syncResponse.filters || [],
      locations: syncResponse.locations || [],
      notes: syncResponse.notes || [],
      reminders: syncResponse.reminders || [],
      sections: syncResponse.sections || [],
      collaborators: syncResponse.collaborators || [],
      collaborator_states: syncResponse.collaborator_states || [],
      user: syncResponse.user || ({} as any),
    };
  } catch (error) {
    console.error("Failed to sync data:", error);
    throw error;
  }
}

export type AddProjectArgs = {
  name: string;
  color?: string;
  parent_id?: string | null;
  child_order?: number;
  is_favorite?: boolean;
  view_style?: ProjectViewStyle;
};

export async function addProject(args: AddProjectArgs, { data, setData }: CachedDataParams) {
  const temp_id = crypto.randomUUID();

  const updatedData = await syncRequest({
    sync_token: "*",
    resource_types: ["projects"],
    commands: [
      {
        type: "project_add",
        temp_id,
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      projects: updatedData.projects,
    });
  }

  return updatedData.temp_id_mapping ? updatedData.temp_id_mapping[temp_id] : null;
}

export type UpdateProjectArgs = {
  id: string;
  name?: string;
  color?: string;
  collapsed?: boolean;
  is_favorite?: boolean;
  view_style?: ProjectViewStyle;
};

export async function updateProject(args: UpdateProjectArgs, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["projects"],
    commands: [
      {
        type: "project_update",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      projects: data.projects.map((p) => (p.id === args.id ? updatedData.projects[0] : p)),
    });
  }
}

export async function archiveProject(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["projects"],
    commands: [
      {
        type: "project_archive",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
    });
  }
}

export async function deleteProject(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["projects"],
    commands: [
      {
        type: "project_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
    });
  }
}

export type Date = {
  date: string;
  timezone: string | null;
  string: string;
  lang: "en" | "da" | "pl" | "zh" | "ko" | "de" | "pt" | "ja" | "it" | "fr" | "sv" | "ru" | "es" | "nl";
  is_recurring: boolean;
};

export type Deadline = {
  date: string;
  timezone: string | null;
  lang: "en" | "da" | "pl" | "zh" | "ko" | "de" | "pt" | "ja" | "it" | "fr" | "sv" | "ru" | "es" | "nl";
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  description: string;
  due: Date | null;
  deadline: Deadline | null;
  priority: number;
  parent_id: string | null;
  child_order: number;
  section_id: string | null;
  day_order: number;
  collapsed: boolean;
  labels: string[];
  filters: string[];
  added_by_uid: string | null;
  assigned_by_uid: string;
  responsible_uid: string | null;
  checked: boolean;
  is_deleted: boolean;
  sync_id: string | null;
  completed_at: string | null;
  added_at: string;
};

type QuickAddTaskArgs = {
  text: string;
  note?: string;
  reminder?: string;
  auto_reminder?: boolean;
};

export async function quickAddTask(args: QuickAddTaskArgs) {
  const data = (await makeApiRequest("/tasks/quick", {
    method: "POST",
    body: JSON.stringify(args),
  })) as Task;
  return data;
}

export type DateOrString = { date: string; string?: undefined } | { date?: undefined; string: string };

export type AddTaskArgs = {
  content: string;
  description?: string;
  project_id?: string;
  due?: DateOrString;
  deadline?: DateOrString;
  duration?: {
    unit: "minute" | "day";
    amount: number;
  };
  priority?: number;
  parent_id?: string | null;
  child_order?: number;
  section_id?: string | null;
  day_order?: number;
  collapsed?: boolean;
  labels?: string[];
  assigned_by_uid?: string;
  responsible_uid?: string | null;
  auto_reminder?: boolean;
  auto_parse_labels?: boolean;
};

export async function addTask(args: AddTaskArgs, { data, setData }: CachedDataParams) {
  const temp_id = crypto.randomUUID();

  const updatedData = await syncRequest({
    sync_token: "*",
    resource_types: ["items"],
    commands: [
      {
        type: "item_add",
        temp_id,
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  const newData = data ? { ...data, items: updatedData.items } : updatedData;
  if (data) {
    setData(newData);
  }

  // In the case where the user uploads a file, we need to return the updated data
  // so that addComment doesn't overwrite the cached data with the newly created task
  return {
    id: updatedData.temp_id_mapping ? updatedData.temp_id_mapping[temp_id] : null,
    data: newData,
  };
}

export type UpdateTaskArgs = {
  id: string;
  content?: string;
  description?: string;
  due?: DateOrString;
  deadline?: DateOrString;
  priority?: number;
  collapsed?: boolean;
  labels?: string[];
  assigned_by_uid?: string;
  responsible_uid?: string | null;
  day_order?: number;
};

export async function updateTask(args: UpdateTaskArgs, cachedData?: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["items"],
    commands: [
      {
        type: "item_update",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  // If returned items length is 0 then no update is needed, we can skip.
  if (cachedData?.data && updatedData.items.length > 0) {
    cachedData.setData({
      ...cachedData.data,
      items: cachedData.data.items.map((i) => (i.id === args.id ? updatedData.items[0] : i)),
    });
  }
}

export async function closeTask(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["items"],
    commands: [
      {
        type: "item_close",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      items: data.items.filter((i) => i.id !== id),
    });
  }
}

export async function deleteTask(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["items"],
    commands: [
      {
        type: "item_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      items: data.items.filter((i) => i.id !== id),
    });
  }
}

export type MoveTaskArgs = {
  id: string;
  parent_id?: string;
  section_id?: string;
  project_id?: string;
};

export async function moveTask(args: MoveTaskArgs, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["items"],
    commands: [
      {
        type: "item_move",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      items: data.items.map((i) => (i.id === args.id ? updatedData.items[0] : i)),
    });
  }
}

export async function uncompleteTask(id: string, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token: "*",
    resource_types: ["items"],
    commands: [
      {
        type: "item_uncomplete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      items: updatedData.items,
    });
  }
}

export type Reminder = {
  id: string;
  notify_uid: string;
  item_id: string;
  type: "relative" | "absolute" | "location";
  due?: Date;
  mm_offset?: number;
  name?: string;
  loc_lat?: string;
  loc_long?: string;
  loc_trigger?: "on_enter" | "on_leave";
  radius?: number;
  is_deleted: number; // 1 for deleted, 0 for not deleted
};

export type AddReminderArgs = {
  item_id: string;
  type: "relative" | "absolute" | "location";
  notify_uid?: string;
  due?: DateOrString;
  minute_offset?: number;
  name?: string;
  loc_lat?: string;
  loc_long?: string;
  loc_trigger?: "on_enter" | "on_leave";
  radius?: number;
};

export async function addReminder(args: AddReminderArgs, { data, setData }: CachedDataParams) {
  const temp_id = crypto.randomUUID();

  const updatedData = await syncRequest({
    sync_token: "*",
    resource_types: ["reminders"],
    commands: [
      {
        type: "reminder_add",
        temp_id,
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      reminders: updatedData.reminders,
    });
  }

  return updatedData.temp_id_mapping ? updatedData.temp_id_mapping[temp_id] : null;
}

export async function deleteReminder(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["reminders"],
    commands: [
      {
        type: "reminder_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      reminders: data.reminders.filter((r) => r.id !== id),
    });
  }
}

export type Label = {
  id: string;
  name: string;
  color: string;
  item_order: number;
  is_deleted: boolean;
  is_favorite: boolean;
};

type AddLabelArgs = {
  name: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
};

export async function addLabel(args: AddLabelArgs, { data, setData }: CachedDataParams) {
  try {
    const addedData = await syncRequest({
      sync_token,
      resource_types: ["labels"],
      commands: [
        {
          type: "label_add",
          temp_id: crypto.randomUUID(),
          uuid: crypto.randomUUID(),
          args,
        },
      ],
    });

    if (data) {
      setData({
        ...data,
        labels: [...data.labels, addedData.labels[0]],
      });
    }
  } catch (err) {
    if (err instanceof SyncError && err.tag === "LABEL_ALREADY_EXISTS") {
      return;
    }
    throw err;
  }
}

type UpdateLabelArgs = {
  id: string;
  name?: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
};

export async function updateLabel(args: UpdateLabelArgs, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["labels"],
    commands: [
      {
        type: "label_update",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      labels: data.labels.map((p) => (p.id === args.id ? updatedData.labels[0] : p)),
    });
  }
}

export async function deleteLabel(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["labels"],
    commands: [
      {
        type: "label_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      labels: data.labels.filter((l) => {
        return l.id != id;
      }),
    });
  }
}

export type Filter = {
  id: string;
  name: string;
  query: string;
  color: string;
  item_order: number;
  is_deleted: boolean;
  is_favorite: boolean;
};

type UpdateFilterArgs = {
  id: string;
  name?: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
};

export async function updateFilter(args: UpdateFilterArgs, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["filters"],
    commands: [
      {
        type: "filter_update",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      filters: data.filters.map((p) => (p.id === args.id ? updatedData.filters[0] : p)),
    });
  }
}

export async function deleteFilter(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["filters"],
    commands: [
      {
        type: "filter_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      filters: data.filters.filter((l) => {
        return l.id != id;
      }),
    });
  }
}

export type Section = {
  id: string;
  name: string;
  project_id: string;
  section_order: number;
  collapsed: boolean;
  sync_id: string | null;
  is_deleted: boolean;
  is_archived: boolean;
  archived_at: string | null;
  added_at: string;
};

export type Comment = {
  id: string;
  posted_uid: string;
  item_id: string;
  content: string;
  file_attachment: File | null;
  uids_to_notify: string[];
  is_deleted: boolean;
  posted_at: string;
  reactions: Record<string, string[]>;
};

type AddCommentArgs = {
  item_id: string;
  content: string;
  file_attachment?: File;
  uids_to_notify?: string[];
};

export async function addComment(args: AddCommentArgs, { data, setData }: CachedDataParams) {
  const temp_id = crypto.randomUUID();

  const updatedData = await syncRequest({
    sync_token: "*",
    resource_types: ["notes"],
    commands: [
      {
        type: "note_add",
        temp_id,
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      notes: updatedData.notes,
    });
  }

  return updatedData.temp_id_mapping ? updatedData.temp_id_mapping[temp_id] : null;
}

type UpdateCommentArgs = {
  id: string;
  content: string;
};

export async function updateComment(args: UpdateCommentArgs, { data, setData }: CachedDataParams) {
  const updatedData = await syncRequest({
    sync_token,
    resource_types: ["notes"],
    commands: [
      {
        type: "note_update",
        uuid: crypto.randomUUID(),
        args,
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      notes: data.notes.map((c) => (c.id === args.id ? updatedData.notes[0] : c)),
    });
  }
}

export async function deleteComment(id: string, { data, setData }: CachedDataParams) {
  await syncRequest({
    sync_token,
    resource_types: ["comments"],
    commands: [
      {
        type: "note_delete",
        uuid: crypto.randomUUID(),
        args: { id },
      },
    ],
  });

  if (data) {
    setData({
      ...data,
      notes: data.notes.filter((c) => c.id !== id),
    });
  }
}

export type Collaborator = {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  image_id?: string;
};

export type CollaboratorState = {
  project_id: string;
  user_id: string;
  state: "active" | "invited";
  is_deleted: boolean;
};

export type User = {
  auto_reminder: number; // -1 if no reminders
  avatar_medium: string;
  daily_goal: number;
  full_name: string;
  id: string;
  is_premium: boolean;
  time_format: number;
  premium_status: "not_premium" | "current_personal_plan" | "active_business_account" | "teams_business_account";
};

export type Event = {
  id: string;
  object_id: string;
  event_date: string;
  event_type: "completed";
  extra_data: {
    content: string;
  };
};

export async function getActivity() {
  const data = (await makeApiRequest("/activities?event_type=completed", {
    method: "GET",
  })) as { results: Event[] };

  return data.results;
}

type Day = {
  date: string; // YYYY-MM-DD
  items: { completed: number; id: string }[];
  total_completed: number;
};

export type Stats = {
  days_items: Day[];
};

export async function getProductivityStats() {
  const data = (await makeApiRequest("/tasks/completed/stats", {
    method: "GET",
  })) as Stats;
  return data;
}

export type File = {
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  upload_state: "pending" | "completed";
};

export async function uploadFile(): Promise<never> {
  // TODO: この関数はFormDataを使用しているため、fetchベースの実装は後で対応
  throw new Error("uploadFile is not yet implemented with fetch API");
}

export async function getTask(id: string) {
  const data = (await makeApiRequest(`/tasks/${id}`, {
    method: "GET",
  })) as Task;
  return data;
}

export async function getProject(id: string) {
  const data = (await makeApiRequest(`/projects/${id}`, {
    method: "GET",
  })) as Project;
  return data;
}

// =====================================
// Streak Management API
// =====================================

export type Streak = {
  id: string; // nanoidで生成されるユニークID
  taskContent: string; // ストリークするタスクの内容
  projectId?: string; // Todoistプロジェクトの任意ID
  priority: 1 | 2 | 3 | 4; // 優先度（1=最高、4=最低）
  currentDay: number; // 現在の日数
  startedAt: string; // 開始日時（ISO 8601形式）
  lastUpdatedAt: string; // 最終更新日（YYYY-MM-DD形式）
};

const STREAKS_STORAGE_KEY = "streaks";

export async function getStreaks(): Promise<Streak[]> {
  try {
    const { LocalStorage } = await import("@raycast/api");
    const data = await LocalStorage.getItem<string>(STREAKS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    const streaks = JSON.parse(data);

    // 古いデータのマイグレーション（priorityフィールドが存在しない場合）
    const migratedStreaks = streaks.map((streak: any) => ({
      ...streak,
      priority: streak.priority || 4, // デフォルト優先度
      currentDay: streak.currentDay || 1, // デフォルト日数
    }));

    return migratedStreaks;
  } catch (error) {
    console.error("Failed to get streaks from local storage:", error);
    return [];
  }
}

export async function saveStreak(streak: Streak): Promise<void> {
  try {
    const { LocalStorage } = await import("@raycast/api");
    const existingStreaks = await getStreaks();
    const updatedStreaks = [...existingStreaks, streak];
    await LocalStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(updatedStreaks));
  } catch (error) {
    console.error("Failed to save streak to local storage:", error);
    throw error;
  }
}

export async function updateStreak(streakId: string, updates: Partial<Omit<Streak, "id">>): Promise<void> {
  try {
    const { LocalStorage } = await import("@raycast/api");
    const streaks = await getStreaks();
    const updatedStreaks = streaks.map((streak) => (streak.id === streakId ? { ...streak, ...updates } : streak));
    await LocalStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(updatedStreaks));
  } catch (error) {
    console.error("Failed to update streak:", error);
    throw error;
  }
}

export async function updateFullStreak(updatedStreak: Streak): Promise<void> {
  try {
    const { LocalStorage } = await import("@raycast/api");
    const streaks = await getStreaks();
    const updatedStreaks = streaks.map((streak) => (streak.id === updatedStreak.id ? updatedStreak : streak));
    await LocalStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(updatedStreaks));
  } catch (error) {
    console.error("Failed to update full streak:", error);
    throw error;
  }
}

export async function deleteStreak(streakId: string): Promise<void> {
  try {
    const { LocalStorage } = await import("@raycast/api");
    const streaks = await getStreaks();
    const filteredStreaks = streaks.filter((streak) => streak.id !== streakId);
    await LocalStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify(filteredStreaks));
  } catch (error) {
    console.error("Failed to delete streak:", error);
    throw error;
  }
}

// UIの優先度をTodoist APIの優先度に変換
function convertPriorityToTodoistApi(uiPriority: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  // UI: P1(緊急)=1, P2(高)=2, P3(普通)=3, P4(低)=4
  // API: 1=Low(低), 2=Normal(普通), 3=Important(高), 4=Urgent(緊急)
  switch (uiPriority) {
    case 1: // P1(緊急) -> API 4(Urgent)
      return 4;
    case 2: // P2(高) -> API 3(Important)
      return 3;
    case 3: // P3(普通) -> API 2(Normal)
      return 2;
    case 4: // P4(低) -> API 1(Low)
      return 1;
    default:
      return 1;
  }
}

// リトライ付きAPI呼び出し
async function retryApiCall<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      console.error(`API call attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
  throw new Error("Unreachable code");
}

// 簡単なAPI接続テスト関数 - fetch APIを使用 (v1)
export async function testTodoistApi(): Promise<void> {
  return retryApiCall(async () => {
    console.log("Testing Todoist API v1 connection with sync endpoint...");

    const { getPreferenceValues } = await import("@raycast/api");
    const preferences = getPreferenceValues<{ token: string }>();
    const token = preferences.token;

    if (!token) {
      throw new Error("Token not available");
    }

    console.log("Making POST sync request to get projects...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒に延長

    const response = await fetch("https://api.todoist.com/api/v1/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sync_token: "*",
        resource_types: ["projects"],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("API v1 sync test successful:", response.status);
    const data = await response.json();
    console.log("Projects count:", data.projects?.length || 0);
  });
}

// バックグラウンド処理専用のタスク作成関数（テストなし）
export async function createStreakTaskDirect(streak: Streak): Promise<void> {
  try {
    console.log("Creating Todoist task directly without pre-test...");

    const { getPreferenceValues } = await import("@raycast/api");
    const preferences = getPreferenceValues<{ token: string }>();
    const token = preferences.token;

    const tempId = crypto.randomUUID();
    const commandUuid = crypto.randomUUID();

    const syncData = {
      sync_token: "*",
      commands: [
        {
          type: "item_add",
          temp_id: tempId,
          uuid: commandUuid,
          args: {
            content: `${streak.taskContent} - ${streak.currentDay}日目`,
            project_id: streak.projectId,
            priority: convertPriorityToTodoistApi(streak.priority),
            due: { string: "today" },
          },
        },
      ],
    };

    console.log("Creating task with direct sync data:", JSON.stringify(syncData, null, 2));

    // シンプルなfetch（リトライなし）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://api.todoist.com/api/v1/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(syncData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Todoist task created successfully with direct sync API:", responseData);

    // sync_statusをチェック
    if (responseData.sync_status && responseData.sync_status[commandUuid] !== "ok") {
      const error = responseData.sync_status[commandUuid];
      throw new Error(`Sync command failed: ${error.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Failed to create Todoist task with direct sync API:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (error.name === "AbortError") {
        throw new Error("Request timed out - please check your connection");
      }
    }
    throw error;
  }
}

export async function createStreakTask(streak: Streak): Promise<void> {
  try {
    console.log("Creating Todoist task without pre-test to avoid duplicates...");

    const { getPreferenceValues } = await import("@raycast/api");
    const preferences = getPreferenceValues<{ token: string }>();
    const token = preferences.token;

    console.log("Creating Todoist task using sync command...");

    const tempId = crypto.randomUUID();
    const commandUuid = crypto.randomUUID();

    const syncData = {
      sync_token: "*",
      commands: [
        {
          type: "item_add",
          temp_id: tempId,
          uuid: commandUuid,
          args: {
            content: `${streak.taskContent} - ${streak.currentDay}日目`,
            project_id: streak.projectId,
            priority: convertPriorityToTodoistApi(streak.priority),
            due: { string: "today" },
          },
        },
      ],
    };

    console.log("Creating task with sync data:", JSON.stringify(syncData, null, 2));

    // シンプルなAPI呼び出し（リトライなし）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://api.todoist.com/api/v1/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(syncData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();

    console.log("Todoist task created successfully with sync API:", responseData);

    // sync_statusをチェック
    if (responseData.sync_status && responseData.sync_status[commandUuid] !== "ok") {
      const error = responseData.sync_status[commandUuid];
      throw new Error(`Sync command failed: ${error.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Failed to create Todoist task with sync API:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (error.name === "AbortError") {
        throw new Error("Request timed out - please check your connection");
      }
    }
    throw error;
  }
}
