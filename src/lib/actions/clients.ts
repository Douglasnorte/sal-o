"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ClientInput = {
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  notes?: string;
};

function normalize(input: ClientInput) {
  return {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
    notes: input.notes?.trim() || null,
  };
}

export async function createClient(input: ClientInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  await prisma.client.create({ data: normalize(input) });
  revalidatePath("/clientes");
  revalidatePath("/agenda");
  return { success: true as const };
}

export async function updateClient(id: string, input: ClientInput) {
  if (!input.name.trim()) {
    return { success: false as const, error: "Nome é obrigatório." };
  }
  await prisma.client.update({ where: { id }, data: normalize(input) });
  revalidatePath("/clientes");
  revalidatePath("/agenda");
  return { success: true as const };
}

export async function deleteClient(id: string) {
  const appointmentCount = await prisma.appointment.count({ where: { clientId: id } });
  if (appointmentCount > 0) {
    return {
      success: false as const,
      error: "Não é possível excluir: esta cliente possui agendamentos.",
    };
  }
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
  return { success: true as const };
}
