'use client';

import { useState } from 'react';

export default function AgentStartPage() {
  const [runId, setRunId] = useState('test-run-id');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const res = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);
      setMessage(text || 'Agent run started');
      setSuccess(true);
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRun() {
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const res = await fetch('/api/agent/create-test-run', { method: 'POST' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData?.error || res.statusText);
      }

      const data = await res.json();
      setRunId(data.runId);
      setMessage('✓ Created run ' + data.runId.slice(0, 8));
      setSuccess(true);
    } catch (err: any) {
      setMessage('Error creating run: ' + (err?.message || String(err)));
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-8">
            <h1 className="text-2xl font-bold text-white mb-2">Study Coach Agent</h1>
            <p className="text-teal-50 text-sm">Start your personalized learning session</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <form onSubmit={handleStart} className="space-y-6">
              {/* Run ID Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Run ID</label>
                <input
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  placeholder="test-run-id"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting…
                    </span>
                  ) : (
                    'Start Agent'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setRunId('test-run-id'); setMessage(''); }}
                  className="px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Reset
                </button>
              </div>

              {/* Create Run Button */}
              <button
                type="button"
                onClick={handleCreateRun}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 transition"
              >
                {loading ? 'Creating…' : '+ Create Test Run'}
              </button>
            </form>

            {/* Response Message */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-semibold mb-1 flex items-center gap-2">
                  {success ? '✓' : '✕'} {success ? 'Success' : 'Error'}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">{message}</div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Tip:</span> Ensure Inngest dev server runs at{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">localhost:8288</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
