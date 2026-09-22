"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getAppointmentStatus } from "@/lib/actions/booking";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const MAX_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

export default function ConfirmingStatus({ appointmentId }: { appointmentId: string }) {
  const [status, setStatus] = useState<AppointmentStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!checking) return;

    const interval = setInterval(async () => {
      const current = await getAppointmentStatus(appointmentId);
      if (current && current !== "PENDING_PAYMENT") {
        setStatus(current);
        setChecking(false);
        return;
      }
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setChecking(false);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [appointmentId, checking]);

  if (checking) {
    return (
      <div className="flex flex-col items-center py-4">
        <Loader2 size={40} className="mb-3 animate-spin text-primary" />
        <h1 className="mb-1 text-lg font-semibold text-foreground">
          Confirmando seu pagamento...
        </h1>
        <p className="text-sm text-muted">Isso leva só alguns segundos.</p>
      </div>
    );
  }

  if (status === "SCHEDULED" || status === "CONFIRMED") {
    return (
      <div className="flex flex-col items-center py-4">
        <CheckCircle2 size={48} className="mb-3 text-green-500" />
        <h1 className="mb-1 text-lg font-semibold text-foreground">
          Agendamento confirmado!
        </h1>
        <p className="text-sm text-muted">Sinal recebido. Te esperamos no salão!</p>
      </div>
    );
  }

  if (status === "CANCELED") {
    return (
      <div className="flex flex-col items-center py-4">
        <XCircle size={48} className="mb-3 text-red-500" />
        <h1 className="mb-1 text-lg font-semibold text-foreground">Pagamento não aprovado</h1>
        <p className="text-sm text-muted">
          Seu horário não foi reservado. Tente agendar novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4">
      <Loader2 size={40} className="mb-3 text-primary" />
      <h1 className="mb-1 text-lg font-semibold text-foreground">
        Ainda processando seu pagamento
      </h1>
      <p className="text-sm text-muted">
        Pode levar mais alguns minutos. Você pode fechar esta página — avisaremos por telefone
        se houver algum problema.
      </p>
    </div>
  );
}
