export type BranchContextStatus =
  | "UNRESOLVED"
  | "VALIDATING"
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
