-- DropIndex
DROP INDEX "Enquiry_email_idx";

-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN     "enquiryLimitWindowDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxEnquiriesPerEmail" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxEnquiriesPerPhone" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'ENQUIRY',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerification_email_createdAt_idx" ON "EmailVerification"("email", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "Enquiry_email_createdAt_idx" ON "Enquiry"("email", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_phone_createdAt_idx" ON "Enquiry"("phone", "createdAt");
