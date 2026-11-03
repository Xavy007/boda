-- Nombres de los padres de cada novio (opcionales), para mostrarlos en la invitación.

-- AlterTable
ALTER TABLE "EventSettings" ADD COLUMN "partnerOneParents" TEXT,
ADD COLUMN "partnerTwoParents" TEXT;
