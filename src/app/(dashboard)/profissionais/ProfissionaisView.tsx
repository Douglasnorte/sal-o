"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { WEEKDAY_LABELS } from "@/lib/constants";
import {
  createProfessional,
  updateProfessional,
  deleteProfessional,
  updateWorkingHours,
  type WorkingHourInput,
} from "@/lib/actions/professionals";
import type { ProfessionalWithHours } from "@/types/domain";

const WORKING_DAYS = [1, 2, 3, 4, 5, 6];

export default function ProfissionaisView({
  professionals,
}: {
  professionals: ProfessionalWithHours[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProfessionalWithHours | "new" | null>(null);

  async function handleDelete(professional: ProfessionalWithHours) {
    if (!confirm(`Excluir "${professional.name}"?`)) return;
    const result = await deleteProfessional(professional.id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Profissionais</h1>
          <p className="text-sm text-muted">{professionals.length} cadastradas</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} />
          Nova profissional
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: professional.color }}
              />
              <h3 className="font-medium text-foreground">{professional.name}</h3>
              {!professional.active && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  Inativa
                </span>
              )}
            </div>
            <p className="text-sm text-muted">{professional.phone ?? "Sem telefone"}</p>
            <p className="text-sm text-muted">
              Comissão: {professional.commissionPercent}%
            </p>
            <p className="mb-3 text-xs text-muted">
              {professional.workingHours.length} dia(s) de atendimento configurados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(professional)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary-soft"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                onClick={() => handleDelete(professional)}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </div>
        ))}
        {professionals.length === 0 && (
          <p className="text-sm text-muted">Nenhuma profissional cadastrada.</p>
        )}
      </div>

      {editing && (
        <ProfessionalFormModal
          professional={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProfessionalFormModal({
  professional,
  onClose,
}: {
  professional: ProfessionalWithHours | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(professional?.name ?? "");
  const [color, setColor] = useState(professional?.color ?? "#D6336C");
  const [phone, setPhone] = useState(professional?.phone ?? "");
  const [commissionPercent, setCommissionPercent] = useState(
    professional?.commissionPercent ?? 40,
  );
  const [active, setActive] = useState(professional?.active ?? true);

  const [hours, setHours] = useState<Record<number, WorkingHourInput>>(() => {
    const map: Record<number, WorkingHourInput> = {};
    for (const day of WORKING_DAYS) {
      const existing = professional?.workingHours.find((h) => h.weekday === day);
      map[day] = {
        weekday: day,
        enabled: !!existing,
        startTime: existing?.startTime ?? "09:00",
        endTime: existing?.endTime ?? "18:00",
      };
    }
    return map;
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateHour(day: number, patch: Partial<WorkingHourInput>) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const payload = { name, color, phone, commissionPercent, active };
    const result = professional
      ? await updateProfessional(professional.id, payload)
      : await createProfessional(payload);

    if (!result.success) {
      setSaving(false);
      setError(result.error);
      return;
    }

    await updateWorkingHours(result.id, Object.values(hours));

    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <Modal
      title={professional ? "Editar profissional" : "Nova profissional"}
      onClose={onClose}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Cor</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-border px-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Comissão (%)
            </label>
            <input
              type="number"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Profissional ativa
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Horário de atendimento</p>
          <div className="flex flex-col gap-2">
            {WORKING_DAYS.map((day) => (
              <div key={day} className="flex items-center gap-2 text-sm">
                <label className="flex w-24 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hours[day].enabled}
                    onChange={(e) => updateHour(day, { enabled: e.target.checked })}
                  />
                  {WEEKDAY_LABELS[day]}
                </label>
                <input
                  type="time"
                  value={hours[day].startTime}
                  disabled={!hours[day].enabled}
                  onChange={(e) => updateHour(day, { startTime: e.target.value })}
                  className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-40"
                />
                <span className="text-muted">às</span>
                <input
                  type="time"
                  value={hours[day].endTime}
                  disabled={!hours[day].enabled}
                  onChange={(e) => updateHour(day, { endTime: e.target.value })}
                  className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Salvar
        </button>
      </div>
    </Modal>
  );
}
