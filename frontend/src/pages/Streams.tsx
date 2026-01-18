import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Stream {
  id: string;
  token: string;
  name: string | null;
  createdAt: string;
}

export default function Streams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [streamName, setStreamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await api.get('/streams');
      setStreams(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await api.post('/streams', { name: streamName || undefined });
      await fetchStreams();
      setShowCreate(false);
      setStreamName('');
      // Copy token to clipboard
      const newToken = response.data.token;
      navigator.clipboard.writeText(newToken);
      setCopiedToken(newToken);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error('Failed to create stream:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getIngestUrl = (token: string) => {
    return `${window.location.origin.replace(':5173', ':3000')}/i/${token}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streams</h1>
          <p className="mt-2 text-gray-600">Manage your webhook streams</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Stream
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create New Stream</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="My Webhook Stream"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setStreamName('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {streams.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No streams yet. Create one to get started!</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            Create Your First Stream
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {streams.map((stream) => (
            <div key={stream.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {stream.name || 'Unnamed Stream'}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Token</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                          {stream.token}
                        </code>
                        <button
                          onClick={() => copyToken(stream.token)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Copy token"
                        >
                          {copiedToken === stream.token ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Ingest URL</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono break-all">
                          {getIngestUrl(stream.token)}
                        </code>
                        <button
                          onClick={() => copyToken(getIngestUrl(stream.token))}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Copy URL"
                        >
                          {copiedToken === getIngestUrl(stream.token) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {format(new Date(stream.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
