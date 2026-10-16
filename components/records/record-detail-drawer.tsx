"use client";

import { useState } from "react";
import { LuDownload, LuTriangleAlert } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { RECORD_TYPE_LABELS, SOURCE_LABELS, formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RecordBadge } from "./record-badge";
import type { MedicalRecord } from "@/types";

interface RecordDetailDrawerProps {
  record: MedicalRecord | null;
  onClose: () => void;
  showFile?: boolean;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5">
      <dt className="w-32 shrink-0 text-xs font-medium text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 mb-2 text-xs font-medium text-secondary">{children}</h3>;
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
      title={record?.title ?? ""}
      description={record ? `${RECORD_TYPE_LABELS[record.type]} · ${formatDate(record.record_date)}` : undefined}
      footer={
        showFile && record?.has_file ? (
          <Button variant="secondary" size="sm" loading={downloading} onClick={download}>
            <LuDownload aria-hidden className="size-3.5" />
            Download file
          </Button>
        ) : null
      }
    >
      {record ? (
        <div>
          <dl>
            <DetailRow label="Date">{formatDate(record.record_date)}</DetailRow>
            <DetailRow label="Type">
              <RecordBadge type={record.type} />
            </DetailRow>
            <DetailRow label="Hospital">{record.hospital_name}</DetailRow>
            <DetailRow label="Doctor">{record.doctor_name}</DetailRow>
            {record.diagnosis ? <DetailRow label="Diagnosis">{record.diagnosis}</DetailRow> : null}
            <DetailRow label="Source">{SOURCE_LABELS[record.source]}</DetailRow>
          </dl>

          {record.remarks ? (
            <div>
              <SectionTitle>Remarks</SectionTitle>
              <p className="whitespace-pre-line text-sm text-ink">{record.remarks}</p>
            </div>
          ) : null}

          {record.medications.length > 0 ? (
            <div>
              <SectionTitle>Medications</SectionTitle>
              <ul className="flex flex-col gap-1.5">
                {record.medications.map((medication) => (
                  <li key={medication.id} className="rounded-input border border-line px-3 py-2">
                    <p className="text-sm text-ink">
                      {medication.name} <span className="text-secondary">{medication.dose}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {medication.frequency}
                      {medication.status === "current" ? " · Current" : " · Past"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {record.key_values.length > 0 ? (
            <div>
              <SectionTitle>Key values</SectionTitle>
              <div className="overflow-hidden rounded-input border border-line">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {record.key_values.map((item, index) => (
                      <tr key={`${item.label}-${index}`} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-2 text-secondary">{item.label}</td>
                        <td className="px-3 py-2 font-mono text-right tabular-nums">{item.value}</td>
                        <td className="px-3 py-2 pl-1 text-xs text-muted">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {record.extracted_fields && record.extracted_fields.length > 0 ? (
            <div>
              <SectionTitle>Extracted fields</SectionTitle>
              <ul className="flex flex-col gap-1">
                {record.extracted_fields.map((field) => (
                  <li key={field.field} className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
                    <span className="text-[13px] text-secondary">{field.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] text-ink">{field.value}</span>
                      {field.confidence < 0.7 ? (
                        <LuTriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
                      ) : null}
                      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
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
              <SectionTitle>File</SectionTitle>
              <p className="text-[13px] text-secondary">
                {record.file_name}
                {record.file_size ? ` · ${formatBytes(record.file_size)}` : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
