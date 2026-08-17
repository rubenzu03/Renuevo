-- CreateEnum
CREATE TYPE "BankProvider" AS ENUM ('mock');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('connected', 'error');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'accepted', 'dismissed');

-- CreateTable
CREATE TABLE "bank_connection" (
    "id" TEXT NOT NULL,
    "provider" "BankProvider" NOT NULL DEFAULT 'mock',
    "institutionName" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'connected',
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transaction" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggested_subscription" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "merchant_name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "occurrences" INTEGER NOT NULL,
    "first_seen" TIMESTAMP(3) NOT NULL,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggested_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_transaction_connection_id_date_idx" ON "bank_transaction"("connection_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transaction_connection_id_external_id_key" ON "bank_transaction"("connection_id", "external_id");

-- CreateIndex
CREATE INDEX "suggested_subscription_connection_id_status_idx" ON "suggested_subscription"("connection_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "suggested_subscription_connection_id_merchant_name_key" ON "suggested_subscription"("connection_id", "merchant_name");

-- AddForeignKey
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bank_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggested_subscription" ADD CONSTRAINT "suggested_subscription_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bank_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
