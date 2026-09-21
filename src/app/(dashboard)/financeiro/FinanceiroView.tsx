"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateKey, parseDateKey } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type {
  AppointmentModel,
  ClientModel,
  PaymentModel,
  ProfessionalModel,
  ServiceModel,
} from "@/types/domain";

type PaymentRow = PaymentModel & {
  appointment: AppointmentModel & {
    professional: ProfessionalModel;
    service: ServiceModel;
    client: ClientModel;
  };
};

export default function FinanceiroView({
  fromKey,
  toKey,
  payments,
  canceledCount,
}: {
  fromKey: string;
  toKey: string;
  payments: PaymentRow[];
  canceledCount: number;
}) {
  const router = useRouter();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalAppointments = payments.length;
  const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  const byProfessional = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        commissionPercent: number;
        revenue: number;
        count: number;
      }
    >();
    for (const payment of payments) {
      const professional = payment.appointment.professional;
      const entry = map.get(professional.id) ?? {
        id: professional.id,
        name: professional.name,
        color: professional.color,
        commissionPercent: professional.commissionPercent,
        revenue: 0,
        count: 0,
      };
      entry.revenue += payment.amount;
      entry.count += 1;
      map.set(professional.id, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [payments]);

  const byMethod = useMemo(() => {
    const map = new Map<string, { method: string; revenue: number; count: number }>();
    for (const payment of payments) {
      const entry = map.get(payment.method) ?? {
        method: payment.method,
        revenue: 0,
        count: 0,
      };
      entry.revenue += payment.amount;
      entry.count += 1;
      map.set(payment.method, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [payments]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      const key = formatDateKey(payment.paidAt);
      map.set(key, (map.get(key) ?? 0) + payment.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }, [payments]);

  const maxDayRevenue = Math.max(1, ...byDay.map((d) => d.revenue));
  const totalCommission = byProfessional.reduce(
    (sum, p) => sum + (p.revenue * p.commissionPercent) / 100,
    0,
  );

  function applyRange(newFrom: string, newTo: string) {
    router.push(`/financeiro?from=${newFrom}&to=${newTo}`);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted">Faturamento e comissões por período</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={fromKey}
            onChange={(e) => applyRange(e.target.value, toKey)}
            className="rounded-lg border border-border px-3 py-2"
          />
          <span className="text-muted">até</span>
          <input
            type="date"
            value={toKey}
            onChange={(e) => applyRange(fromKey, e.target.value)}
            className="rounded-lg border border-border px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Faturamento" value={formatCurrency(totalRevenue)} />
        <SummaryCard label="Atendimentos concluídos" value={String(totalAppointments)} />
        <SummaryCard label="Ticket médio" value={formatCurrency(averageTicket)} />
        <SummaryCard label="Comissões a pagar" value={formatCurrency(totalCommission)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Faturamento por dia</h2>
          {byDay.length === 0 ? (
            <p className="text-sm text-muted">Sem pagamentos no período.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {byDay.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted">
                    {parseDateKey(d.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                  <div className="h-3 flex-1 rounded-full bg-primary-soft">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${(d.revenue / maxDayRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-muted">
                    {formatCurrency(d.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Faturamento por forma de pagamento
          </h2>
          {byMethod.length === 0 ? (
            <p className="text-sm text-muted">Sem pagamentos no período.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {byMethod.map((m) => (
                <div key={m.method} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {PAYMENT_METHOD_LABELS[m.method as keyof typeof PAYMENT_METHOD_LABELS]}
                  </span>
                  <span className="text-muted">
                    {m.count}x · {formatCurrency(m.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted">
            {canceledCount} agendamento(s) cancelado(s)/falta no período.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft/40 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Profissional</th>
              <th className="px-4 py-3">Atendimentos</th>
              <th className="px-4 py-3">Faturamento</th>
              <th className="px-4 py-3">Comissão</th>
              <th className="px-4 py-3">Valor da comissão</th>
            </tr>
          </thead>
          <tbody>
            {byProfessional.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{p.count}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(p.revenue)}</td>
                <td className="px-4 py-3 text-muted">{p.commissionPercent}%</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatCurrency((p.revenue * p.commissionPercent) / 100)}
                </td>
              </tr>
            ))}
            {byProfessional.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nenhum pagamento registrado no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
