"use client";

import { apiClient, generateUUID } from "@/lib/api/client";
import type { GoldPurchaseApprovalRequest, GoldPurchaseDraft } from "@/lib/types";

export type GoldPurchaseDraftKind = "cgp" | "igp";

export interface GoldPurchaseDraftList {
  items: GoldPurchaseDraft[];
  pagination: { total: number; page: number; limit: number; pages: number };
  filters: Record<string, unknown>;
}

export interface GoldPurchaseApprovalList {
  items: GoldPurchaseApprovalRequest[];
  pagination: { total: number; page: number; limit: number; pages: number };
  filters: Record<string, unknown>;
}

const base = (kind: GoldPurchaseDraftKind) => `/gold-purchases/${kind}/drafts`;

export async function listGoldPurchaseDrafts(kind: GoldPurchaseDraftKind, query: URLSearchParams, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraftList }>(`${base(kind)}?${query.toString()}`, { locale });
}

export async function createGoldPurchaseDraft(kind: GoldPurchaseDraftKind, payload: unknown, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraft }>(base(kind), {
    method: "POST", body: JSON.stringify(payload), idempotencyKey: generateUUID(), locale,
  });
}

export async function updateGoldPurchaseDraft(kind: GoldPurchaseDraftKind, id: string, payload: unknown, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraft }>(`${base(kind)}/${encodeURIComponent(id)}`, {
    method: "PATCH", body: JSON.stringify(payload), locale,
  });
}

export async function validateGoldPurchaseDraft(kind: GoldPurchaseDraftKind, draft: GoldPurchaseDraft, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraft }>(`${base(kind)}/${encodeURIComponent(draft.id)}/validate`, {
    method: "POST", body: JSON.stringify({ version: draft.version }), idempotencyKey: generateUUID(), locale,
  });
}

export async function voidGoldPurchaseDraft(kind: GoldPurchaseDraftKind, draft: GoldPurchaseDraft, reason: string, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraft }>(`${base(kind)}/${encodeURIComponent(draft.id)}/void`, {
    method: "POST", body: JSON.stringify({ version: draft.version, reason }), idempotencyKey: generateUUID(), locale,
  });
}

export async function submitGoldPurchaseDraft(kind: GoldPurchaseDraftKind, draft: GoldPurchaseDraft, locale: string) {
  return apiClient<{ success: true; data: { document: GoldPurchaseDraft; approvalRequest: GoldPurchaseApprovalRequest } }>(`${base(kind)}/${encodeURIComponent(draft.id)}/submit`, {
    method: "POST", body: JSON.stringify({ version: draft.version }), idempotencyKey: generateUUID(), locale,
  });
}

export async function reviewGoldPurchaseDraft(kind: GoldPurchaseDraftKind, documentId: string, documentVersion: number, approvalVersion: number, decision: "approve" | "reject", reason: string | null, locale: string) {
  return apiClient<{ success: true; data: { document: GoldPurchaseDraft; approvalRequest: GoldPurchaseApprovalRequest } }>(`${base(kind)}/${encodeURIComponent(documentId)}/${decision}`, {
    method: "POST", body: JSON.stringify({ version: documentVersion, approvalVersion, reason }), idempotencyKey: generateUUID(), locale,
  });
}

export async function createGoldPurchaseRevision(kind: GoldPurchaseDraftKind, draft: GoldPurchaseDraft, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseDraft }>(`${base(kind)}/${encodeURIComponent(draft.id)}/revisions`, {
    method: "POST", body: JSON.stringify({ version: draft.version }), idempotencyKey: generateUUID(), locale,
  });
}

export async function listGoldPurchaseApprovals(query: URLSearchParams, locale: string) {
  return apiClient<{ success: true; data: GoldPurchaseApprovalList }>(`/gold-purchases/approvals?${query.toString()}`, { locale });
}
