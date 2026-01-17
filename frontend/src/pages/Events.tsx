import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { ArrowRight, Filter } from 'lucide-react';

interface Event {
  id: string;
  method: string;
  path: string;
  receivedAt: string;
  sourceIp: string | null;
  contentLength: number | null;
  stream: {
    id: string;
    token: string;
    name: string | null;
  };
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [streamFilter, setStreamFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, [streamFilter, methodFilter]);

  const fetchEvents = async (nextCursor?: string) => {
    try {
      const params: any = { limit: 20 };
      if (nextCursor) params.cursor = nextCursor;
      if (streamFilter) params.streamId = streamFilter;
      if (methodFilter) params.method = methodFilter;

      const response = await api.get('/events', { params });
      if (nextCursor) {
        setEvents((prev) => [...prev, ...response.data.data]);
      } else {
        setEvents(response.data.data || []);
      }
      setHasMore(response.data.hasMore || false);
      setCursor(response.data.nextCursor);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (cursor && hasMore) {
      fetchEvents(cursor);
    }
  };

  if (loading && events.length === 0) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <p className="mt-2 text-gray-600">View captured webhook events</p>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stream ID
            </label>
            <input
              type="text"
              className="input"
              placeholder="Filter by stream ID"
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              className="input"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No events found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        {event.method}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{event.path}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {format(new Date(event.receivedAt), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                      {event.sourceIp && <span>IP: {event.sourceIp}</span>}
                      {event.contentLength && (
                        <span>Size: {(event.contentLength / 1024).toFixed(2)} KB</span>
                      )}
                      <span>Stream: {event.stream.name || event.stream.token.substring(0, 8)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button onClick={loadMore} className="btn btn-secondary">
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
