-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bodyFatPercent" DECIMAL(5,2),
ADD COLUMN     "bodyWaterPercent" DECIMAL(5,2),
ADD COLUMN     "hipsCm" DECIMAL(6,2),
ADD COLUMN     "muscleMassKg" DECIMAL(6,2),
ADD COLUMN     "waistCm" DECIMAL(6,2),
ADD COLUMN     "weightKg" DECIMAL(6,2);
