"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/format";
import {
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
} from "@/lib/actions/services";
import type { ServiceModel } from "@/types/domain";

export default function ServicosView({ services }: { services: ServiceModel[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ServiceModel | "new" | null>(null);

  async function handleDelete(service: ServiceModel) {
    if (!confirm(`Excluir o serviço "${service.name}"?`)) return;
    const result = await deleteService(service.id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleToggle(service: ServiceModel) {
    await toggleServiceActive(service.id, !service.active);
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Serviços</h1>
          <p className="text-sm text-muted">{services.length} cadastrados</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} />
          Novo serviço
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft/40 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{service.name}</td>
                <td className="px-4 py-3 text-muted">{service.category ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{service.durationMinutes} min</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(service.price)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(service)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      service.active
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(service)}
                      className="rounded-lg p-1.5 text-muted hover:bg-primary-soft hover:text-primary"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nenhum serviço cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ServiceFormModal
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ServiceFormModal({
  service,
  onClose,
}: {
  service: ServiceModel | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [duration, setDuration] = useState(service?.durationMinutes ?? 30);
  const [price, setPrice] = useState(service?.price ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const payload = {
      name,
      category,
      durationMinutes: duration,
      price,
      active: service?.active ?? true,
    };
    const result = service
      ? await updateService(service.id, payload)
      : await createService(payload);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal title={service ? "Editar serviço" : "Novo serviço"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Categoria</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Cabelo, Unhas, Estética..."
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Duração (min)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
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
