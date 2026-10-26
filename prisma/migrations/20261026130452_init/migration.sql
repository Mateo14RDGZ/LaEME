-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'COMING_SOON', 'AVAILABLE', 'SOLD_OUT', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PAYMENT_REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "priceUyu" INTEGER NOT NULL,
    "abvTenths" INTEGER NOT NULL,
    "volumeMl" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tastingNotes" TEXT[],
    "ingredients" TEXT[],
    "ingredientsVerified" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT NOT NULL,
    "artworkSrc" TEXT NOT NULL,
    "artworkAlt" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceUyu" INTEGER NOT NULL,
    "departments" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "isPickup" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShippingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customerId" TEXT NOT NULL,
    "subtotalUyu" INTEGER NOT NULL,
    "shippingUyu" INTEGER NOT NULL,
    "totalUyu" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "shippingCode" TEXT NOT NULL,
    "shippingLabel" TEXT NOT NULL,
    "isPickup" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "apartment" TEXT,
    "postalCode" TEXT,
    "addressNotes" TEXT,
    "reservedUntil" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productStyle" TEXT NOT NULL,
    "unitPriceUyu" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalUyu" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPreferenceId" TEXT,
    "providerPaymentId" TEXT,
    "providerStatus" TEXT,
    "amountUyu" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingOption_code_key" ON "ShippingOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE INDEX "Order_status_reservedUntil_idx" ON "Order"("status", "reservedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restricciones de integridad (no expresables en schema.prisma)
ALTER TABLE "Product" ADD CONSTRAINT "product_price_nonneg" CHECK ("priceUyu" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_stock_nonneg" CHECK ("stock" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_abv_range" CHECK ("abvTenths" BETWEEN 0 AND 300);
ALTER TABLE "Product" ADD CONSTRAINT "product_volume_positive" CHECK ("volumeMl" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "orderitem_qty_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "orderitem_line_total" CHECK ("lineTotalUyu" = "unitPriceUyu" * "quantity");
ALTER TABLE "Order" ADD CONSTRAINT "order_totals_consistent" CHECK ("totalUyu" = "subtotalUyu" + "shippingUyu" AND "subtotalUyu" >= 0 AND "shippingUyu" >= 0);
ALTER TABLE "ShippingOption" ADD CONSTRAINT "shipping_price_nonneg" CHECK ("priceUyu" >= 0);
