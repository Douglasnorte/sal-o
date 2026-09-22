"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Link2, Check } from "lucide-react";
import {
  AGENDA_START_HOUR,
  AGENDA_END_HOUR,
  SLOT_MINUTES,
  STATUS_STYLES,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDateKey, parseDateKey, formatLongDate, formatTime } from "@/lib/format";
import type {
  ProfessionalWithHours,
  AppointmentWithPayment,
  ClientModel,
  ServiceModel,
} from "@/types/domain";
import AppointmentModal from "./AppointmentModal";

const SLOT_HEIGHT = 32; // px per 30-minute slot

type Props = {
  dateKey: string;
  professionals: ProfessionalWithHours[];
  appointments: AppointmentWithPayment[];
  clients: ClientModel[];
  services: ServiceModel[];
};

function buildSlots() {
  const slots: { hour: number; minute: number }[] = [];
  for (let h = AGENDA_START_HOUR; h < AGENDA_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push({ hour: h, minute: m });
    }
  }
  return slots;
}

function minutesFromStart(date: Date) {
  return date.getHours() * 60 + date.getMinutes() - AGENDA_START_HOUR * 60;
}

export default function AgendaView({
  dateKey,
  professionals,
  appointments,
  clients,
  services,
}: Props) {
  const router = useRouter();
  const day = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const slots = useMemo(() => buildSlots(), []);
  const columnHeight = slots.length * SLOT_HEIGHT;

  const [creatingSlot, setCreatingSlot] = useState<{
    professionalId: string;
    start: Date;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithPayment | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  function copyBookingLink() {
    navigator.clipboard.writeText(`${window.location.origin}/reservar`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function goToDate(newDate: Date) {
    router.push(`/agenda?date=${formatDateKey(newDate)}`);
  }

  function shiftDay(delta: number) {
    const next = new Date(day);
    next.setDate(next.getDate() + delta);
    goToDate(next);
  }

  const isToday = formatDateKey(new Date()) === dateKey;
  const now = new Date();
  const nowOffset = isToday ? (minutesFromStart(now) / SLOT_MINUTES) * SLOT_HEIGHT : null;

  function appointmentsFor(professionalId: string) {
    return appointments.filter((a) => a.professionalId === professionalId);
  }

  function isWorkingAt(professional: ProfessionalWithHours, hour: number, minute: number) {
    const wh = professional.workingHours[0];
    if (!wh) return false;
    const minutesOfDay = hour * 60 + minute;
    const [startH, startM] = wh.startTime.split(":").map(Number);
    const [endH, endM] = wh.endTime.split(":").map(Number);
    return minutesOfDay >= startH * 60 + startM && minutesOfDay < endH * 60 + endM;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-muted">{formatLongDate(day)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyBookingLink}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-primary-soft"
          >
            {linkCopied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}
            {linkCopied ? "Copiado!" : "Link de agendamento"}
          </button>
          <button
            onClick={() => shiftDay(-1)}
            className="rounded-lg border border-border p-2 hover:bg-primary-soft"
            aria-label="Dia anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => goToDate(parseDateKey(e.target.value))}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            onClick={() => shiftDay(1)}
            className="rounded-lg border border-border p-2 hover:bg-primary-soft"
            aria-label="Próximo dia"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => goToDate(new Date())}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-primary-soft"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {professionals.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            Nenhuma profissional ativa cadastrada. Cadastre em &quot;Profissionais&quot;.
          </p>
        ) : (
          <div className="flex min-w-fit">
            <div className="sticky left-0 z-10 w-16 shrink-0 bg-background">
              <div className="h-14 border-b border-border" />
              <div className="relative" style={{ height: columnHeight }}>
                {slots.map((slot, i) =>
                  slot.minute === 0 ? (
                    <div
                      key={i}
                      className="absolute left-0 w-full pr-2 text-right text-xs text-muted"
                      style={{ top: i * SLOT_HEIGHT - 7 }}
                    >
                      {String(slot.hour).padStart(2, "0")}:00
                    </div>
                  ) : null,
                )}
              </div>
            </div>

            {professionals.map((professional) => (
              <div key={professional.id} className="w-64 shrink-0 border-l border-border">
                <div className="flex h-14 items-center gap-2 border-b border-border px-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: professional.color }}
                  />
                  <span className="truncate text-sm font-medium text-foreground">
                    {professional.name}
                  </span>
                </div>
                <div className="relative" style={{ height: columnHeight }}>
                  {slots.map((slot, i) => {
                    const working = isWorkingAt(professional, slot.hour, slot.minute);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const start = new Date(day);
                          start.setHours(slot.hour, slot.minute, 0, 0);
                          setCreatingSlot({ professionalId: professional.id, start });
                        }}
                        className={`group absolute left-0 w-full border-b ${
                          slot.minute === 0 ? "border-border" : "border-border/40"
                        } ${working ? "bg-white hover:bg-primary-soft/50" : "bg-zinc-50/70 hover:bg-primary-soft/30"}`}
                        style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      >
                        <Plus
                          size={14}
                          className="mx-auto text-transparent group-hover:text-primary"
                        />
                      </button>
                    );
                  })}

                  {nowOffset !== null && nowOffset >= 0 && nowOffset <= columnHeight && (
                    <div
                      className="pointer-events-none absolute left-0 z-10 w-full border-t-2 border-red-400"
                      style={{ top: nowOffset }}
                    />
                  )}

                  {appointmentsFor(professional.id).map((appointment) => {
                    const top = (minutesFromStart(appointment.start) / SLOT_MINUTES) * SLOT_HEIGHT;
                    const durationMinutes =
                      (appointment.end.getTime() - appointment.start.getTime()) / 60000;
                    const height = Math.max(
                      (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 2,
                      SLOT_HEIGHT - 2,
                    );
                    const style = STATUS_STYLES[appointment.status];
                    return (
                      <button
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        className="absolute left-1 z-[5] w-[calc(100%-8px)] overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm"
                        style={{
                          top,
                          height,
                          backgroundColor: style.bg,
                          borderColor: style.border,
                          color: style.text,
                        }}
                      >
                        <p className="truncate text-xs font-semibold">
                          {formatTime(appointment.start)} · {appointment.client.name}
                        </p>
                        <p className="truncate text-[11px]">{appointment.service.name}</p>
                        <p className="truncate text-[10px] opacity-80">
                          {STATUS_LABELS[appointment.status]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {creatingSlot && (
        <AppointmentModal
          mode="create"
          initialProfessionalId={creatingSlot.professionalId}
          initialStart={creatingSlot.start}
          clients={clients}
          services={services}
          professionals={professionals}
          onClose={() => setCreatingSlot(null)}
        />
      )}

      {selectedAppointment && (
        <AppointmentModal
          mode="edit"
          appointment={selectedAppointment}
          clients={clients}
          services={services}
          professionals={professionals}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
