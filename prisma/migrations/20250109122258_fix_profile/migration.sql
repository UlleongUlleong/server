/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Profile_userId_key` ON `Profile`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_id_key` ON `User`(`id`);
