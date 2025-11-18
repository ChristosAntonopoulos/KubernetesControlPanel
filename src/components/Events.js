import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Clock, 
  RefreshCw, 
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNamespaces();
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedNamespace]);

  const fetchNamespaces = async () => {
    try {
      const response = await fetch('/api/namespaces');
      const data = await response.json();
      setNamespaces(data);
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/events/${selectedNamespace}`);
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type, reason) => {
    switch (type) {
      case 'Warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'Normal':
        if (reason.includes('Failed') || reason.includes('Error')) {
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        }
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-radiant-purple-500" />;
    }
  };

  const getEventBadge = (type) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (type) {
      case 'Warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Normal':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-radiant-purple-100 text-radiant-purple-800`;
    }
  };

  const getEventPriority = (type, reason) => {
    if (type === 'Warning') return 3;
    if (reason.includes('Failed') || reason.includes('Error')) return 2;
    return 1;
  };

  const filteredEvents = events
    .filter(event => {
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const matchesSearch = 
        event.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by priority first, then by time
      const priorityDiff = getEventPriority(b.type, b.reason) - getEventPriority(a.type, a.reason);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.time) - new Date(a.time);
    });

  const eventCounts = {
    total: events.length,
    warnings: events.filter(e => e.type === 'Warning').length,
    normal: events.filter(e => e.type === 'Normal').length,
    errors: events.filter(e => e.reason.includes('Failed') || e.reason.includes('Error')).length
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-radiant-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900">Events</h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Monitor cluster events and activities
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-radiant-purple-600 hover:bg-radiant-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Event Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Info className="h-6 w-6 text-radiant-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{eventCounts.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Warnings</dt>
                  <dd className="text-lg font-medium text-gray-900">{eventCounts.warnings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Normal</dt>
                  <dd className="text-lg font-medium text-gray-900">{eventCounts.normal}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">{eventCounts.errors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Namespace Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Namespace</label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500 sm:text-sm"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="Warning">Warning</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Events List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredEvents.map((event, idx) => (
                <li key={`${event.time}-${event.object}-${idx}`}>
                  <div className="relative pb-8">
                    {idx !== filteredEvents.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        {getEventIcon(event.type, event.reason)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={getEventBadge(event.type)}>
                              {event.type}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {event.reason}
                            </span>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{event.object}</span>
                            {event.namespace && selectedNamespace === 'all' && (
                              <span className="text-gray-400"> in {event.namespace}</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">{event.message}</p>
                          {event.count > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              This event occurred {event.count} times
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Info className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No events match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;