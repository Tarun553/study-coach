'use client';

import { useEffect, useState } from 'react';

type AgentRun = { id: string; topic: string; status: string; iteration: number; createdAt: string };
type StudyTask = { id: string; runId: string; title: string; done: boolean; order: number };
type Resource = { id: string; runId: string; title: string; url: string };
type StepLog = { id: string; runId: string; kind: string; payload: any; createdAt: string };

export default function DashboardPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  async function fetchData() {
    setLoading(true);
    try {
      const [runsRes, tasksRes, resourcesRes, logsRes] = await Promise.all([
        fetch('/api/dashboard/runs'),
        fetch('/api/dashboard/tasks'),
        fetch('/api/dashboard/resources'),
        fetch('/api/dashboard/logs'),
      ]);

      const runsData = await runsRes.json();
      const tasksData = await tasksRes.json();
      const resourcesData = await resourcesRes.json();
      const logsData = await logsRes.json();

      setRuns(runsData.runs || []);
      setTasks(tasksData.tasks || []);
      setResources(resourcesData.resources || []);
      setLogs(logsData.logs || []);

      if (runsData.runs?.length && !selectedRunId) {
        setSelectedRunId(runsData.runs[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // refresh every 2s
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = tasks.filter((t) => t.runId === selectedRunId);
  const filteredResources = resources.filter((r) => r.runId === selectedRunId);
  const filteredLogs = logs.filter((l) => l.runId === selectedRunId);

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Agent Dashboard</h1>
              <p className="text-slate-400">Monitor and control your study coach agent</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Runs List */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Recent Runs</h2>
                <p className="text-xs text-slate-400 mt-1">{runs.length} total</p>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {runs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No runs yet</p>
                ) : (
                  runs.slice(0, 10).map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedRunId === run.id
                          ? 'bg-teal-500/30 border border-teal-400 shadow-lg'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold text-white text-sm truncate">{run.topic}</div>
                      <div className="text-xs text-slate-400 mt-2 flex justify-between">
                        <span className="px-2 py-1 rounded border bg-blue-100 text-blue-800">
                          {run.status}
                        </span>
                        <span>Iter: {run.iteration}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Details & Data */}
          <div className="lg:col-span-2 space-y-8">
            {/* Selected Run Info */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Run Details</h2>
              </div>
              <div className="p-6">
                {selectedRun ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Topic</p>
                      <p className="text-white font-semibold">{selectedRun.topic}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Status</p>
                      <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold border bg-blue-100 text-blue-800">
                        {selectedRun.status}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Iteration</p>
                      <p className="text-white font-semibold text-2xl">{selectedRun.iteration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Run ID</p>
                      <p className="text-white font-mono text-xs truncate">{selectedRun.id.slice(0, 16)}...</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">Select a run to view details</p>
                )}
              </div>
            </div>

            {/* Tasks, Resources, Logs Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Tasks */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-400/20 px-6 py-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Tasks</h3>
                  <p className="text-xs text-slate-400 mt-1">{filteredTasks.length} items</p>
                </div>
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">No tasks</p>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} className="p-2 bg-blue-500/10 border border-blue-400/20 rounded text-xs text-slate-200">
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500/20 to-purple-400/20 px-6 py-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Resources</h3>
                  <p className="text-xs text-slate-400 mt-1">{filteredResources.length} items</p>
                </div>
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {filteredResources.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">No resources</p>
                  ) : (
                    filteredResources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-2 bg-purple-500/10 border border-purple-400/20 rounded text-xs text-cyan-400 hover:text-cyan-300 truncate transition"
                      >
                        {res.title}
                      </a>
                    ))
                  )}
                </div>
              </div>

              {/* Logs */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 px-6 py-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Logs</h3>
                  <p className="text-xs text-slate-400 mt-1">{filteredLogs.length} entries</p>
                </div>
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">No logs</p>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-emerald-500/10 border border-emerald-400/20 rounded">
                        <div className="text-xs font-semibold text-emerald-300">{log.kind}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
