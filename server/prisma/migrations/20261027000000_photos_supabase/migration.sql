-- Fotos: los archivos van a Supabase Storage; aquí solo sección, orden, descripción y URLs.

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT NOT NULL DEFAULT '',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "blurDataUrl" TEXT,
    "variants" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_section_order_idx" ON "Photo"("section", "order");

-- Igual que el resto de tablas (supabase/setup.sql): sin acceso desde la API pública
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;
