-- El rol NOVIOS se separa en NOVIA y NOVIO (las cuentas NOVIOS existentes pasan a NOVIA),
-- y cada invitación guarda de qué lado es el invitado.

-- AlterEnum
ALTER TYPE "AdminRole" RENAME VALUE 'NOVIOS' TO 'NOVIA';
ALTER TYPE "AdminRole" ADD VALUE 'NOVIO';

-- CreateEnum
CREATE TYPE "GuestSide" AS ENUM ('NOVIA', 'NOVIO', 'AMBOS');

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "side" "GuestSide";
