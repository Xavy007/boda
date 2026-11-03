-- Opción para indicar, de forma discreta, que la celebración es solo para adultos.

-- AlterTable
ALTER TABLE "EventSettings" ADD COLUMN "adultsOnly" BOOLEAN NOT NULL DEFAULT false;
