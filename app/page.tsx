'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900 bg-opacity-50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Study Coach
          </div>
          <Link href="/create-study-session" className="px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition text-white font-semibold">
            Start Learning
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Learn Smarter with <span className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI Coaching</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Your personal AI study coach creates customized learning plans, suggests resources, and keeps you on track with intelligent reminders.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/create-study-session" className="px-8 py-4 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition text-white font-semibold text-lg">
                Create Study Session 🚀
              </Link>
              <Link href="/agent/run" className="px-8 py-4 border-2 border-slate-500 rounded-lg hover:border-slate-400 transition text-white font-semibold text-lg">
                View Active Session
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-700">
              <div>
                <p className="text-3xl font-bold text-purple-400">AI-Powered</p>
                <p className="text-slate-400 text-sm">Gemini for planning</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-400">Real-time</p>
                <p className="text-slate-400 text-sm">Live progress tracking</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-400">Email</p>
                <p className="text-slate-400 text-sm">Smart reminders</p>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="space-y-6">
            {[
              {
                icon: '🎯',
                title: 'Smart Planning',
                desc: 'AI analyzes your goals and creates a personalized learning roadmap',
              },
              {
                icon: '📚',
                title: 'Resource Discovery',
                desc: 'Automatically finds relevant articles, tutorials, and learning materials',
              },
              {
                icon: '✓',
                title: 'Task Management',
                desc: 'Break down complex topics into manageable, actionable tasks',
              },
              {
                icon: '🔔',
                title: 'Smart Reminders',
                desc: 'Get email reminders to stay motivated and on track',
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                desc: 'Monitor your learning progress in real-time with visual stats',
              },
              {
                icon: '⚡',
                title: 'Instant Feedback',
                desc: 'Receive guidance based on your learning goals and pace',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-800 bg-opacity-50 backdrop-blur border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition hover:bg-slate-800 hover:bg-opacity-70">
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-linear-to-b from-transparent to-slate-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">How It Works</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Three simple steps to transform your learning experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '1',
                title: 'Create Session',
                steps: [
                  'Tell us what you want to learn',
                  'Set your learning goal',
                  'Specify available time',
                ],
              },
              {
                num: '2',
                title: 'AI Plans',
                steps: [
                  'AI analyzes your goal',
                  'Creates a study plan',
                  'Gathers resources',
                ],
              },
              {
                num: '3',
                title: 'Learn & Track',
                steps: [
                  'Complete AI-generated tasks',
                  'Access curated resources',
                  'Get email reminders',
                ],
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur border border-slate-700 rounded-xl p-8">
                  <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                  <ul className="space-y-3">
                    {step.steps.map((s, j) => (
                      <li key={j} className="flex items-start gap-3 text-slate-300">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="text-3xl text-slate-600">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Learn Smarter?</h2>
          <p className="text-purple-100 mb-8 text-lg">Create your first personalized study session today</p>
          <Link href="/create-study-session" className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-slate-100 transition font-semibold text-lg">
            Get Started Now 🎓
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center text-slate-400 text-sm">
        <p>Study Coach • Powered by AI • Personalized Learning for Everyone</p>
      </footer>
    </div>
  );
}