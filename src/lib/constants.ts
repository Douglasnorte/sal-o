import type { AppointmentStatus, PaymentMethod } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  DONE: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Faltou",
};

export const STATUS_STYLES: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "#eef2ff", border: "#a5b4fc", text: "#3730a3" },
  CONFIRMED: { bg: "#e0f2fe", border: "#7dd3fc", text: "#075985" },
  IN_PROGRESS: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  DONE: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
  CANCELED: { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280" },
  NO_SHOW: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  PIX: "Pix",
  OTHER: "Outro",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const AGENDA_START_HOUR = 7;
export const AGENDA_END_HOUR = 21;
export const SLOT_MINUTES = 30;
