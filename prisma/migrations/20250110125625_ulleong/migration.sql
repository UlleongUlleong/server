-- CreateTable
CREATE TABLE `Provider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Provider_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerId` INTEGER NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_id_key`(`id`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `userId` INTEGER NOT NULL,
    `nickname` VARCHAR(30) NOT NULL,
    `imageUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Token` (
    `userId` INTEGER NOT NULL,
    `refreshToken` VARCHAR(255) NOT NULL,
    `expiresAt` INTEGER NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MoodCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlcoholCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMoodCategory` (
    `userId` INTEGER NOT NULL,
    `moodCategoryId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `moodCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAlcoholCategory` (
    `userId` INTEGER NOT NULL,
    `alcoholCategoryId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `alcoholCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Token` ADD CONSTRAINT `Token_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMoodCategory` ADD CONSTRAINT `UserMoodCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMoodCategory` ADD CONSTRAINT `UserMoodCategory_moodCategoryId_fkey` FOREIGN KEY (`moodCategoryId`) REFERENCES `MoodCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlcoholCategory` ADD CONSTRAINT `UserAlcoholCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlcoholCategory` ADD CONSTRAINT `UserAlcoholCategory_alcoholCategoryId_fkey` FOREIGN KEY (`alcoholCategoryId`) REFERENCES `AlcoholCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
