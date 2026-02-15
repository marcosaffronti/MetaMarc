import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgente": return "text-red-600 bg-red-50 border-red-200";
    case "alta": return "text-orange-600 bg-orange-50 border-orange-200";
    case "media": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "baja": return "text-green-600 bg-green-50 border-green-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "activa":
    case "completada":
      return "text-green-600 bg-green-50 border-green-200";
    case "en_progreso":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "pausada":
    case "pendiente":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "finalizada":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "cancelada":
      return "text-red-600 bg-red-50 border-red-200";
    case "borrador":
      return "text-purple-600 bg-purple-50 border-purple-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    activa: "Activa",
    pausada: "Pausada",
    finalizada: "Finalizada",
    borrador: "Borrador",
    pendiente: "Pendiente",
    en_progreso: "En Progreso",
    completada: "Completada",
    cancelada: "Cancelada",
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    urgente: "Urgente",
  };
  return labels[priority] || priority;
}
