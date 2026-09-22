import ConfirmingStatus from "./ConfirmingStatus";

export const dynamic = "force-dynamic";

export default async function ConfirmandoPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { appointmentId } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        {appointmentId ? (
          <ConfirmingStatus appointmentId={appointmentId} />
        ) : (
          <p className="text-sm text-muted">Agendamento não encontrado.</p>
        )}
      </div>
    </div>
  );
}
