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
ALTER TABLE `UserMoodCategory` ADD CONSTRAINT `UserMoodCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMoodCategory` ADD CONSTRAINT `UserMoodCategory_moodCategoryId_fkey` FOREIGN KEY (`moodCategoryId`) REFERENCES `MoodCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlcoholCategory` ADD CONSTRAINT `UserAlcoholCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlcoholCategory` ADD CONSTRAINT `UserAlcoholCategory_alcoholCategoryId_fkey` FOREIGN KEY (`alcoholCategoryId`) REFERENCES `AlcoholCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
