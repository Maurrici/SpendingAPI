/*
  Warnings:

  - Added the required column `name` to the `Spending` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spending" ADD COLUMN     "name" TEXT NOT NULL;
