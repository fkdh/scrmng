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
  done?: boolean;
}

interface ProgressTrackerProps {
  jobId: number;
  onComplete?: () => void;
}

export default function ProgressTracker({ jobId, onComplete }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/scrape/progress?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      return response.body;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    const controller = new AbortController();

    const connectSSE = async () => {
      try {
        // Use fetch with ReadableStream for SSE
        const response = await fetch(`/api/scrape/progress?jobId=${jobId}`, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error('Failed to connect');
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        setConnected(true);
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setProgress(data);

                if (data.done || data.status === 'completed' || data.status === 'error') {
                  onComplete?.();
                  return;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('SSE connection error:', error);
        setConnected(false);

        // Fallback: poll every 2 seconds
        const interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/scrape/[jobId]?jobId=${jobId}`);
            if (res.ok) {
              const data = await res.json();
              setProgress({
                jobId: data.job.id,
                status: data.job.status,
                progress: data.job.progress || 0,
                total: data.job.total || 0,
                currentChapter: data.job.currentChapter,
                errorMessage: data.job.errorMessage,
                done: data.job.status === 'completed' || data.job.status === 'error',
              });

              if (data.job.status === 'completed' || data.job.status === 'error') {
                clearInterval(interval);
                onComplete?.();
              }
            }
          } catch {
            // Ignore errors
          }
        }, 2000);

        return () => clearInterval(interval);
      }
    };

    connectSSE();

    return () => {
      controller.abort();
    };
  }, [jobId, onComplete]);

  if (!progress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-gray-600">Connecting to progress tracker...</span>
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
