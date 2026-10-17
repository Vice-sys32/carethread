import { Badge, type BadgeTone } from "@/components/ui/badge";
import { RECORD_TYPE_LABELS } from "@/lib/utils";
import type { RecordType } from "@/types";

const toneFor: Record<RecordType, BadgeTone> = {
  visit: "accent",
  prescription: "leaf",
  lab_report: "warning",
  vaccine: "success",
  imaging: "slate",
  other: "neutral",
};

export function RecordBadge({ type }: { type: RecordType }) {
  return (
    <Badge tone={toneFor[type]} dot>
      {RECORD_TYPE_LABELS[type]}
    </Badge>
  );
}
