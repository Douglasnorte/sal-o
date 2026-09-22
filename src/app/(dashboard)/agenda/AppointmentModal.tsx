"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/format";
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  recordPayment,
} from "@/lib/actions/appointments";
import { createClient } from "@/lib/actions/clients";
import type {
  AppointmentWithPayment,
  ClientModel,
  ProfessionalWithHours,
  ServiceModel,
} from "@/types/domain";
import type { AppointmentStatus, PaymentMethod } from "@/generated/prisma/enums";

type Props = {
  mode: "create" | "edit";
  appointment?: AppointmentWithPayment;
  initialProfessionalId?: string;
  initialStart?: Date;
  clients: ClientModel[];
  services: ServiceModel[];
  professionals: ProfessionalWithHours[];
  onClose: () => void;
};

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const STATUS_FLOW: { status: AppointmentStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Confirmar" },
  { status: "IN_PROGRESS", label: "Iniciar atendimento" },
  { status: "NO_SHOW", label: "Marcar falta" },
];

export default function AppointmentModal({
  mode,
  appointment,
  initialProfessionalId,
  initialStart,
  clients: initialClients,
  services,
  professionals,
  onClose,
}: Props) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(appointment?.clientId ?? "");
  const [professionalId, setProfessionalId] = useState(
    appointment?.professionalId ?? initialProfessionalId ?? professionals[0]?.id ?? "",
  );
  const [serviceId, setServiceId] = useState(
    appointment?.serviceId ?? services[0]?.id ?? "",
  );
  const [dateTime, setDateTime] = useState(
    toDateTimeLocal(appointment?.start ?? initialStart ?? new Date()),
  );
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newClientName, setNewClientName] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const totalPaid = appointment?.payments.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const [paymentAmount, setPaymentAmount] = useState(
    appointment ? Math.max(appointment.price - totalPaid, 0) : 0,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  function refreshAndClose() {
    router.refresh();
    onClose();
  }

  async function handleAddClient() {
    if (!newClientName.trim()) return;
    setAddingClient(true);
    const result = await createClient({ name: newClientName.trim() });
    setAddingClient(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    // Optimistically add to local list; real id will sync on next full refresh.
    const tempClient: ClientModel = {
      id: `temp-${Date.now()}`,
      name: newClientName.trim(),
      phone: null,
      email: null,
      birthDate: null,
      notes: null,
      createdAt: new Date(),
    };
    setClients((prev) => [...prev, tempClient].sort((a, b) => a.name.localeCompare(b.name)));
    setNewClientName("");
  }

  async function handleSubmit() {
    if (!clientId) {
      setError("Selecione uma cliente.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      clientId,
      professionalId,
      serviceId,
      start: new Date(dateTime).toISOString(),
      notes,
    };

    const result =
      mode === "create"
        ? await createAppointment(payload)
        : await updateAppointment(appointment!.id, payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    refreshAndClose();
  }

  async function handleStatusChange(status: AppointmentStatus) {
    if (!appointment) return;
    setSaving(true);
    await updateAppointmentStatus(appointment.id, status);
    setSaving(false);
    refreshAndClose();
  }

  async function handleCancel() {
    if (!appointment) return;
    if (!confirm("Cancelar este agendamento?")) return;
    setSaving(true);
    await updateAppointmentStatus(appointment.id, "CANCELED");
    setSaving(false);
    refreshAndClose();
  }

  async function handleDelete() {
    if (!appointment) return;
    if (!confirm("Excluir este agendamento permanentemente?")) return;
    setSaving(true);
    await deleteAppointment(appointment.id);
    setSaving(false);
    refreshAndClose();
  }

  async function handleConfirmPayment() {
    if (!appointment) return;
    setSaving(true);
    await recordPayment(appointment.id, paymentAmount, paymentMethod);
    setSaving(false);
    refreshAndClose();
  }

  return (
    <Modal
      title={mode === "create" ? "Novo agendamento" : "Detalhes do agendamento"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Cliente</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Nova cliente rápida..."
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={handleAddClient}
              disabled={addingClient}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary-soft disabled:opacity-60"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Profissional</label>
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Serviço</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMinutes}min · {formatCurrency(s.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Data e horário
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          {selectedService && (
            <p className="mt-1 text-xs text-muted">
              Duração estimada: {selectedService.durationMinutes} min
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {mode === "create" ? "Agendar" : "Salvar alterações"}
          </button>
        </div>

        {mode === "edit" && appointment && (
          <div className="mt-2 border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium text-foreground">
              Status atual: {STATUS_LABELS[appointment.status]}
            </p>

            {appointment.payments.length > 0 && (
              <div className="mb-3 text-xs text-muted">
                {appointment.payments.map((p) => (
                  <p key={p.id}>
                    {p.isDeposit ? "Sinal" : "Pagamento"}: {formatCurrency(p.amount)} ·{" "}
                    {PAYMENT_METHOD_LABELS[p.method]}
                  </p>
                ))}
                <p className="font-medium text-foreground">
                  Total pago: {formatCurrency(totalPaid)} de {formatCurrency(appointment.price)}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.filter((s) => s.status !== appointment.status).map((s) => (
                <button
                  key={s.status}
                  onClick={() => handleStatusChange(s.status)}
                  disabled={saving}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary-soft disabled:opacity-60"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => setShowPayment((v) => !v)}
                disabled={saving}
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
              >
                Concluir e receber
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-zinc-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Excluir
              </button>
            </div>

            {showPayment && (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-primary-soft/40 p-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-foreground">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-28 rounded-lg border border-border px-2 py-1 text-sm"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="rounded-lg border border-border px-2 py-1 text-sm"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleConfirmPayment}
                  disabled={saving}
                  className="self-start rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Confirmar recebimento
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
