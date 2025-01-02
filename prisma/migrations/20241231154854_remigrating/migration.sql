/*
  Warnings:

  - You are about to drop the column `link` on the `Content` table. All the data in the column will be lost.
  - Added the required column `content` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "link",
ADD COLUMN     "content" TEXT NOT NULL;
