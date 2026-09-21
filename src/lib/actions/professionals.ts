"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProfessionalInput = {
  name: string;
  color: string;
  phone?: string;
  commissionPercent: number;
  active?: boolean;
};

export type WorkingHourInput = {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function normalize(input: ProfessionalInput) {
  return {
    name: input.name.trim(),
    color: input.color || "#D946A6",
    phone: input.phone?.trim() || null,
    commissionPercent: Math.min(100, Math.max(0, input.commissionPercent)),
    active: input.active ?? true,
  };
}

export async function createProfessional(input: ProfessionalInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  const professional = await prisma.professional.create({ data: normalize(input) });
  revalidatePath("/profissionais");
  revalidatePath("/agenda");
  return { success: true as const, id: professional.id };
}

export async function updateProfessional(id: string, input: ProfessionalInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  await prisma.professional.update({ where: { id }, data: normalize(input) });
  revalidatePath("/profissionais");
  revalidatePath("/agenda");
  return { success: true as const, id };
}

export async function deleteProfessional(id: string) {
  const appointmentCount = await prisma.appointment.count({ where: { professionalId: id } });
  if (appointmentCount > 0) {
    return {
      success: false as const,
      error: "Não é possível excluir: esta profissional possui agendamentos. Desative-a em vez disso.",
    };
  }
  await prisma.professional.delete({ where: { id } });
  revalidatePath("/profissionais");
  return { success: true as const };
}

export async function updateWorkingHours(professionalId: string, hours: WorkingHourInput[]) {
  await prisma.$transaction([
    prisma.workingHour.deleteMany({ where: { professionalId } }),
    prisma.workingHour.createMany({
      data: hours
        .filter((h) => h.enabled)
        .map((h) => ({
          professionalId,
          weekday: h.weekday,
          startTime: h.startTime,
          endTime: h.endTime,
        })),
    }),
  ]);
  revalidatePath("/profissionais");
  revalidatePath("/agenda");
  return { success: true as const };
}
