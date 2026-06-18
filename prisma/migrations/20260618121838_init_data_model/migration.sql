-- CreateEnum
CREATE TYPE "translation_status" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "chunk_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "novels" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_language" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "raw_content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "novel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "status" "translation_status" NOT NULL DEFAULT 'QUEUED',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "token_usage" INTEGER,
    "polished_content" TEXT,
    "chapter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_chunks" (
    "id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "raw_slice" TEXT NOT NULL,
    "polished_slice" TEXT,
    "status" "chunk_status" NOT NULL DEFAULT 'PENDING',
    "token_count" INTEGER,
    "translation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapters_novel_id_sort_order_idx" ON "chapters"("novel_id", "sort_order");

-- CreateIndex
CREATE INDEX "translations_chapter_id_idx" ON "translations"("chapter_id");

-- CreateIndex
CREATE INDEX "translations_status_idx" ON "translations"("status");

-- CreateIndex
CREATE INDEX "translation_chunks_translation_id_status_idx" ON "translation_chunks"("translation_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "translation_chunks_translation_id_chunk_index_key" ON "translation_chunks"("translation_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_chunks" ADD CONSTRAINT "translation_chunks_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
