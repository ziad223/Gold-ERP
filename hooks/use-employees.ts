import { useCallback, useEffect, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import { OPERATOR_LIFECYCLE_EVENT } from "@/contexts/operator-context";
import type { Employee, EmployeeOperationalSessionHistory, EmployeeSession } from "@/lib/types";
import type { ListQuery, PaginatedResult } from "@/lib/repositories/interfaces";

export function useEmployees(initialQuery: ListQuery = { page: 1, pageSize: 25 }) {
  const { employeeRepository, employees: rawEmployees } = useErp();
  const [data, setData] = useState<PaginatedResult<Employee>>({
    items: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ListQuery>(initialQuery);

  const fetchEmployees = useCallback(async (q: ListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await employeeRepository.list(q);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, [employeeRepository]);

  useEffect(() => {
    fetchEmployees(query);
  }, [query, fetchEmployees, rawEmployees]);

  return {
    ...data,
    loading,
    error,
    query,
    setQuery,
    refresh: () => fetchEmployees(query),
  };
}

export function useEmployee(id: string | undefined) {
  const { employeeRepository, employees: rawEmployees } = useErp();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sessions, setSessions] = useState<EmployeeSession[]>([]);
  const [operatorSessions, setOperatorSessions] = useState<EmployeeOperationalSessionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await employeeRepository.getById(id);
      setEmployee(emp);
      if (emp) {
        const [sesList, opSessions] = await Promise.allSettled([
          employeeRepository.getSessions(id),
          employeeRepository.getOperatorSessions(id, { page: 1, pageSize: 25 }),
        ]);
        setSessions(sesList.status === "fulfilled" ? sesList.value : []);
        setOperatorSessions(opSessions.status === "fulfilled" ? opSessions.value.items : []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  }, [id, employeeRepository]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails, rawEmployees]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshOnOperatorLifecycle = () => {
      void fetchEmployeeDetails();
    };
    window.addEventListener(OPERATOR_LIFECYCLE_EVENT, refreshOnOperatorLifecycle);
    return () => window.removeEventListener(OPERATOR_LIFECYCLE_EVENT, refreshOnOperatorLifecycle);
  }, [fetchEmployeeDetails]);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!id) return { success: false };
    const res = await employeeRepository.revokeSession(id, sessionId);
    if (res.success) {
      fetchEmployeeDetails();
    }
    return res;
  }, [id, employeeRepository, fetchEmployeeDetails]);

  return {
    employee,
    sessions,
    operatorSessions,
    loading,
    error,
    revokeSession,
    refresh: fetchEmployeeDetails,
  };
}

export function useEmployeeAuthorization(id: string | undefined) {
  const { employeeRepository } = useErp();
  const [branchAccess, setBranchAccess] = useState<any[]>([]);
  const [permissionState, setPermissionState] = useState<any>(null);
  const [verificationAttempts, setVerificationAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAuthorization = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [branches, permissions, attempts] = await Promise.allSettled([
        employeeRepository.getBranchAccess(id),
        employeeRepository.getPermissionState(id),
        employeeRepository.getVerificationAttempts(id, { page: 1, pageSize: 25 }),
      ]);
      if (branches.status === "fulfilled") setBranchAccess(branches.value);
      if (permissions.status === "fulfilled") setPermissionState(permissions.value);
      if (attempts.status === "fulfilled") setVerificationAttempts(attempts.value.items);
    } finally {
      setLoading(false);
    }
  }, [id, employeeRepository]);

  useEffect(() => {
    refreshAuthorization();
  }, [refreshAuthorization]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshOnOperatorLifecycle = () => {
      void refreshAuthorization();
    };
    window.addEventListener(OPERATOR_LIFECYCLE_EVENT, refreshOnOperatorLifecycle);
    return () => window.removeEventListener(OPERATOR_LIFECYCLE_EVENT, refreshOnOperatorLifecycle);
  }, [refreshAuthorization]);

  const emitEmployeeAuthorizationLifecycle = useCallback((event: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(OPERATOR_LIFECYCLE_EVENT, { detail: { event, employeeId: id, at: Date.now() } }));
  }, [id]);

  const resetCredential = useCallback(async (pin: string, resetRequired = false) => {
    if (!id) return { success: false };
    const result = await employeeRepository.resetCredential(id, pin, resetRequired);
    await refreshAuthorization();
    emitEmployeeAuthorizationLifecycle("employee:credential-reset");
    return result;
  }, [id, employeeRepository, emitEmployeeAuthorizationLifecycle, refreshAuthorization]);

  const updateBranches = useCallback(async (branchIds: string[]) => {
    if (!id) return { success: false };
    const result = await employeeRepository.updateBranchAccess(id, branchIds);
    await refreshAuthorization();
    emitEmployeeAuthorizationLifecycle("employee:branch-access-updated");
    return result;
  }, [id, employeeRepository, emitEmployeeAuthorizationLifecycle, refreshAuthorization]);

  const updatePermissions = useCallback(async (input: { roleIds: string[]; grantPermissionIds: string[]; denialPermissionIds: string[] }) => {
    if (!id) return { success: false };
    const result = await employeeRepository.updatePermissionState(id, input);
    await refreshAuthorization();
    emitEmployeeAuthorizationLifecycle("employee:permissions-updated");
    return result;
  }, [id, employeeRepository, emitEmployeeAuthorizationLifecycle, refreshAuthorization]);

  return { branchAccess, permissionState, verificationAttempts, loading, refreshAuthorization, resetCredential, updateBranches, updatePermissions };
}

export function useEmployeeMutations() {
  const { employeeRepository } = useErp();
  const [loading, setLoading] = useState(false);

  const addEmployee = useCallback(async (employee: Employee) => {
    setLoading(true);
    try {
      return await employeeRepository.create(employee);
    } finally {
      setLoading(false);
    }
  }, [employeeRepository]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setLoading(true);
    try {
      return await employeeRepository.update(id, updates);
    } finally {
      setLoading(false);
    }
  }, [employeeRepository]);

  const deactivateEmployee = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    try {
      return await employeeRepository.deactivate(id, reason);
    } finally {
      setLoading(false);
    }
  }, [employeeRepository]);

  const reactivateEmployee = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await employeeRepository.reactivate(id);
    } finally {
      setLoading(false);
    }
  }, [employeeRepository]);

  return {
    loading,
    addEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
  };
}
