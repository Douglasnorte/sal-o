import { prisma } from "@/lib/prisma";
import { formatDateKey, parseDateKey } from "@/lib/format";
import AgendaView from "./AgendaView";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateKey = params.date ?? formatDateKey(new Date());
  const day = parseDateKey(dateKey);
  const weekday = day.getDay();

  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  const [professionals, appointments, clients, services] = await Promise.all([
    prisma.professional.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      include: { workingHours: { where: { weekday } } },
    }),
    prisma.appointment.findMany({
      where: { start: { gte: startOfDay, lte: endOfDay } },
      include: { client: true, service: true, payments: true },
      orderBy: { start: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AgendaView
      dateKey={dateKey}
      professionals={professionals}
      appointments={appointments}
      clients={clients}
      services={services}
    />
  );
}
