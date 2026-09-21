"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ServiceInput = {
  name: string;
  category?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
};

function normalize(input: ServiceInput) {
  return {
    name: input.name.trim(),
    category: input.category?.trim() || null,
    durationMinutes: Math.max(5, Math.round(input.durationMinutes)),
    price: Math.max(0, input.price),
    active: input.active ?? true,
  };
}

export async function createService(input: ServiceInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  await prisma.service.create({ data: normalize(input) });
  revalidatePath("/servicos");
  revalidatePath("/agenda");
  return { success: true as const };
}

export async function updateService(id: string, input: ServiceInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  await prisma.service.update({ where: { id }, data: normalize(input) });
  revalidatePath("/servicos");
  revalidatePath("/agenda");
  return { success: true as const };
}

export async function toggleServiceActive(id: string, active: boolean) {
  await prisma.service.update({ where: { id }, data: { active } });
  revalidatePath("/servicos");
  return { success: true as const };
}

export async function deleteService(id: string) {
  const appointmentCount = await prisma.appointment.count({ where: { serviceId: id } });
  if (appointmentCount > 0) {
    return {
      success: false as const,
      error: "Não é possível excluir: este serviço possui agendamentos. Desative-o em vez disso.",
    };
  }
  await prisma.service.delete({ where: { id } });
  revalidatePath("/servicos");
  return { success: true as const };
}
