import type {
  ProfessionalModel,
  WorkingHourModel,
  AppointmentModel,
  ClientModel,
  ServiceModel,
  PaymentModel,
} from "@/generated/prisma/models";

export type ProfessionalWithHours = ProfessionalModel & {
  workingHours: WorkingHourModel[];
};

export type AppointmentWithRelations = AppointmentModel & {
  client: ClientModel;
  service: ServiceModel;
};

export type AppointmentWithPayment = AppointmentWithRelations & {
  payments: PaymentModel[];
};

export type {
  ProfessionalModel,
  WorkingHourModel,
  AppointmentModel,
  ClientModel,
  ServiceModel,
  PaymentModel,
};
