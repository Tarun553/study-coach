"use client";

import { useEffect, useState } from "react";

type AgentRun = {
  id: string;
  topic: string;
  status: string;
  iteration: number;
  goal?: string;
};

type StudyTask = {
  id: string;
  runId: string;
  title: string;
  done: boolean;
  order: number;
};

type Resource = { id: string; runId: string; title: string; url: string };

type ReminderJob = {
  id: string;
  runId: string;
  minutes: number;
  sent: boolean;
  createdAt: string;
};

export default function RunPageClient({ runId }: { runId: string }) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reminders, setReminders] = useState<ReminderJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [runsRes, tasksRes, resourcesRes, remindersRes] = await Promise.all([
        fetch("/api/dashboard/runs", { cache: "no-store" }),
        fetch("/api/dashboard/tasks", { cache: "no-store" }),
        fetch("/api/dashboard/resources", { cache: "no-store" }),
        fetch("/api/agent/reminders", { cache: "no-store" }),
      ]);

      // Check for authentication errors
      if (runsRes.status === 401) {
        console.error("[UI] Not authenticated - redirecting to sign in");
        window.location.href = "/sign-in";
        return;
      }

      const runsData = await runsRes.json();
      const tasksData = await tasksRes.json();
      const resourcesData = await resourcesRes.json();
      const remindersData = await remindersRes.json();
      
      console.log("[UI] Fetched data for runId:", runId);
      console.log("[UI] Total runs:", runsData.runs?.length);
      console.log("[UI] Total tasks:", tasksData.tasks?.length);
      console.log("[UI] Total resources:", resourcesData.resources?.length);

      // ✅ MUST select run by the URL param (runId). No fallback.
      const currentRun = runsData.runs?.find((r: AgentRun) => r.id === runId);

      if (!currentRun) {
        console.error(`[UI] Run ${runId} not found in user's runs`);
        console.log(`[UI] Available runs:`, runsData.runs?.map((r: AgentRun) => r.id));
        setRun(null);
        setTasks([]);
        setResources([]);
        setReminders([]);
        setErrorMessage(
          runsData.runs?.length === 0
            ? "You don't have any study sessions yet. Create one to get started!"
            : "This study session doesn't belong to your account or doesn't exist."
        );
        return;
      }
      
      setErrorMessage(null);

      setRun(currentRun);

      const filteredTasks = (tasksData.tasks || []).filter(
        (t: StudyTask) => t.runId === currentRun.id
      );

      const filteredResources = (resourcesData.resources || []).filter(
        (r: Resource) => r.runId === currentRun.id
      );

      const filteredReminders = (remindersData.reminders || []).filter(
        (rm: ReminderJob) => rm.runId === currentRun.id
      );

      setTasks(filteredTasks);
      setResources(filteredResources);
      setReminders(filteredReminders);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Polling: fetch immediately, then every 5s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  // time elapsed
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  async function toggleTask(taskId: string, currentDone: boolean) {
    setUpdating(taskId);
    try {
      const res = await fetch("/api/task/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, done: !currentDone }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, done: !currentDone } : t
          )
        );
      }
    } catch (err) {
      console.error("Error toggling task:", err);
    } finally {
      setUpdating(null);
    }
  }

  const completedTasks = tasks.filter((t) => t.done).length;
  const taskProgress =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const nextReminder = reminders.find((r) => !r.sent);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your study session...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Study session not found</h1>
          <p className="text-slate-300 mb-6">
            {errorMessage || "This study session doesn't exist or you don't have access to it."}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/create-study-session"
              className="inline-block px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              Create New Study Session
            </a>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 border border-slate-500 text-slate-300 font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              View My Sessions
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {run.topic}
              </h1>
              <p className="text-slate-300">{run.goal}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-2 rounded-full bg-purple-500 text-white text-sm font-semibold">
                {run.status}
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Iteration: {run.iteration}
              </p>
              <p className="text-slate-400 text-sm">
                Time: {formatTime(timeElapsed)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-linear-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            ></div>
          </div>
          <p className="text-slate-300 text-sm mt-2">
            {completedTasks}/{tasks.length} tasks completed
          </p>
        </div>

        {/* Reminder Alert */}
        {nextReminder && (
          <div className="mb-6 bg-amber-500 bg-opacity-20 border border-amber-500 rounded-lg p-4 flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <p className="text-white font-semibold">Reminder Scheduled</p>
              <p className="text-amber-100 text-sm">
                You&apos;ll get an email reminder in {nextReminder.minutes} minutes
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">✓</span> Your Tasks
              </h2>

              {tasks.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  AI is generating your personalized tasks...
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks
                    .sort((a, b) => a.order - b.order)
                    .map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition ${
                          task.done
                            ? "bg-slate-700 bg-opacity-30"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(task.id, task.done)}
                          disabled={updating === task.id}
                          className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                            task.done
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-500 hover:border-emerald-500"
                          }`}
                        >
                          {task.done && (
                            <span className="text-white text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                        <span
                          className={`flex-1 text-lg ${
                            task.done
                              ? "line-through text-slate-500"
                              : "text-white"
                          }`}
                        >
                          {task.title}
                        </span>
                        {updating === task.id && (
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Resources Section */}
          <div>
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-xl border border-slate-700 p-6 h-full">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span> Resources
              </h2>

              {resources.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">
                  AI is gathering relevant resources...
                </p>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition group"
                    >
                      <p className="text-white text-sm font-medium group-hover:text-purple-400 transition">
                        {resource.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-1 truncate group-hover:text-slate-300 transition">
                        🔗 {new URL(resource.url).hostname}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-lg border border-slate-700 p-4 text-center">
            <p className="text-slate-400 text-sm">Tasks</p>
            <p className="text-2xl font-bold text-purple-400">{tasks.length}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-lg border border-slate-700 p-4 text-center">
            <p className="text-slate-400 text-sm">Resources</p>
            <p className="text-2xl font-bold text-pink-400">{resources.length}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-lg border border-slate-700 p-4 text-center">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-emerald-400">{completedTasks}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-lg border border-slate-700 p-4 text-center">
            <p className="text-slate-400 text-sm">Iteration</p>
            <p className="text-2xl font-bold text-cyan-400">{run.iteration}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
