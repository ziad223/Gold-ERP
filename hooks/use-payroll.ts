"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName?: string;
  period: string;
  baseSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  net: number;
  status: "draft" | "approved" | "paid";
  paidDate?: string;
  paymentMethod?: string;
  branch?: string;
}

export interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hours: number;
  status: "present" | "absent" | "leave" | "late" | "holiday";
}

const thisMonth = () => new Date().toISOString().slice(0, 7);

/**
 * Payroll & attendance hook (API mode).
 */
export function usePayroll(period = thisMonth()) {
  const locale = useLocale();
  const isApi = DATA_SOURCE === "api";
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    setLoading(true);
    setError(null);
    try {
      const [ps, att] = await Promise.all([
        apiClient<{ items: Payslip[] }>(`/payslips?period=${period}`, { locale }),
        apiClient<{ items: AttendanceRow[] }>("/attendance", { locale }),
      ]);
      setPayslips(ps.items ?? []);
      setAttendance(att.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [isApi, locale, period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generatePayroll = useCallback(async () => {
    const res = await apiClient<{ created: number }>("/payroll/generate", { method: "POST", body: JSON.stringify({ period }), locale });
    await refresh();
    return res;
  }, [locale, period, refresh]);

  const payPayslip = useCallback(
    async (id: string, paymentMethod = "Cash") => {
      const res = await apiClient<Payslip>(`/payslips/${id}/pay`, { method: "POST", body: JSON.stringify({ paymentMethod }), locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const checkIn = useCallback(
    async (employeeId: string) => {
      const res = await apiClient(`/attendance/check-in`, { method: "POST", body: JSON.stringify({ employeeId }), locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  const checkOut = useCallback(
    async (employeeId: string) => {
      const res = await apiClient(`/attendance/check-out`, { method: "POST", body: JSON.stringify({ employeeId }), locale });
      await refresh();
      return res;
    },
    [locale, refresh],
  );

  return { payslips, attendance, loading, error, refresh, generatePayroll, payPayslip, checkIn, checkOut };
}
