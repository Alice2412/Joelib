// Cloudflare KV Server Utilities for ChatJoePT
// Manages:
// 1. 24-hour usage limits (2.00 CNY cap per account)
// 2. Server-side session storage & cross-device sync (max 200 dialogs, max 16 MiB)
// 3. Public shared dialogs (accessible without authentication)
// 4. Percentage-based quota calculations

import type { ChatSession, Message } from "~/types/chat";

export const MAX_DIALOGS_PER_USER = 200;
export const MAX_STORAGE_BYTES_PER_USER = 16 * 1024 * 1024; // 16 MiB
export const USAGE_LIMIT_CNY_24H = 2.0; // 2.00 CNY per 24 hours

// DeepSeek Pricing (CNY per 1M tokens)
export const DEEPSEEK_CACHE_MISS_PRICE_PER_M = 2.0; // 2.00 CNY / 1M
export const DEEPSEEK_CACHE_HIT_PRICE_PER_M = 0.5; // 0.50 CNY / 1M
export const DEEPSEEK_OUTPUT_PRICE_PER_M = 8.0; // 8.00 CNY / 1M

function getEnv(): Record<string, any> {
  const g = globalThis as any;
  if (g.__CF_ENV__) return g.__CF_ENV__;
  if (g.process && g.process.env) return g.process.env;
  return {};
}

// In-memory fallback map if KV namespace is not yet provisioned in environment
const inMemoryStore = new Map<string, string>();

function getKV(env?: any): any {
  const e = env || getEnv();
  if (e && e.CHATJOEPT_KV) {
    return e.CHATJOEPT_KV;
  }
  // Safe fallback store for local dev / environments prior to binding
  return {
    async get(key: string, type?: string) {
      const val = inMemoryStore.get(key);
      if (!val) return null;
      if (type === "json") {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      }
      return val;
    },
    async put(key: string, value: string) {
      inMemoryStore.set(key, value);
    },
    async delete(key: string) {
      inMemoryStore.delete(key);
    },
  };
}

// -------------------------------------------------------------
// 1. 24-Hour Usage Tracking & Rate Limiting
// -------------------------------------------------------------

interface UsageRecord {
  timestamp: number;
  costCny: number;
  tokens: number;
}

interface UserUsageState {
  records: UsageRecord[];
}

export function calculateCostCny(usage: {
  promptTokens?: number;
  completionTokens?: number;
  promptCacheHitTokens?: number;
  promptCacheMissTokens?: number;
}): number {
  const hitTokens = usage.promptCacheHitTokens || 0;
  const missTokens =
    usage.promptCacheMissTokens !== undefined
      ? usage.promptCacheMissTokens
      : (usage.promptTokens || 0) - hitTokens;
  const outTokens = usage.completionTokens || 0;

  const inputCost =
    (Math.max(0, missTokens) * DEEPSEEK_CACHE_MISS_PRICE_PER_M +
      hitTokens * DEEPSEEK_CACHE_HIT_PRICE_PER_M) /
    1_000_000;
  const outputCost = (outTokens * DEEPSEEK_OUTPUT_PRICE_PER_M) / 1_000_000;

  return inputCost + outputCost;
}

export async function getUser24hUsage(
  email: string,
  env?: any
): Promise<{ currentCostCny: number; usagePercent: number }> {
  if (!email) return { currentCostCny: 0, usagePercent: 0 };
  const kv = getKV(env);
  const key = `usage:${email.toLowerCase()}`;
  const data: UserUsageState | null = await kv.get(key, "json");

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  if (!data || !Array.isArray(data.records)) {
    return { currentCostCny: 0, usagePercent: 0 };
  }

  // Filter only records within the last 24 hours
  const activeRecords = data.records.filter((r) => r.timestamp >= cutoff);
  const currentCostCny = activeRecords.reduce((sum, r) => sum + (r.costCny || 0), 0);
  const usagePercent = Math.min(
    100,
    Math.round((currentCostCny / USAGE_LIMIT_CNY_24H) * 100)
  );

  return { currentCostCny, usagePercent };
}

export async function checkUser24hAllowed(
  email: string,
  env?: any
): Promise<{ allowed: boolean; usagePercent: number }> {
  const { currentCostCny, usagePercent } = await getUser24hUsage(email, env);
  const allowed = currentCostCny < USAGE_LIMIT_CNY_24H;
  return { allowed, usagePercent };
}

export async function recordUserUsage(
  email: string,
  costCny: number,
  tokens: number,
  env?: any
): Promise<void> {
  if (!email || costCny <= 0) return;
  const kv = getKV(env);
  const key = `usage:${email.toLowerCase()}`;
  const data: UserUsageState | null = await kv.get(key, "json");

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  const existingRecords =
    data && Array.isArray(data.records)
      ? data.records.filter((r) => r.timestamp >= cutoff)
      : [];

  existingRecords.push({
    timestamp: now,
    costCny,
    tokens,
  });

  await kv.put(
    key,
    JSON.stringify({ records: existingRecords }),
    { expirationTtl: 2 * 24 * 60 * 60 } // Retain for 48 hours
  );
}

// -------------------------------------------------------------
// 2. User Dialogs & Server-side Cross-Device Sync
// -------------------------------------------------------------

export interface DialogMeta {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  sizeBytes: number;
}

export interface UserDialogsIndex {
  dialogs: DialogMeta[];
  totalBytes: number;
}

export async function getUserDialogsIndex(
  email: string,
  env?: any
): Promise<UserDialogsIndex> {
  if (!email) return { dialogs: [], totalBytes: 0 };
  const kv = getKV(env);
  const key = `user:${email.toLowerCase()}:index`;
  const index: UserDialogsIndex | null = await kv.get(key, "json");

  if (!index || !Array.isArray(index.dialogs)) {
    return { dialogs: [], totalBytes: 0 };
  }
  return index;
}

export async function getUserDialog(
  email: string,
  dialogId: string,
  env?: any
): Promise<ChatSession | null> {
  if (!email || !dialogId) return null;
  const kv = getKV(env);
  const key = `user:${email.toLowerCase()}:dialog:${dialogId}`;
  return kv.get(key, "json");
}

export async function getAllUserDialogs(
  email: string,
  env?: any
): Promise<ChatSession[]> {
  const index = await getUserDialogsIndex(email, env);
  if (!index.dialogs || index.dialogs.length === 0) return [];

  const kv = getKV(env);
  // Fetch dialogs in parallel
  const dialogPromises = index.dialogs.map(async (meta) => {
    const key = `user:${email.toLowerCase()}:dialog:${meta.id}`;
    const dialog: ChatSession | null = await kv.get(key, "json");
    return (
      dialog || {
        id: meta.id,
        title: meta.title,
        model: meta.model,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        messages: [],
      }
    );
  });

  return Promise.all(dialogPromises);
}

export async function saveUserDialog(
  email: string,
  dialog: ChatSession,
  env?: any
): Promise<{ success: boolean; error?: string }> {
  if (!email || !dialog || !dialog.id) {
    return { success: false, error: "Missing required dialog parameters" };
  }

  const kv = getKV(env);
  const index = await getUserDialogsIndex(email, env);

  const dialogKey = `user:${email.toLowerCase()}:dialog:${dialog.id}`;
  const existingIndex = index.dialogs.findIndex((d) => d.id === dialog.id);
  const isNew = existingIndex === -1;

  // Preserve existing shareId if not explicitly provided in passed dialog
  let effectiveShareId = dialog.shareId;
  if (!effectiveShareId && !isNew) {
    const existing: ChatSession | null = await kv.get(dialogKey, "json");
    if (existing?.shareId) {
      effectiveShareId = existing.shareId;
      dialog.shareId = effectiveShareId;
    }
  }

  const serialized = JSON.stringify(dialog);
  const sizeBytes = new TextEncoder().encode(serialized).length;

  const oldSizeBytes = isNew ? 0 : index.dialogs[existingIndex].sizeBytes || 0;
  const netBytesChange = sizeBytes - oldSizeBytes;

  // Check limit 1: Max 200 dialogs
  if (isNew && index.dialogs.length >= MAX_DIALOGS_PER_USER) {
    return {
      success: false,
      error: "Dialog limit reached. Please delete older dialogs to save new ones.",
    };
  }

  // Check limit 2: Max 16 MiB storage
  if (index.totalBytes + netBytesChange > MAX_STORAGE_BYTES_PER_USER) {
    return {
      success: false,
      error: "Storage capacity limit reached. Please delete older dialogs to free up space.",
    };
  }

  // 1. Save dialog key
  await kv.put(dialogKey, serialized);

  // If this dialog has been shared publicly, keep the shared link synced with all latest messages
  if (effectiveShareId) {
    const shareKey = `share:${effectiveShareId}`;
    const shared: SharedDialog = {
      id: effectiveShareId,
      title: dialog.title || "Shared chat",
      model: dialog.model || "jpt-6.1-sol",
      createdAt: dialog.createdAt || Date.now(),
      messages: dialog.messages || [],
    };
    await kv.put(shareKey, JSON.stringify(shared));
  }

  // 2. Update index
  const meta: DialogMeta = {
    id: dialog.id,
    title: dialog.title || "New chat",
    model: dialog.model || "jpt-6.1-sol",
    createdAt: dialog.createdAt || Date.now(),
    updatedAt: dialog.updatedAt || Date.now(),
    sizeBytes,
  };

  let updatedDialogs = [...index.dialogs];
  if (isNew) {
    updatedDialogs.unshift(meta);
  } else {
    updatedDialogs[existingIndex] = meta;
  }

  // Sort by updatedAt descending
  updatedDialogs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const updatedIndex: UserDialogsIndex = {
    dialogs: updatedDialogs,
    totalBytes: Math.max(0, index.totalBytes + netBytesChange),
  };

  const indexKey = `user:${email.toLowerCase()}:index`;
  await kv.put(indexKey, JSON.stringify(updatedIndex));

  return { success: true };
}

export async function deleteUserDialog(
  email: string,
  dialogId: string,
  env?: any
): Promise<{ success: boolean }> {
  if (!email || !dialogId) return { success: false };

  const kv = getKV(env);
  const index = await getUserDialogsIndex(email, env);

  const existingMeta = index.dialogs.find((d) => d.id === dialogId);
  const sizeToSubtract = existingMeta ? existingMeta.sizeBytes || 0 : 0;

  // 1. Delete dialog key
  const dialogKey = `user:${email.toLowerCase()}:dialog:${dialogId}`;
  await kv.delete(dialogKey);

  // 2. Update index
  const updatedDialogs = index.dialogs.filter((d) => d.id !== dialogId);
  const updatedIndex: UserDialogsIndex = {
    dialogs: updatedDialogs,
    totalBytes: Math.max(0, index.totalBytes - sizeToSubtract),
  };

  const indexKey = `user:${email.toLowerCase()}:index`;
  await kv.put(indexKey, JSON.stringify(updatedIndex));

  return { success: true };
}

export async function deleteAllUserData(
  email: string,
  env?: any
): Promise<{ success: boolean }> {
  if (!email) return { success: false };

  const kv = getKV(env);
  const index = await getUserDialogsIndex(email, env);

  // Delete all dialog keys
  for (const meta of index.dialogs) {
    const dialogKey = `user:${email.toLowerCase()}:dialog:${meta.id}`;
    await kv.delete(dialogKey);
  }

  // Delete index key
  const indexKey = `user:${email.toLowerCase()}:index`;
  await kv.delete(indexKey);

  return { success: true };
}

// -------------------------------------------------------------
// 3. User Percentage Quotas (No raw limits exposed)
// -------------------------------------------------------------

export async function getUserQuotas(
  email: string,
  env?: any
): Promise<{
  usagePercent: number;
  dialogsPercent: number;
  storagePercent: number;
}> {
  if (!email) {
    return { usagePercent: 0, dialogsPercent: 0, storagePercent: 0 };
  }

  const [usage, index] = await Promise.all([
    getUser24hUsage(email, env),
    getUserDialogsIndex(email, env),
  ]);

  const dialogsPercent = Math.min(
    100,
    Math.round((index.dialogs.length / MAX_DIALOGS_PER_USER) * 100)
  );

  const storagePercent = Math.min(
    100,
    Math.round((index.totalBytes / MAX_STORAGE_BYTES_PER_USER) * 100)
  );

  return {
    usagePercent: usage.usagePercent,
    dialogsPercent,
    storagePercent,
  };
}

// -------------------------------------------------------------
// 4. Public Shared Dialogs (No auth required)
// -------------------------------------------------------------

export interface SharedDialog {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  messages: Message[];
}

export async function createSharedDialog(
  dialog: ChatSession,
  env?: any
): Promise<string> {
  const kv = getKV(env);
  // Reuse existing shareId if already shared, or generate a clean unique identifier
  const shareId =
    dialog.shareId || `sh_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

  const shared: SharedDialog = {
    id: shareId,
    title: dialog.title || "Shared chat",
    model: dialog.model || "jpt-6.1-sol",
    createdAt: dialog.createdAt || Date.now(),
    messages: dialog.messages || [],
  };

  const key = `share:${shareId}`;
  await kv.put(key, JSON.stringify(shared));

  return shareId;
}

export async function getSharedDialog(
  shareId: string,
  env?: any
): Promise<SharedDialog | null> {
  if (!shareId) return null;
  const kv = getKV(env);
  const key = `share:${shareId}`;
  return kv.get(key, "json");
}
