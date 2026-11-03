-- Al asignar una contraseña nueva se cierran las sesiones abiertas de esa cuenta.

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
