-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "isGuestAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isScreenSharing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isWaitingRoom" BOOLEAN NOT NULL DEFAULT true;
