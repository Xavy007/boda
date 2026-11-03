-- Los lugares se ubican solo con el link de Google Maps (o el nombre y la dirección).

-- AlterTable
ALTER TABLE "EventSettings" DROP COLUMN "ceremonyLat",
DROP COLUMN "ceremonyLng",
DROP COLUMN "receptionLat",
DROP COLUMN "receptionLng";
