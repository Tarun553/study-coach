

import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { chatModel } from "@/lib/gemini";
import { sendReminderEmail } from "@/lib/email";

type Plan =
  | { tool: "create_tasks"; args: { tasks: string[] }; done: false; message?: string }
  | { tool: "add_resources"; args: { resources: { title: string; url: string }[] }; done: false; message?: string }
  | { tool: "schedule_reminder"; args: { minutes: number }; done: false; message?: string }
  | { tool: "finish"; args?: {}; done: true; message?: string }
  | { tool: "finish"; args?: {}; done?: false; message?: string };

export const agentRun = inngest.createFunction(
  { id: "agent/run" },
  { event: "agent/run.requested" },
  async ({ event, step }) => {
    const { runId } = event.data as { runId: string };

    const run = await step.run("load-run", async () => {
      const r = await prisma.agentRun.findUnique({ where: { id: runId } });
      if (!r) throw new Error("AgentRun not found");
      return r;
    });

    // Safety guard
    if (run.iteration >= 10) {
      await step.run("mark-failed-max-iterations", async () => {
        await prisma.agentRun.update({
          where: { id: run.id },
          data: { status: "FAILED" },
        });
      });
      throw new Error("Max iterations reached");
    }

    // On first iteration, schedule the reminder WITHOUT blocking
    if (run.iteration === 0) {
      const remindAfter = (run.state as any)?.remindAfterMinutes ?? 45;

      // Schedule reminder event (NOT inside step.run - prevents nesting)
      await step.sendEvent("send-reminder-event", {
        name: "agent/reminder.requested",
        data: {
          runId: run.id,
          userId: run.userId,
          topic: run.topic,
          minutes: remindAfter,
        },
        // Schedule for future execution
        ts: Date.now() + (remindAfter * 60 * 1000),
      });

      await step.run("log-reminder-scheduled", async () => {
        await prisma.agentStepLog.create({
          data: { 
            runId: run.id, 
            kind: "REMINDER_SCHEDULED", 
            payload: { delayMinutes: remindAfter, scheduledAt: new Date().toISOString() } 
          },
        });
      });
    }

    const snapshot = await step.run("load-snapshot", async () => {
      const [tasksCount, resourcesCount] = await Promise.all([
        prisma.studyTask.count({ where: { runId: run.id } }),
        prisma.resource.count({ where: { runId: run.id } }),
      ]);

      return { tasksCount, resourcesCount };
    });

    const plan = await step.run("plan-next-action", async () => {
      const prompt = `
You are a Study Coach Agent.

Return ONLY valid JSON. No markdown.

You can choose one tool:
- create_tasks: { tasks: string[] }  (3-7 tasks max)
- add_resources: { resources: [{title, url}] } (1-4 items, real URLs starting with https://)
- schedule_reminder: { minutes: number } (like 60 or 1440)
- finish: {}

Output must match ONE of these shapes:

{"tool":"create_tasks","args":{"tasks":["..."]},"done":false,"message":"..."}
{"tool":"add_resources","args":{"resources":[{"title":"...","url":"https://..."}]},"done":false,"message":"..."}
{"tool":"schedule_reminder","args":{"minutes":1440},"done":false,"message":"..."}
{"tool":"finish","done":true,"message":"..."}

Run context:
topic: ${run.topic}
goal: ${run.goal ?? "none"}
timeAvailable: ${run.timeAvailable ?? "none"}
currentIteration: ${run.iteration}

Existing data:
tasksCount: ${snapshot.tasksCount}
resourcesCount: ${snapshot.resourcesCount}

Decision rules:
- If tasksCount is 0 -> choose create_tasks
- Else if resourcesCount is 0 -> choose add_resources
- Else if currentIteration < 2 -> choose schedule_reminder
- Else -> choose finish
`;

      const res = await chatModel.generateContent(prompt);
      const text = res.response.text().trim();
      console.log('[INNGEST] AI Response:', text);
      return JSON.parse(text) as Plan;
    });

    await step.run("log-plan", async () => {
      console.log('[INNGEST] Plan:', plan);
      await prisma.agentStepLog.create({
        data: { runId: run.id, kind: "PLAN", payload: plan as any },
      });
    });

    // Handle schedule_reminder separately (to avoid nesting step.sendEvent)
    if (plan.tool === "schedule_reminder") {
      const minutes = plan.args?.minutes;
      if (typeof minutes !== "number" || minutes <= 0) {
        throw new Error("schedule_reminder: minutes must be a positive number");
      }

      // Schedule a delayed reminder event (NOT nested in step.run)
      await step.sendEvent("schedule-reminder", {
        name: "agent/reminder.requested",
        data: { runId: run.id, minutes },
        ts: Date.now() + (minutes * 60 * 1000),
      });

      await step.run("log-schedule-reminder", async () => {
        await prisma.agentStepLog.create({
          data: { runId: run.id, kind: "TOOL", payload: { tool: "schedule_reminder", minutes } },
        });
      });
    } else {
      // Execute other tools
      await step.run("execute-tool", async () => {
      if (plan.tool === "create_tasks") {
        const tasks = plan.args?.tasks ?? [];
        if (!Array.isArray(tasks) || tasks.length === 0) {
          throw new Error("create_tasks: tasks array is missing/empty");
        }

        const created = await prisma.studyTask.createMany({
          data: tasks.map((title, idx) => ({ runId: run.id, title, order: idx })),
          skipDuplicates: true,
        });

        console.log(`[INNGEST] Created ${created.count} tasks for run ${run.id}`);

        await prisma.agentStepLog.create({
          data: { runId: run.id, kind: "TOOL", payload: { tool: "create_tasks", inserted: tasks.length } },
        });

        return;
      }

      if (plan.tool === "add_resources") {
        const resources = plan.args?.resources ?? [];
        if (!Array.isArray(resources) || resources.length === 0) {
          throw new Error("add_resources: resources array is missing/empty");
        }

        // basic validation
        const cleaned = resources
          .filter((r) => r?.title && r?.url && typeof r.url === "string" && r.url.startsWith("https://"))
          .slice(0, 6);

        if (cleaned.length === 0) throw new Error("add_resources: no valid https:// URLs returned");

        const created = await prisma.resource.createMany({
          data: cleaned.map((r) => ({ runId: run.id, title: r.title, url: r.url })),
          // no unique constraint here; if you want true idempotency add @@unique([runId,url]) in schema
          skipDuplicates: true,
        });

        console.log(`[INNGEST] Created ${created.count} resources for run ${run.id}`);

        await prisma.agentStepLog.create({
          data: { runId: run.id, kind: "TOOL", payload: { tool: "add_resources", inserted: cleaned.length } },
        });

        return;
      }

      if (plan.tool === "finish") {
        await prisma.agentStepLog.create({
          data: { runId: run.id, kind: "TOOL", payload: { tool: "finish" } },
        });
        return;
      }

        // If unknown tool, fail fast (prevents infinite loops)
        throw new Error(`Unknown tool: ${(plan as any).tool}`);
      });
    }

    // Increment iteration AFTER tool execution
    await step.run("increment-iteration", async () => {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { iteration: { increment: 1 } },
      });
    });

    // Complete or continue
    if (plan.done || plan.tool === "finish") {
      await step.run("mark-completed", async () => {
        await prisma.agentRun.update({
          where: { id: run.id },
          data: { status: "COMPLETED" },
        });
      });

      return { ok: true, plan };
    }

    // Continue loop
    await step.sendEvent("continue-run", {
      name: "agent/run.requested",
      data: { runId: run.id },
      // If your SDK doesn't accept delay, delete this:
      // @ts-ignore
      delay: "2s",
    });

    return { ok: true, plan };
  }
);


export const agentReminder = inngest.createFunction(
  { id: "agent/reminder" },
  { event: "agent/reminder.requested" },
  async ({ event, step }) => {
    const { runId, minutes } = event.data as { runId: string; minutes: number };

    const run = await step.run("load-run", async () => {
      const r = await prisma.agentRun.findUnique({
        where: { id: runId },
        include: { user: true },
      });
      if (!r) throw new Error("AgentRun not found");
      return r;
    });

    // Create ReminderJob entry
    const reminderJob = await step.run("create-reminder-job", async () => {
      return await prisma.reminderJob.create({
        data: {
          runId: run.id,
          minutes,
          sent: false,
        },
      });
    });

    // Send email if user has email
    let emailSent = false;
    if (run.user.email) {
      emailSent = await step.run("send-reminder-email", async () => {
        try {
          await sendReminderEmail({
            to: run.user.email!,
            topic: run.topic,
            runId: run.id,
          });
          return true;
        } catch (err) {
          console.error("Failed to send email:", err);
          return false;
        }
      });
    }

    // Mark ReminderJob as sent
    await step.run("mark-reminder-sent", async () => {
      await prisma.reminderJob.update({
        where: { id: reminderJob.id },
        data: { sent: true },
      });
    });

    // Log the reminder
    await step.run("log-reminder", async () => {
      await prisma.agentStepLog.create({
        data: {
          runId: run.id,
          kind: "RESULT",
          payload: {
            message: "Reminder fired",
            minutes,
            topic: run.topic,
            emailSent,
            reminderJobId: reminderJob.id,
          },
        },
      });
    });

    console.log(
      `[REMINDER] Run ${runId} (${run.topic}) after ${minutes} minutes. Email: ${emailSent}`
    );

    return { ok: true, emailSent, reminderJobId: reminderJob.id };
  }
);

