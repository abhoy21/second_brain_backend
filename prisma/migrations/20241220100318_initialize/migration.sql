-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('text', 'image', 'video', 'audio', 'link');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "link" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagTable" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "TagTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TagTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
