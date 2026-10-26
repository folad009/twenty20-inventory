-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('INDOOR', 'OUTDOOR');

-- CreateEnum
CREATE TYPE "SizeUnit" AS ENUM ('METERS', 'FT', 'KG', 'INCHES');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "manufacturer" TEXT,
ADD COLUMN "product_date" DATE,
ADD COLUMN "pitch" TEXT,
ADD COLUMN "type" "ProductType",
ADD COLUMN "size_unit" "SizeUnit",
ADD COLUMN "size_value" DECIMAL(12,4);
