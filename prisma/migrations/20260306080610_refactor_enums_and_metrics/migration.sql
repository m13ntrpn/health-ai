/*
  Warnings:

  - The `intensity` column on the `ActivityLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `distanceM` on the `ActivityLog` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - The `flags` column on the `DailySummary` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `category` column on the `IntakeItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Meal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sex` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `activityLevel` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `alcoholUse` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `smokingStatus` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `kind` on the `FileAsset` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('never', 'former', 'current');

-- CreateEnum
CREATE TYPE "AlcoholUse" AS ENUM ('none', 'rare', 'moderate', 'high');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');

-- CreateEnum
CREATE TYPE "IntakeCategory" AS ENUM ('vitamin', 'medicine', 'other');

-- CreateEnum
CREATE TYPE "ActivityIntensity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('photo_food', 'lab', 'other');

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "intensity",
ADD COLUMN     "intensity" "ActivityIntensity",
ALTER COLUMN "distanceM" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "BodyMeasurement" ADD COLUMN     "bodyWaterPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "DailySummary" DROP COLUMN "flags",
ADD COLUMN     "flags" JSONB;

-- AlterTable
ALTER TABLE "FileAsset" DROP COLUMN "kind",
ADD COLUMN     "kind" "FileKind" NOT NULL;

-- AlterTable
ALTER TABLE "IntakeItem" DROP COLUMN "category",
ADD COLUMN     "category" "IntakeCategory";

-- AlterTable
ALTER TABLE "Meal" DROP COLUMN "type",
ADD COLUMN     "type" "MealType";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "sex",
ADD COLUMN     "sex" "Sex",
DROP COLUMN "activityLevel",
ADD COLUMN     "activityLevel" "ActivityLevel",
DROP COLUMN "alcoholUse",
ADD COLUMN     "alcoholUse" "AlcoholUse",
DROP COLUMN "smokingStatus",
ADD COLUMN     "smokingStatus" "SmokingStatus";
