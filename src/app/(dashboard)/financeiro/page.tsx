import { prisma } from "@/lib/prisma";
import { formatDateKey, parseDateKey } from "@/lib/format";
import FinanceiroView from "./FinanceiroView";

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const fromKey = params.from ?? formatDateKey(firstDayOfMonth(now));
  const toKey = params.to ?? formatDateKey(lastDayOfMonth(now));

  const from = parseDateKey(fromKey);
  from.setHours(0, 0, 0, 0);
  const to = parseDateKey(toKey);
  to.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: from, lte: to } },
    include: {
      appointment: {
        include: { professional: true, service: true, client: true },
      },
    },
    orderBy: { paidAt: "asc" },
  });

  const canceledCount = await prisma.appointment.count({
    where: {
      start: { gte: from, lte: to },
      status: { in: ["CANCELED", "NO_SHOW"] },
    },
  });

  return (
    <FinanceiroView
      fromKey={fromKey}
      toKey={toKey}
      payments={payments}
      canceledCount={canceledCount}
    />
  );
}
