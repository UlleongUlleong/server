/*
  Warnings:

  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nickname]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Token` DROP FOREIGN KEY `Token_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserAlcoholCategory` DROP FOREIGN KEY `UserAlcoholCategory_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserMoodCategory` DROP FOREIGN KEY `UserMoodCategory_userId_fkey`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `password` VARCHAR(100) NULL;

-- DropTable
DROP TABLE `Token`;

-- CreateTable
CREATE TABLE `Alcohol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alcoholCategoryId` INTEGER NOT NULL,
    `name` VARCHAR(20) NULL,
    `description` VARCHAR(100) NULL,
    `price` INTEGER NULL,
    `origin` VARCHAR(20) NULL,
    `scoreAverage` DOUBLE NOT NULL DEFAULT 0,
    `scoreCount` INTEGER NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `interestCount` INTEGER NOT NULL DEFAULT 0,
    `imageUrl` VARCHAR(255) NULL,
    `abv` DOUBLE NULL,
    `volume` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserReviewAlochol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `score` INTEGER NOT NULL,
    `comment` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `alcoholId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserInterestAlcohol` (
    `userId` INTEGER NOT NULL,
    `alcoholId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `alcoholId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoomTheme` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `themeId` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200) NULL,
    `maxParticipants` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    FULLTEXT INDEX `ChatRoom_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatParticipant` (
    `userId` INTEGER NOT NULL,
    `roomId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isHost` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `ChatParticipant_userId_key`(`userId`),
    INDEX `ChatParticipant_roomId_joinedAt_idx`(`roomId`, `joinedAt`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatAlcoholCategory` (
    `roomId` INTEGER NOT NULL,
    `alcoholCategoryId` INTEGER NOT NULL,

    PRIMARY KEY (`roomId`, `alcoholCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMoodCategory` (
    `roomId` INTEGER NOT NULL,
    `moodCategoryId` INTEGER NOT NULL,

    PRIMARY KEY (`roomId`, `moodCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(100) NOT NULL,
    `loggedAt` VARCHAR(100) NOT NULL,
    `roomId` INTEGER NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Profile_nickname_key` ON `Profile`(`nickname`);

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMoodCategory` ADD CONSTRAINT `UserMoodCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlcoholCategory` ADD CONSTRAINT `UserAlcoholCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alcohol` ADD CONSTRAINT `Alcohol_alcoholCategoryId_fkey` FOREIGN KEY (`alcoholCategoryId`) REFERENCES `AlcoholCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReviewAlochol` ADD CONSTRAINT `UserReviewAlochol_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserReviewAlochol` ADD CONSTRAINT `UserReviewAlochol_alcoholId_fkey` FOREIGN KEY (`alcoholId`) REFERENCES `Alcohol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserInterestAlcohol` ADD CONSTRAINT `UserInterestAlcohol_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserInterestAlcohol` ADD CONSTRAINT `UserInterestAlcohol_alcoholId_fkey` FOREIGN KEY (`alcoholId`) REFERENCES `Alcohol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `ChatRoomTheme`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatParticipant` ADD CONSTRAINT `ChatParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatParticipant` ADD CONSTRAINT `ChatParticipant_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatAlcoholCategory` ADD CONSTRAINT `ChatAlcoholCategory_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatAlcoholCategory` ADD CONSTRAINT `ChatAlcoholCategory_alcoholCategoryId_fkey` FOREIGN KEY (`alcoholCategoryId`) REFERENCES `AlcoholCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMoodCategory` ADD CONSTRAINT `ChatMoodCategory_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMoodCategory` ADD CONSTRAINT `ChatMoodCategory_moodCategoryId_fkey` FOREIGN KEY (`moodCategoryId`) REFERENCES `MoodCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatLog` ADD CONSTRAINT `ChatLog_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatLog` ADD CONSTRAINT `ChatLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
