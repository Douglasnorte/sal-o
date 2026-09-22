"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { formatCurrency, formatDateKey, formatLongDate, parseDateKey } from "@/lib/format";
import { getAvailableSlots, startBookingWithDeposit } from "@/lib/actions/booking";
import { DEPOSIT_PERCENT } from "@/lib/constants";
import type { ProfessionalModel, ServiceModel } from "@/types/domain";

type Step = "service" | "professional" | "date" | "time" | "details";

const MAX_DAYS_AHEAD = 30;

function todayKey() {
  return formatDateKey(new Date());
}

function maxDateKey() {
  const d = new Date();
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return formatDateKey(d);
}

export default function BookingWizard({
  professionals,
  services,
}: {
  professionals: ProfessionalModel[];
  services: ServiceModel[];
}) {
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string>(todayKey());
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const professional = professionals.find((p) => p.id === professionalId) ?? null;

  async function goToTimeStep() {
    if (!serviceId || !professionalId) return;
    setTime(null);
    setLoadingSlots(true);
    setStep("time");
    const available = await getAvailableSlots(professionalId, serviceId, dateKey);
    setSlots(available);
    setLoadingSlots(false);
  }

  async function handleConfirm() {
    if (!professionalId || !serviceId || !time) return;
    setSubmitting(true);
    setError(null);
    const result = await startBookingWithDeposit({
      professionalId,
      serviceId,
      dateKey,
      time,
      clientName: name,
      clientPhone: phone,
    });
    if (!result.success) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  function back() {
    setError(null);
    if (step === "professional") setStep("service");
    else if (step === "date") setStep("professional");
    else if (step === "time") setStep("date");
    else if (step === "details") setStep("time");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
          AC
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Amanda Cruz</h1>
        <p className="mt-1 text-sm text-muted">Agende seu horário</p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {step !== "service" && (
          <button
            onClick={back}
            className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
        )}

        {step === "service" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Escolha o serviço
            </h2>
            <div className="flex flex-col gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setStep("professional");
                  }}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left hover:border-primary hover:bg-primary-soft/40"
                >
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted">{s.durationMinutes} min</p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(s.price)}
                  </span>
                </button>
              ))}
              {services.length === 0 && (
                <p className="text-sm text-muted">Nenhum serviço disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {step === "professional" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Escolha a profissional
            </h2>
            <div className="flex flex-col gap-2">
              {professionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProfessionalId(p.id);
                    setStep("date");
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:border-primary hover:bg-primary-soft/40"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-medium text-foreground">{p.name}</span>
                </button>
              ))}
              {professionals.length === 0 && (
                <p className="text-sm text-muted">
                  Nenhuma profissional disponível no momento.
                </p>
              )}
            </div>
          </div>
        )}

        {step === "date" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Escolha a data</h2>
            <input
              type="date"
              value={dateKey}
              min={todayKey()}
              max={maxDateKey()}
              onChange={(e) => setDateKey(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              onClick={goToTimeStep}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Ver horários disponíveis
            </button>
          </div>
        )}

        {step === "time" && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-foreground">Escolha o horário</h2>
            <p className="mb-4 text-xs text-muted">{formatLongDate(parseDateKey(dateKey))}</p>
            {loadingSlots ? (
              <p className="text-sm text-muted">Carregando horários...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum horário disponível nesse dia. Volte e escolha outra data.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTime(s);
                      setStep("details");
                    }}
                    className="rounded-lg border border-border py-2 text-sm font-medium hover:border-primary hover:bg-primary-soft/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Seus dados</h2>
            <div className="mb-4 rounded-lg bg-primary-soft/40 p-3 text-sm text-foreground">
              <p>
                <strong>{service?.name}</strong> · {service ? formatCurrency(service.price) : ""}
              </p>
              <p>{professional?.name}</p>
              <p>
                {formatLongDate(parseDateKey(dateKey))} às {time}
              </p>
            </div>
            {service && (
              <p className="mb-4 text-sm text-foreground">
                Para confirmar, é necessário pagar um sinal de{" "}
                <strong>{formatCurrency((service.price * DEPOSIT_PERCENT) / 100)}</strong> (
                {DEPOSIT_PERCENT}% do valor) via Pix ou cartão. O restante é pago no salão.
              </p>
            )}
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Telefone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={submitting || !name.trim() || !phone.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? "Redirecionando..." : "Ir para pagamento do sinal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
