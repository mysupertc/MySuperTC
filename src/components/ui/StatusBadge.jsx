import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-800",
  in_progress: "clay-accent-blue text-blue-700",
  overdue: "bg-red-100 text-red-700",
  waived: "bg-gray-100 text-gray-700",
  negotiating: "bg-orange-100 text-orange-700",
  extended: "bg-yellow-100 text-yellow-700",
  pending: "bg-blue-100 text-blue-700",
  default: "bg-gray-100 text-gray-700",
};

export default function StatusBadge({ status, completed }) {
  const normalized = status?.toLowerCase() || "default";

  // Completed tasks always look greyed out
  const style = completed
    ? "bg-gray-100 text-gray-500 opacity-60"
    : STATUS_STYLES[normalized] || STATUS_STYLES.default;

  return (
    <Badge className={`clay-element border-0 ${style}`}>
      {completed ? "Completed" : status?.replace("_", " ") || "Unknown"}
    </Badge>
  );
}