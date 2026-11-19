import {
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  Clock,
  Landmark,
  SkipForward,
  XCircle,
} from "lucide-react";
import type { VerificationStatus } from "@/lib/freshcheck/types";
import { STATUS_LABEL } from "@/lib/freshcheck/labels";
import { cn } from "@/lib/utils";

export const STATUS_STYLE: Record<VerificationStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  current: { cls: "bg-status-current-bg text-status-current", Icon: CheckCircle2 },
  partially_supported: { cls: "bg-status-partial-bg text-status-partial", Icon: CircleDashed },
  potentially_outdated: { cls: "bg-status-outdated-bg text-status-outdated", Icon: Clock },
  contradicted: { cls: "bg-status-contradicted-bg text-status-contradicted", Icon: XCircle },
  unverified: { cls: "bg-status-unverified-bg text-status-unverified", Icon: CircleHelp },
  stable: { cls: "bg-status-stable-bg text-status-stable", Icon: Landmark },
  skipped: { cls: "bg-muted text-muted-foreground", Icon: SkipForward },
};

export function StatusBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const { cls, Icon } = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", cls, className)}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
