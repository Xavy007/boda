-- Roles del panel: ADMIN (administrador), PLANNER (wedding planner) y NOVIOS (solo cargan familias y teléfonos)

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'PLANNER', 'NOVIOS');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';
