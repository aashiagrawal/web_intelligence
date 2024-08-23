-- CreateTable
CREATE TABLE "WebsiteInfo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "metaData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteInfo_pkey" PRIMARY KEY ("id")
);
