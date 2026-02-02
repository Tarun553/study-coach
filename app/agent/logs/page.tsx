'use client';

import { useEffect, useState } from 'react';

type StepLog = {
  id: string;
  runId: string;
  kind: string;
  payload: any;
  createdAt: string;
};

export default function AgentLogsPage() {
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchLogs() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/logs');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // refresh every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Agent Step Logs</h1>
              <p className="text-slate-400">Real-time execution logs</p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Logs */}
        {loading && !logs.length ? (
          <div className="text-center text-slate-400 py-12">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p>No logs yet. Trigger an agent run to see logs here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition backdrop-blur"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-300">
                        {log.kind}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Run ID</p>
                      <p className="text-slate-200 font-mono text-sm">{log.runId.slice(0, 12)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Time</p>
                    <p className="text-slate-200 text-sm">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <pre className="bg-slate-950 rounded-lg p-4 overflow-auto max-h-64 text-slate-300 text-xs border border-slate-700">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
