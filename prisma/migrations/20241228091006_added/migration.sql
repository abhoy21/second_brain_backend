/*
  Warnings:

  - You are about to drop the column `created` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "created",
ADD COLUMN     "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;
