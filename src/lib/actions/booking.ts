"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateKey } from "@/lib/format";
import { SLOT_MINUTES } from "@/lib/constants";

export async function getAvailableSlots(
  professionalId: string,
  serviceId: string,
  dateKey: string,
): Promise<string[]> {
  const day = parseDateKey(dateKey);
  const weekday = day.getDay();

  const [workingHour, service] = await Promise.all([
    prisma.workingHour.findUnique({
      where: { professionalId_weekday: { professionalId, weekday } },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!workingHour || !service) return [];

  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      status: { notIn: ["CANCELED", "NO_SHOW"] },
      start: { gte: startOfDay, lte: endOfDay },
    },
    select: { start: true, end: true },
  });

  const [openHour, openMinute] = workingHour.startTime.split(":").map(Number);
  const [closeHour, closeMinute] = workingHour.endTime.split(":").map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  const now = new Date();
  const isToday = startOfDay.toDateString() === now.toDateString();

  const slots: string[] = [];
  for (let m = openMinutes; m + service.durationMinutes <= closeMinutes; m += SLOT_MINUTES) {
    const slotStart = new Date(day);
    slotStart.setHours(0, m, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60000);

    if (isToday && slotStart <= now) continue;

    const overlaps = appointments.some(
      (a) => slotStart < a.end && slotEnd > a.start,
    );
    if (overlaps) continue;

    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }

  return slots;
}

export type PublicBookingInput = {
  professionalId: string;
  serviceId: string;
  dateKey: string;
  time: string;
  clientName: string;
  clientPhone: string;
};

export async function createPublicAppointment(input: PublicBookingInput) {
  const name = input.clientName.trim();
  const phone = input.clientPhone.trim();

  if (!name || !phone) {
    return { success: false as const, error: "Preencha nome e telefone." };
  }

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.active) {
    return { success: false as const, error: "Serviço não encontrado." };
  }

  const [hh, mm] = input.time.split(":").map(Number);
  const start = parseDateKey(input.dateKey);
  start.setHours(hh, mm, 0, 0);

  if (start.getTime() < Date.now()) {
    return { success: false as const, error: "Esse horário já passou." };
  }

  const end = new Date(start.getTime() + service.durationMinutes * 60000);

  const overlapping = await prisma.appointment.findFirst({
    where: {
      professionalId: input.professionalId,
      status: { notIn: ["CANCELED", "NO_SHOW"] },
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (overlapping) {
    return {
      success: false as const,
      error: "Esse horário acabou de ser reservado. Escolha outro.",
    };
  }

  let client = await prisma.client.findFirst({ where: { phone } });
  if (!client) {
    client = await prisma.client.create({ data: { name, phone } });
  }

  await prisma.appointment.create({
    data: {
      clientId: client.id,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      start,
      end,
      price: service.price,
    },
  });

  revalidatePath("/agenda");
  return { success: true as const };
}
