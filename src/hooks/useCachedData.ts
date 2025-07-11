/**
 * ��÷������ï
 *
 * e�: jW
 * ��: ��÷�U�_Todoist���h�ÿ�
 * 6: LocalStorage�(Wf����8�
 */

import { useCachedState } from "@raycast/utils";

import { SyncData } from "../api";

export default function useCachedData() {
  return useCachedState<SyncData | undefined>("sync-data");
}
