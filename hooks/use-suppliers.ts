import { useCallback, useEffect, useState } from "react";
import { useErp } from "@/contexts/erp-context";
import type { Supplier, PurchaseOrder, SupplierConsignment, SupplierDocument } from "@/lib/types";
import type { ListQuery, PaginatedResult } from "@/lib/repositories/interfaces";

export function useSuppliers(initialQuery: ListQuery = { page: 1, pageSize: 25 }) {
  const { supplierRepository, suppliers: rawSuppliers } = useErp();
  const [data, setData] = useState<PaginatedResult<Supplier>>({
    items: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ListQuery>(initialQuery);

  const fetchSuppliers = useCallback(async (q: ListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supplierRepository.list(q);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const fetchAllMatching = useCallback(async () => {
    const firstPage = await supplierRepository.list({ ...query, page: 1, pageSize: 250 });
    if (firstPage.total === 0) return [];

    const rows = [...firstPage.items];
    const totalPages = Math.max(firstPage.totalPages, Math.ceil(firstPage.total / firstPage.pageSize), 1);

    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      const nextPage = await supplierRepository.list({ ...query, page: pageNumber, pageSize: firstPage.pageSize });
      rows.push(...nextPage.items);
    }

    return rows.slice(0, firstPage.total);
  }, [supplierRepository, query]);

  useEffect(() => {
    fetchSuppliers(query);
  }, [query, fetchSuppliers, rawSuppliers]);

  return {
    ...data,
    loading,
    error,
    query,
    setQuery,
    refresh: () => fetchSuppliers(query),
    fetchAllMatching,
  };
}

export function useSupplier(id: string | undefined) {
  const { supplierRepository, suppliers: rawSuppliers } = useErp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [consignments, setConsignments] = useState<SupplierConsignment[]>([]);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const sup = await supplierRepository.getById(id);
      setSupplier(sup);
      if (sup) {
        const poList = await supplierRepository.getPurchaseOrders(id);
        setPurchaseOrders(poList);
        const consList = await supplierRepository.getConsignments(id);
        setConsignments(consList);
        const docList = await supplierRepository.getDocuments(id);
        setDocuments(docList);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch supplier details");
    } finally {
      setLoading(false);
    }
  }, [id, supplierRepository]);

  useEffect(() => {
    fetchSupplierDetails();
  }, [fetchSupplierDetails, rawSuppliers]);

  return {
    supplier,
    purchaseOrders,
    consignments,
    documents,
    loading,
    error,
    refresh: fetchSupplierDetails,
  };
}

export function useSupplierMutations() {
  const { supplierRepository } = useErp();
  const [loading, setLoading] = useState(false);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, "id"> & Partial<Pick<Supplier, "id">>) => {
    setLoading(true);
    try {
      return await supplierRepository.create(supplier);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    setLoading(true);
    try {
      return await supplierRepository.update(id, updates);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const deactivateSupplier = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    try {
      return await supplierRepository.deactivate(id, reason);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const reactivateSupplier = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await supplierRepository.reactivate(id);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const deleteSupplier = useCallback(async (id: string) => {
    setLoading(true);
    try {
      return await supplierRepository.delete(id);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const uploadDocument = useCallback(async (supplierId: string, name: string, type: string, expiryDate: string, file: File) => {
    setLoading(true);
    try {
      return await supplierRepository.uploadDocument(supplierId, name, type, expiryDate, file);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  const deleteDocument = useCallback(async (supplierId: string, docId: string) => {
    setLoading(true);
    try {
      return await supplierRepository.deleteDocument(supplierId, docId);
    } finally {
      setLoading(false);
    }
  }, [supplierRepository]);

  return {
    loading,
    addSupplier,
    updateSupplier,
    deactivateSupplier,
    reactivateSupplier,
    deleteSupplier,
    uploadDocument,
    deleteDocument,
  };
}
