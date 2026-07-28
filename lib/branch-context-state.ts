export type BranchContextStatus =
  | "UNRESOLVED"
  | "VALIDATING"
  | "TRANSITIONING"
  | "READY"
  | "SETUP_REQUIRED"
  | "SELECTION_REQUIRED"
  | "INVALID"
  | "ERROR";

export type BranchCandidate = {
  id: string;
  name: string;
  isActive: boolean;
};

export type BranchContextState = {
  status: BranchContextStatus;
  branchId: string | null;
  branch: BranchCandidate | null;
  generation: number;
};

export const initialBranchContextState: BranchContextState = {
  status: "UNRESOLVED",
  branchId: null,
  branch: null,
  generation: 0,
};

/**
 * A Branch selection is an explicit non-ready boundary. Consumers must stop
 * issuing Branch-scoped work before the old client accessor is retired.
 */
export function beginBranchTransition(
  current: BranchContextState,
  generation: number,
): BranchContextState {
  return {
    status: "TRANSITIONING",
    branchId: null,
    branch: null,
    generation: Math.max(current.generation, generation) + 1,
  };
}

export function isBranchContextReady(state: Pick<BranchContextState, "status" | "branchId">): boolean {
  return state.status === "READY" && Boolean(state.branchId);
}

/** Branch-scoped queries carry a concrete Branch discriminator, never "none". */
export function isBranchScopedQueryKey(queryKey: readonly unknown[]): boolean {
  const branchMarker = queryKey.indexOf("branch");
  if (branchMarker < 0) return false;
  const branchId = queryKey[branchMarker + 1];
  return typeof branchId === "string" && branchId.length > 0 && branchId !== "none" && branchId !== "required";
}

/**
 * A stored Branch is only a candidate. A branch becomes operational after it
 * appears as active in the current server response; this helper never chooses
 * the first item from a multi-Branch result.
 */
export function resolveBranchContext(
  branches: BranchCandidate[],
  candidateId: string | null | undefined,
  generation: number,
  fixedBranchId?: string | null,
): BranchContextState {
  const active = branches.filter((branch) => branch.isActive);
  if (active.length === 0) {
    return { status: "SETUP_REQUIRED", branchId: null, branch: null, generation: generation + 1 };
  }

  const requestedId = fixedBranchId || candidateId || null;
  const selected = requestedId ? active.find((branch) => branch.id === requestedId) ?? null : null;
  if (selected) {
    return { status: "READY", branchId: selected.id, branch: selected, generation: generation + 1 };
  }

  if (fixedBranchId || candidateId) {
    return { status: "INVALID", branchId: null, branch: null, generation: generation + 1 };
  }

  if (active.length === 1) {
    return { status: "READY", branchId: active[0].id, branch: active[0], generation: generation + 1 };
  }

  return { status: "SELECTION_REQUIRED", branchId: null, branch: null, generation: generation + 1 };
}
