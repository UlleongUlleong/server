/*
  Warnings:

  - You are about to alter the column `loggedAt` on the `ChatLog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `DateTime(3)`.
  - Made the column `roomId` on table `ChatLog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `ChatAlcoholCategory` DROP FOREIGN KEY `ChatAlcoholCategory_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatLog` DROP FOREIGN KEY `ChatLog_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatLog` DROP FOREIGN KEY `ChatLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatMoodCategory` DROP FOREIGN KEY `ChatMoodCategory_roomId_fkey`;

-- DropIndex
DROP INDEX `ChatLog_roomId_fkey` ON `ChatLog`;

-- DropIndex
DROP INDEX `ChatLog_userId_fkey` ON `ChatLog`;

-- AlterTable
ALTER TABLE `ChatLog` MODIFY `message` VARCHAR(500) NOT NULL,
    MODIFY `loggedAt` DATETIME(3) NOT NULL,
    MODIFY `roomId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ChatAlcoholCategory` ADD CONSTRAINT `ChatAlcoholCategory_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMoodCategory` ADD CONSTRAINT `ChatMoodCategory_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatLog` ADD CONSTRAINT `ChatLog_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatLog` ADD CONSTRAINT `ChatLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
