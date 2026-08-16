/*
  Warnings:

  - You are about to drop the column `institutionName` on the `bank_connection` table. All the data in the column will be lost.
  - Added the required column `institution_name` to the `bank_connection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bank_connection" DROP COLUMN "institutionName",
ADD COLUMN     "institution_name" TEXT NOT NULL;
