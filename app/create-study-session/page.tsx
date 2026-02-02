'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateStudySessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    goal: '',
    timeAvailable: '60', // minutes
    remindAfter: '45', // minutes
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.topic.trim()) {
      setError('Please enter a study topic');
      setLoading(false);
      return;
    }
    if (!formData.goal.trim()) {
      setError('Please enter your study goal');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/create-study-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create session' }));
        throw new Error(errorData?.error || res.statusText);
      }

      const data = await res.json();
      
      // Redirect to run page with runId as path parameter
      router.push(`/agent/run/${data.runId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create study session');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-linear-to-r from-purple-500 to-pink-500 px-8 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">Create Study Session</h1>
            <p className="text-purple-50 text-sm">Set up your personalized study plan with AI coaching</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <form onSubmit={handleCreateSession} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Topic Input */}
              <div>
                <label htmlFor="topic" className="block text-sm font-semibold text-slate-700 mb-2">
                  What do you want to study? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="e.g., Python decorators, Machine Learning basics, Spanish grammar"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500 mt-1">Be specific about the topic you want to learn</p>
              </div>

              {/* Goal Input */}
              <div>
                <label htmlFor="goal" className="block text-sm font-semibold text-slate-700 mb-2">
                  What&apos;s your learning goal? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g., Understand how decorators work and be able to write custom decorators, Learn the main concepts of ML including supervised and unsupervised learning"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">Describe what you want to achieve by the end of this session</p>
              </div>

              {/* Time Available */}
              <div>
                <label htmlFor="timeAvailable" className="block text-sm font-semibold text-slate-700 mb-2">
                  How much time do you have? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    id="timeAvailable"
                    name="timeAvailable"
                    value={formData.timeAvailable}
                    onChange={handleChange}
                    min="15"
                    max="480"
                    step="15"
                    className="w-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                  <span className="text-slate-600 font-medium">minutes</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Session will be optimized for your available time</p>
              </div>

              {/* Reminder Timing */}
              <div>
                <label htmlFor="remindAfter" className="block text-sm font-semibold text-slate-700 mb-2">
                  Send reminder after <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    id="remindAfter"
                    name="remindAfter"
                    value={formData.remindAfter}
                    onChange={handleChange}
                    min="5"
                    max="300"
                    step="5"
                    className="w-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                  <span className="text-slate-600 font-medium">minutes</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Get reminded to review or continue your session</p>
              </div>

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">✨ What happens next:</span>
                </p>
                <ul className="text-sm text-slate-600 mt-2 space-y-1 ml-4">
                  <li>• Our AI coach will analyze your goal</li>
                  <li>• Create a personalized study plan with tasks</li>
                  <li>• Suggest relevant resources</li>
                  <li>• Send you a reminder email to keep you on track</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating your study session…
                  </span>
                ) : (
                  'Start Learning 🚀'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-slate-300 text-sm">
          <p>Powered by AI • Personalized Learning • Real-time Tracking</p>
        </div>
      </div>
    </div>
  );
}
