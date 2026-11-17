-- Regalo recibido por invitación (se marca a mano desde el panel)
ALTER TABLE "Invitation" ADD COLUMN "giftReceivedAt" TIMESTAMP(3),
ADD COLUMN "giftNote" TEXT;
