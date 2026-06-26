"use client";

import { Award, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AssetCertificate } from "@/lib/types";

interface CertificatePanelProps {
  certificates?: AssetCertificate[];
  onAddCertificate: (certNumber: string, type: string, issuer: string, date: string) => void;
  onRemoveCertificate: (id: string) => void;
}

export function CertificatePanel({
  certificates = [],
  onAddCertificate,
  onRemoveCertificate,
}: CertificatePanelProps) {
  const t = useTranslations("AssetDetails");
  const [showAdd, setShowAdd] = useState(false);
  const [certNumber, setCertNumber] = useState("");
  const [certType, setCertType] = useState("GIA");
  const [issuer, setIssuer] = useState("GIA International");
  const [issueDate, setIssueDate] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNumber.trim() || !issuer.trim()) return;
    const date = issueDate || new Date().toISOString().slice(0, 10);
    onAddCertificate(certNumber.trim(), certType, issuer.trim(), date);
    setCertNumber("");
    setIssueDate("");
    setShowAdd(false);
  };

  return (
    <div className="rounded-2xl border border-border p-4 bg-panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
          <Award className="h-4 w-4 text-gold-500" />
          {t("certificate")}
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3" />
          {t("addCertificate")}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 dark:bg-navy-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">{t("certNumber")}</label>
            <input
              type="text"
              required
              className="input-base text-xs h-8 py-1 px-2"
              placeholder="e.g. GIA-1234567890"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">{t("certType")}</label>
            <select
              className="input-base text-xs h-8 py-1 px-2"
              value={certType}
              onChange={(e) => {
                setCertType(e.target.value);
                setIssuer(e.target.value === "GIA" ? "GIA International" : "IGI Worldwide");
              }}
            >
              <option value="GIA">GIA</option>
              <option value="IGI">IGI</option>
              <option value="HRD">HRD</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">{t("certIssuer")}</label>
            <input
              type="text"
              required
              className="input-base text-xs h-8 py-1 px-2"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">{t("certDate")}</label>
            <input
              type="date"
              className="input-base text-xs h-8 py-1 px-2"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="secondary" type="button" onClick={() => setShowAdd(false)}>
              {t("cancel")}
            </Button>
            <Button size="sm" type="submit">
              {t("add")}
            </Button>
          </div>
        </form>
      )}

      {certificates.length === 0 ? (
        <p className="text-center text-[10px] text-slate-400 py-3">{t("noCertificates")}</p>
      ) : (
        <ul className="divide-y divide-border text-xs">
          {certificates.map((cert) => (
            <li key={cert.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-foreground">{cert.type}</span>
                  <span className="font-mono text-slate-400 font-bold">· {cert.certificateNumber}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {cert.issuer} · {cert.issueDate}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={cert.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-foreground transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveCertificate(cert.id)}
                  className="p-1 text-rose-500 hover:text-rose-700 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
