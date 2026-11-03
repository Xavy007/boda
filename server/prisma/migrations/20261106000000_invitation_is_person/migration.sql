-- Invitación a una persona (con o sin acompañante) en vez de a una familia.

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "isPerson" BOOLEAN NOT NULL DEFAULT false;
