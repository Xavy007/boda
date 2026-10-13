-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "PhotoSection" AS ENUM ('HERO', 'HISTORIA', 'GALERIA', 'CIERRE');

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "maxDevices" INTEGER NOT NULL DEFAULT 2,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "sentAt" TIMESTAMP(3),
    "firstOpenedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "message" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dietaryRestrictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationDevice" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fingerprintHash" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "fingerprintHash" TEXT,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "partnerOneName" TEXT NOT NULL,
    "partnerTwoName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventEndDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/La_Paz',
    "ceremonyName" TEXT NOT NULL,
    "ceremonyAddress" TEXT NOT NULL,
    "ceremonyLat" DOUBLE PRECISION,
    "ceremonyLng" DOUBLE PRECISION,
    "ceremonyMapsUrl" TEXT,
    "receptionName" TEXT NOT NULL,
    "receptionAddress" TEXT NOT NULL,
    "receptionTime" TEXT,
    "receptionLat" DOUBLE PRECISION,
    "receptionLng" DOUBLE PRECISION,
    "receptionMapsUrl" TEXT,
    "dressCode" TEXT NOT NULL,
    "dressCodeNote" TEXT,
    "dressCodeColors" JSONB NOT NULL DEFAULT '[]',
    "mainPhrase" TEXT NOT NULL,
    "quotePhrase" TEXT,
    "quoteAuthor" TEXT,
    "closingPhrase" TEXT,
    "rsvpDeadline" TIMESTAMP(3) NOT NULL,
    "giftInfo" JSONB NOT NULL DEFAULT '{}',
    "couplePhone" TEXT NOT NULL,
    "whatsappTemplate" TEXT NOT NULL,
    "palette" JSONB NOT NULL DEFAULT '{}',
    "musicUrl" TEXT,
    "storyItems" JSONB NOT NULL DEFAULT '[]',
    "itinerary" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "section" "PhotoSection" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT NOT NULL DEFAULT '',
    "width" INTEGER NOT NULL DEFAULT 1600,
    "height" INTEGER NOT NULL DEFAULT 1067,
    "blurDataUrl" TEXT,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");

-- CreateIndex
CREATE INDEX "InvitationDevice_invitationId_fingerprintHash_idx" ON "InvitationDevice"("invitationId", "fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationDevice_invitationId_deviceId_key" ON "InvitationDevice"("invitationId", "deviceId");

-- CreateIndex
CREATE INDEX "AccessLog_invitationId_createdAt_idx" ON "AccessLog"("invitationId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_allowed_createdAt_idx" ON "AccessLog"("allowed", "createdAt");

-- CreateIndex
CREATE INDEX "Photo_section_order_idx" ON "Photo"("section", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationDevice" ADD CONSTRAINT "InvitationDevice_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

