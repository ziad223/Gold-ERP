import { useCallback, useEffect, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import type { Customer, CustomerTier } from "@/lib/types";
import type { ListQuery, PaginatedResult } from "@/lib/repositories/interfaces";

export function useCustomers(initialQuery: ListQuery = { page: 1, pageSize: 25 }) {
  const { customerRepository, customers: rawCustomers } = useErp();
  const [data, setData] = useState<PaginatedResult<Customer>>({
    items: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ListQuery>(initialQuery);

  const fetchCustomers = useCallback(async (q: ListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerRepository.list(q);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  const fetchAllMatching = useCallback(async () => {
    const firstPage = await customerRepository.list({ ...query, page: 1, pageSize: 250 });
    if (firstPage.total === 0) return [];

    const rows = [...firstPage.items];
    const totalPages = Math.max(firstPage.totalPages, Math.ceil(firstPage.total / firstPage.pageSize), 1);

    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      const nextPage = await customerRepository.list({ ...query, page: pageNumber, pageSize: firstPage.pageSize });
      rows.push(...nextPage.items);
    }

    return rows.slice(0, firstPage.total);
  }, [customerRepository, query]);

  useEffect(() => {
    fetchCustomers(query);
  }, [query, fetchCustomers, rawCustomers]); // rawCustomers dependency ensures UI updates instantly on local mutations

  return {
    ...data,
    loading,
    error,
    query,
    setQuery,
    refresh: () => fetchCustomers(query),
    fetchAllMatching,
  };
}

export function useCustomer(id: string | undefined) {
  const { customerRepository, customers: rawCustomers } = useErp();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await customerRepository.getById(id);
      setCustomer(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch customer");
    } finally {
      setLoading(false);
    }
  }, [id, customerRepository]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer, rawCustomers]);

  const calculateStatement = useCallback(async () => {
    if (!id) return null;
    return customerRepository.calculateStatement(id);
  }, [id, customerRepository]);

  return {
    customer,
    loading,
    error,
    calculateStatement,
    refresh: fetchCustomer,
  };
}

export function useCustomerMutations() {
  const { customerRepository } = useErp();
  const [loading, setLoading] = useState(false);

  const addCustomer = useCallback(async (customer: Omit<Customer, "id"> & Partial<Pick<Customer, "id">>) => {
    setLoading(true);
    try {
      return await customerRepository.create(customer);
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    setLoading(true);
    try {
      return await customerRepository.update(id, updates);
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  const deactivateCustomer = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    try {
      return await customerRepository.deactivate(id, reason);
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  const reactivateCustomer = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await customerRepository.reactivate(id);
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  const deleteCustomer = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await customerRepository.delete(id);
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  return {
    loading,
    addCustomer,
    updateCustomer,
    deactivateCustomer,
    reactivateCustomer,
    deleteCustomer,
  };
}
