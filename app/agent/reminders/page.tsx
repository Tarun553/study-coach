'use client';

import { useEffect, useState } from 'react';

type ReminderJob = {
  id: string;
  runId: string;
  minutes: number;
  sent: boolean;
  createdAt: string;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderJob[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchReminders() {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/reminders');
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Reminder Jobs</h1>
          <p className="text-slate-400">Track scheduled and sent reminders</p>
        </div>

        {/* Content */}
        {loading && reminders.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p>No reminders scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-6 rounded-xl border backdrop-blur transition ${
                  reminder.sent
                    ? 'bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      Run ID: <span className="font-mono text-cyan-400">{reminder.runId.slice(0, 12)}...</span>
                    </div>
                    <div className="text-slate-300 text-sm mt-2">
                      ⏱ Scheduled for <span className="font-semibold">{reminder.minutes}</span> minute{reminder.minutes !== 1 ? 's' : ''}
                    </div>
                    <div className="text-slate-400 text-xs mt-2">
                      Created: {new Date(reminder.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex items-center gap-2 ${
                      reminder.sent
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                    }`}
                  >
                    {reminder.sent ? (
                      <>
                        <span className="text-lg">✓</span>Sent
                      </>
                    ) : (
                      <>
                        <span className="animate-pulse text-lg">⏳</span>Pending
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
