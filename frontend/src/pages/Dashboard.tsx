import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Webhook, Activity, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Stream {
  id: string;
  token: string;
  name: string | null;
  createdAt: string;
}

interface Event {
  id: string;
  method: string;
  path: string;
  receivedAt: string;
  stream: {
    name: string | null;
    token: string;
  };
}

export default function Dashboard() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [streamsRes, eventsRes] = await Promise.all([
        api.get('/streams'),
        api.get('/events?limit=5'),
      ]);
      setStreams(streamsRes.data.data || []);
      setRecentEvents(eventsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your webhook activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
              <Webhook className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Streams</p>
              <p className="text-2xl font-semibold text-gray-900">{streams.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Events</p>
              <p className="text-2xl font-semibold text-gray-900">{recentEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last 24h</p>
              <p className="text-2xl font-semibold text-gray-900">
                {recentEvents.filter(
                  (e) => new Date(e.receivedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
            <Link
              to="/events"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events yet</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 mr-2">
                        {event.method}
                      </span>
                      <span className="text-sm text-gray-600">{event.path}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(event.receivedAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Stream: {event.stream.name || event.stream.token.substring(0, 8)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Streams</h2>
            <Link
              to="/streams"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              Manage <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          {streams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No streams yet</p>
              <Link to="/streams" className="btn btn-primary inline-block">
                Create Stream
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {streams.slice(0, 5).map((stream) => (
                <div
                  key={stream.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <p className="font-medium text-gray-900">
                    {stream.name || 'Unnamed Stream'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {stream.token}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
