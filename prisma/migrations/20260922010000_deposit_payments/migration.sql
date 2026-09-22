-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING_PAYMENT';

-- DropIndex
DROP INDEX "Payment_appointmentId_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "externalPaymentId" TEXT,
ADD COLUMN     "isDeposit" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalPaymentId_key" ON "Payment"("externalPaymentId");

