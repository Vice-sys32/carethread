"use client";

import { useState } from "react";
import { LuDownload, LuFileText, LuPill, LuTriangleAlert } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { RECORD_TYPE_LABELS, SOURCE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RecordBadge } from "./record-badge";
import { Badge } from "@/components/ui/badge";
import type { MedicalRecord } from "@/types";

interface RecordDetailDrawerProps {
  record: MedicalRecord | null;
  onClose: () => void;
  showFile?: boolean;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line/60 last:border-b-0">
      <dt className="w-28 shrink-0 text-xs font-semibold text-secondary">{label}</dt>
      <dd className="min-w-0 text-right text-xs sm:text-sm text-ink">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-leaf" aria-hidden="true" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-forest-dark">{children}</h3>
      <div className="h-px flex-1 bg-line/80" />
    </div>
  );
}

export function RecordDetailDrawer({ record, onClose, showFile = false }: RecordDetailDrawerProps) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!record) return;
    setDownloading(true);
    try {
      const blob = await api.patient.getFile(record.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.file_name ?? "record";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Could not download the file.", "danger");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Drawer
      open={!!record}
      onClose={onClose}
      title={record?.title ?? "Record details"}
      description={record ? `${RECORD_TYPE_LABELS[record.type]} · ${formatDate(record.record_date)}` : undefined}
      width="lg"
      footer={
        showFile && record?.has_file ? (
          <Button variant="primary" size="sm" loading={downloading} onClick={download} className="gap-2">
            <LuDownload aria-hidden className="size-4" />
            <span>Download file</span>
          </Button>
        ) : null
      }
    >
      {record ? (
        <div className="flex flex-col gap-1">
          <dl className="rounded-card border border-line bg-app/30 p-4">
            <DetailRow label="Date">{formatDate(record.record_date)}</DetailRow>
            <DetailRow label="Type">
              <RecordBadge type={record.type} />
            </DetailRow>
            <DetailRow label="Hospital">{record.hospital_name}</DetailRow>
            <DetailRow label="Doctor">{record.doctor_name}</DetailRow>
            {record.diagnosis ? (
              <DetailRow label="Diagnosis">
                <span className="font-semibold text-forest-dark">{record.diagnosis}</span>
              </DetailRow>
            ) : null}
            <DetailRow label="Source">
              <span className="text-xs text-muted">{SOURCE_LABELS[record.source]}</span>
            </DetailRow>
          </dl>

          {record.remarks ? (
            <div>
              <SectionTitle>Clinical Remarks</SectionTitle>
              <div className="rounded-input border border-line bg-surface p-3.5 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line">
                {record.remarks}
              </div>
            </div>
          ) : null}

          {record.medications.length > 0 ? (
            <div>
              <SectionTitle>Prescribed Medications</SectionTitle>
              <ul className="flex flex-col gap-2">
                {record.medications.map((medication) => (
                  <li key={medication.id} className="rounded-input border border-line bg-surface p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-ink flex items-center gap-1.5">
                        <LuPill className="size-3.5 text-leaf" />
                        <span>{medication.name}</span>
                        <span className="font-normal text-forest text-xs">{medication.dose}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-secondary">{medication.frequency}</p>
                    </div>
                    <Badge tone={medication.status === "current" ? "leaf" : "neutral"} className="text-[10px]">
                      {medication.status === "current" ? "Active" : "Past"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {record.key_values.length > 0 ? (
            <div>
              <SectionTitle>Clinical & Lab Key Values</SectionTitle>
              <div className="overflow-hidden rounded-input border border-line bg-surface shadow-subtle">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <tbody>
                    {record.key_values.map((item, index) => (
                      <tr key={`${item.label}-${index}`} className="border-b border-line last:border-b-0 hover:bg-mint/20">
                        <td className="px-3.5 py-2.5 font-medium text-secondary">{item.label}</td>
                        <td className="px-3.5 py-2.5 font-mono text-right font-semibold text-forest-dark tabular-nums">{item.value}</td>
                        <td className="px-3 py-2.5 text-left text-xs text-muted w-16">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {record.extracted_fields && record.extracted_fields.length > 0 ? (
            <div>
              <SectionTitle>Automated Extraction Details</SectionTitle>
              <ul className="flex flex-col gap-1.5 rounded-card border border-line bg-app/20 p-3">
                {record.extracted_fields.map((field) => (
                  <li key={field.field} className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 last:border-b-0 text-xs">
                    <span className="font-medium text-secondary">{field.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">{field.value}</span>
                      {field.confidence < 0.7 ? (
                        <LuTriangleAlert aria-hidden className="size-3.5 text-warning shrink-0" />
                      ) : null}
                      <span className="font-mono text-[11px] tabular-nums text-muted bg-surface px-1.5 py-0.5 rounded border border-line">
                        {Math.round(field.confidence * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {record.has_file ? (
            <div>
              <SectionTitle>Attached Medical Document</SectionTitle>
              <div className="flex items-center gap-3 rounded-input border border-line bg-surface p-3">
                <div className="flex size-9 items-center justify-center rounded bg-mint text-forest shrink-0">
                  <LuFileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-semibold text-ink">{record.file_name ?? "Medical document"}</p>
                  {record.file_size ? <p className="text-[11px] text-muted">{formatBytes(record.file_size)}</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
