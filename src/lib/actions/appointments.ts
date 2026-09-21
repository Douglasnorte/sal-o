"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, PaymentMethod } from "@/generated/prisma/enums";

export type AppointmentInput = {
  clientId: string;
  professionalId: string;
  serviceId: string;
  start: string; // ISO string
  notes?: string;
};

async function hasOverlap(
  professionalId: string,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const overlapping = await prisma.appointment.findFirst({
    where: {
      professionalId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { notIn: ["CANCELED", "NO_SHOW"] },
      start: { lt: end },
      end: { gt: start },
    },
  });
  return !!overlapping;
}

export async function createAppointment(input: AppointmentInput) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) {
    return { success: false as const, error: "Serviço não encontrado." };
  }

  const start = new Date(input.start);
  const end = new Date(start.getTime() + service.durationMinutes * 60000);

  if (await hasOverlap(input.professionalId, start, end)) {
    return {
      success: false as const,
      error: "Já existe um agendamento para esta profissional neste horário.",
    };
  }

  await prisma.appointment.create({
    data: {
      clientId: input.clientId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      start,
      end,
      price: service.price,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/agenda");
  return { success: true as const };
}

export async function updateAppointment(id: string, input: AppointmentInput) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) {
    return { success: false as const, error: "Serviço não encontrado." };
  }

  const start = new Date(input.start);
  const end = new Date(start.getTime() + service.durationMinutes * 60000);

  if (await hasOverlap(input.professionalId, start, end, id)) {
    return {
      success: false as const,
      error: "Já existe um agendamento para esta profissional neste horário.",
    };
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      clientId: input.clientId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      start,
      end,
      price: service.price,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/agenda");
  return { success: true as const };
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  await prisma.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  return { success: true as const };
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  return { success: true as const };
}

export async function recordPayment(
  appointmentId: string,
  amount: number,
  method: PaymentMethod,
) {
  await prisma.$transaction([
    prisma.payment.upsert({
      where: { appointmentId },
      update: { amount, method },
      create: { appointmentId, amount, method },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "DONE" },
    }),
  ]);
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  return { success: true as const };
}
