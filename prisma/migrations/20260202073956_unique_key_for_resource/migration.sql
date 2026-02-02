/*
  Warnings:

  - A unique constraint covering the columns `[runId,url]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Resource_runId_url_key" ON "Resource"("runId", "url");
