/**
 * Test script to verify inngest event flow
 * Run with: npx tsx test-inngest-flow.ts
 */

import { prisma } from "./lib/prisma";
import { inngest } from "./inngest/client";

async function testInngestFlow() {
  console.log("🧪 Testing Inngest Flow\n");

  // 1. Find the latest run
  const latestRun = await prisma.agentRun.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestRun) {
    console.log("❌ No runs found in database");
    return;
  }

  console.log("✓ Found run:", {
    id: latestRun.id,
    topic: latestRun.topic,
    status: latestRun.status,
    iteration: latestRun.iteration,
  });

  // 2. Check existing tasks
  const tasks = await prisma.studyTask.findMany({
    where: { runId: latestRun.id },
  });
  console.log(`✓ Existing tasks: ${tasks.length}`);
  tasks.forEach((t, i) => console.log(`  ${i + 1}. ${t.title}`));

  // 3. Check existing resources
  const resources = await prisma.resource.findMany({
    where: { runId: latestRun.id },
  });
  console.log(`✓ Existing resources: ${resources.length}`);
  resources.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} - ${r.url}`));

  // 4. Check logs
  const logs = await prisma.agentStepLog.findMany({
    where: { runId: latestRun.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(`✓ Recent logs: ${logs.length}`);
  logs.forEach((log, i) => {
    console.log(`  ${i + 1}. [${log.kind}] ${JSON.stringify(log.payload).substring(0, 60)}...`);
  });

  // 5. Send test event
  console.log("\n🚀 Sending test event to inngest...");
  try {
    const eventIds = await inngest.send({
      name: "agent/run.requested",
      data: { runId: latestRun.id },
    });
    console.log("✓ Event sent successfully:", eventIds);
    console.log("\n⏳ Wait a few seconds and check the inngest dev server logs");
    console.log("   Tasks and resources should be created automatically");
  } catch (error) {
    console.error("❌ Failed to send event:", error);
  }

  // Wait a bit
  console.log("\n⏳ Waiting 10 seconds for processing...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // 6. Check if new data was created
  const newTasks = await prisma.studyTask.findMany({
    where: { runId: latestRun.id },
  });
  const newResources = await prisma.resource.findMany({
    where: { runId: latestRun.id },
  });

  console.log("\n📊 After processing:");
  console.log(`  Tasks: ${tasks.length} → ${newTasks.length}`);
  console.log(`  Resources: ${resources.length} → ${newResources.length}`);

  if (newTasks.length > tasks.length) {
    console.log("\n✅ SUCCESS! New tasks were created:");
    newTasks.slice(tasks.length).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title}`);
    });
  } else {
    console.log("\n⚠️  No new tasks created. Check inngest dev server logs for errors.");
  }
}

testInngestFlow()
  .then(() => {
    console.log("\n✓ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
