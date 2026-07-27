"use client";

import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

type Status = "pending" | "downloading" | "completed" | "error";

interface BadgeProps {
  status: Status;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<
  Status,
  { icon: typeof CheckCircle; color: string; bg: string; label: string }
> = {
  pending: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100", label: "Pending" },
  downloading: {
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Downloading",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Completed",
  },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Error" },
};

export default function Badge({ status, showLabel = true, className = "" }: BadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const isSpinner = status === "downloading";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} ${className}`}
    >
      <Icon
        className={`w-3 h-3 ${isSpinner ? "animate-spin" : ""}`}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
