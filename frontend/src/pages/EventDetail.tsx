import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { ArrowLeft, Play, Copy, Check } from 'lucide-react';

interface Event {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  rawBody: string;
  sourceIp: string | null;
  contentLength: number | null;
  receivedAt: string;
  stream: {
    id: string;
    token: string;
    name: string | null;
  };
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [replayUrl, setReplayUrl] = useState('');
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBody, setShowBody] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplaying(true);
    setReplayResult(null);
    try {
      const response = await api.post(`/events/${id}/replay`, {
        targetUrl: replayUrl,
      });
      setReplayResult(response.data);
    } catch (error: any) {
      setReplayResult({
        status: 'error',
        errorMessage: error.response?.data?.error?.message || 'Replay failed',
      });
    } finally {
      setReplaying(false);
    }
  };

  const copyBody = () => {
    if (event) {
      try {
        const body = atob(event.rawBody);
        navigator.clipboard.writeText(body);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to decode body:', error);
      }
    }
  };

  const getBodyPreview = () => {
    if (!event) return '';
    try {
      const body = atob(event.rawBody);
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    } catch {
      return 'Unable to decode body';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Event not found</p>
        <button onClick={() => navigate('/events')} className="btn btn-secondary">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </button>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {event.method}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Path</label>
            <p className="mt-1 text-gray-900 font-mono">{event.path}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Received At</label>
            <p className="mt-1 text-gray-900">
              {format(new Date(event.receivedAt), 'PPpp')}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Stream</label>
            <p className="mt-1 text-gray-900">
              {event.stream.name || event.stream.token}
            </p>
          </div>

          {event.sourceIp && (
            <div>
              <label className="text-sm font-medium text-gray-500">Source IP</label>
              <p className="mt-1 text-gray-900">{event.sourceIp}</p>
            </div>
          )}

          {event.contentLength && (
            <div>
              <label className="text-sm font-medium text-gray-500">Content Length</label>
              <p className="mt-1 text-gray-900">
                {event.contentLength} bytes ({(event.contentLength / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Headers</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm">
            {JSON.stringify(event.headers, null, 2)}
          </pre>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Body</h2>
          <button
            onClick={copyBody}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          {showBody ? (
            <pre className="text-sm whitespace-pre-wrap">{getBodyPreview()}</pre>
          ) : (
            <button
              onClick={() => setShowBody(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Click to view body ({event.contentLength || 0} bytes)
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Replay Event</h2>
        <form onSubmit={handleReplay} className="space-y-4">
          <div>
            <label htmlFor="replayUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Target URL
            </label>
            <input
              id="replayUrl"
              type="url"
              className="input"
              placeholder="https://example.com/webhook"
              value={replayUrl}
              onChange={(e) => setReplayUrl(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={replaying || !replayUrl}
            className="btn btn-primary flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            {replaying ? 'Replaying...' : 'Replay'}
          </button>
        </form>

        {replayResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            replayResult.status === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className="font-semibold mb-2">
              {replayResult.status === 'success' ? '✓ Success' : '✗ Failed'}
            </h3>
            <div className="text-sm space-y-1">
              {replayResult.durationMs && (
                <p>Duration: {replayResult.durationMs}ms</p>
              )}
              {replayResult.responseStatus && (
                <p>Status: {replayResult.responseStatus}</p>
              )}
              {replayResult.errorMessage && (
                <p className="text-red-700">{replayResult.errorMessage}</p>
              )}
              {replayResult.responseBody && (
                <div className="mt-2">
                  <p className="font-medium">Response:</p>
                  <pre className="text-xs mt-1 overflow-x-auto">
                    {replayResult.responseBody.substring(0, 500)}
                    {replayResult.responseBody.length > 500 && '...'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
