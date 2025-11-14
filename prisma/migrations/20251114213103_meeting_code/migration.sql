/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Meeting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_code_key" ON "Meeting"("code");
