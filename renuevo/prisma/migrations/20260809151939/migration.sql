/*
  Warnings:

  - A unique constraint covering the columns `[price_history_id]` on the table `NotificationLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "price_history_id" TEXT,
ALTER COLUMN "billing_cycle_start" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_price_history_id_key" ON "NotificationLog"("price_history_id");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_price_history_id_fkey" FOREIGN KEY ("price_history_id") REFERENCES "PriceHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
