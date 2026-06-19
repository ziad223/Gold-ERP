import { useCallback, useEffect, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import type { Employee, EmployeeSession } from "@/lib/types";
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
        const sesList = await employeeRepository.getSessions(id);
        setSessions(sesList);
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
    loading,
    error,
    revokeSession,
    refresh: fetchEmployeeDetails,
  };
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
