-- RSVP simplificado: un solo nombre (quien responde) + cantidad de personas.
-- Se reemplaza la tabla "Guest" (una fila por invitado) por columnas en "Invitation".

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "attendingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dietaryNotes" TEXT,
ADD COLUMN     "respondentName" TEXT;

-- Conserva las respuestas existentes antes de borrar "Guest"
UPDATE "Invitation" i
SET "attendingCount" = g.cnt,
    "respondentName" = g.first_name,
    "dietaryNotes"   = g.diets
FROM (
  SELECT "invitationId",
         COUNT(*)::int AS cnt,
         (ARRAY_AGG("fullName" ORDER BY "createdAt"))[1] AS first_name,
         STRING_AGG("fullName" || ': ' || "dietaryRestrictions", '; ' ORDER BY "createdAt")
           FILTER (WHERE "dietaryRestrictions" IS NOT NULL AND "dietaryRestrictions" <> '') AS diets
  FROM "Guest"
  GROUP BY "invitationId"
) g
WHERE g."invitationId" = i.id AND i.status = 'CONFIRMADO';

-- AlterTable
ALTER TABLE "EventSettings" ADD COLUMN     "defaultMaxGuests" INTEGER NOT NULL DEFAULT 2;

-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_invitationId_fkey";

-- DropTable
DROP TABLE "Guest";
