-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN     "energyLevel" INTEGER,
ADD COLUMN     "stressLevel" INTEGER;

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "confidenceScore" DECIMAL(3,2);

-- CreateTable
CREATE TABLE "LabPanel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labResultId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabMetric" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "value" DECIMAL(12,4),
    "unit" TEXT,
    "refLow" DECIMAL(12,4),
    "refHigh" DECIMAL(12,4),
    "flag" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabPanel_userId_date_idx" ON "LabPanel"("userId", "date");

-- CreateIndex
CREATE INDEX "LabMetric_panelId_code_idx" ON "LabMetric"("panelId", "code");

-- AddForeignKey
ALTER TABLE "LabPanel" ADD CONSTRAINT "LabPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabPanel" ADD CONSTRAINT "LabPanel_labResultId_fkey" FOREIGN KEY ("labResultId") REFERENCES "LabResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabMetric" ADD CONSTRAINT "LabMetric_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "LabPanel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
