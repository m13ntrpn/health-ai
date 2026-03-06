/*
  Warnings:

  - You are about to drop the column `age` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bodyFatPercent` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bodyWaterPercent` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `hipsCm` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `muscleMassKg` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `waistCm` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `weightKg` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "distanceM" INTEGER,
ADD COLUMN     "steps" INTEGER;

-- AlterTable
ALTER TABLE "SleepLog" ADD COLUMN     "awakeMin" INTEGER,
ADD COLUMN     "deepMin" INTEGER,
ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "remMin" INTEGER;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "age",
DROP COLUMN "bodyFatPercent",
DROP COLUMN "bodyWaterPercent",
DROP COLUMN "hipsCm",
DROP COLUMN "muscleMassKg",
DROP COLUMN "waistCm",
DROP COLUMN "weightKg",
ADD COLUMN     "alcoholUse" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "bloodPressureDia" INTEGER,
ADD COLUMN     "bloodPressureSys" INTEGER,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "bmrCalories" INTEGER,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "dietType" TEXT,
ADD COLUMN     "intolerances" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restingHeartRateBpm" INTEGER,
ADD COLUMN     "rhFactor" TEXT,
ADD COLUMN     "smokingStatus" TEXT,
ADD COLUMN     "targetCalories" INTEGER,
ADD COLUMN     "targetCarbsG" DECIMAL(6,2),
ADD COLUMN     "targetFatG" DECIMAL(6,2),
ADD COLUMN     "targetProteinG" DECIMAL(6,2),
ADD COLUMN     "targetSteps" INTEGER,
ADD COLUMN     "targetWaterMl" INTEGER,
ADD COLUMN     "targetWeightKg" DECIMAL(6,2),
ADD COLUMN     "tdeeCalories" INTEGER,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(6,2),
    "waistCm" DECIMAL(6,2),
    "hipsCm" DECIMAL(6,2),
    "bodyFatPercent" DECIMAL(5,2),
    "muscleMassKg" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "schedule" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMeasurement_userId_measuredAt_idx" ON "BodyMeasurement"("userId", "measuredAt");

-- CreateIndex
CREATE INDEX "MedicationPlan_userId_idx" ON "MedicationPlan"("userId");

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPlan" ADD CONSTRAINT "MedicationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
