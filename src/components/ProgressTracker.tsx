'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface ProgressData {
  jobId: number;
  status: string;
  progress: number;
  total: number;
  currentChapter: string | null;
  errorMessage: string | null;
}

interface ProgressTrackerProps {
  jobId: number;
  onComplete?: () => void;
}

export default function ProgressTracker({ jobId, onComplete }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/scrape/${jobId}`);
      if (!res.ok) return;
      const data = await res.json();
      const job = data.job;

      const progressData: ProgressData = {
        jobId: job.id,
        status: job.status,
        progress: job.progress || 0,
        total: job.total || 0,
        currentChapter: job.currentChapter,
        errorMessage: job.errorMessage,
      };

      setProgress(progressData);

      if (job.status === 'completed' || job.status === 'error') {
        onComplete?.();
        return true; // signal to stop polling
      }
    } catch {
      // ignore errors
    }
    return false;
  }, [jobId, onComplete]);

  useEffect(() => {
    // Initial fetch
    fetchProgress();

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const done = await fetchProgress();
      if (done) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchProgress]);

  if (!progress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading progress...</span>
        </div>
      </div>
    );
  }

  const percentage = progress.total > 0 ? Math.round((progress.progress / progress.total) * 100) : 0;

  const statusConfig = {
    queued: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Queued' },
    running: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Running' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
  };

  const status = statusConfig[progress.status as keyof typeof statusConfig] || statusConfig.queued;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scraping Progress</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.bg}`}>
          <StatusIcon
            className={`w-4 h-4 ${status.color} ${progress.status === 'running' ? 'animate-spin' : ''}`}
          />
          <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>
            {progress.progress} / {progress.total} chapters
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              progress.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Current Chapter */}
      {progress.currentChapter && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Current:</span> {progress.currentChapter}
        </div>
      )}

      {/* Error Message */}
      {progress.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{progress.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
