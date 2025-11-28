import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiFilter,
  FiMessageCircle,
  FiClock,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await api.get(`/support/admin/tickets?${params}`);
      setTickets(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch tickets');
      setTickets([]);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/support/admin/tickets/${ticketId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (ticketId) => {
    try {
      await api.patch(`/support/admin/tickets/${ticketId}/assign`);
      toast.success('Ticket assigned to you');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'waiting-customer':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
      ticket.subject?.toLowerCase().includes(searchLower) ||
      ticket.user?.name?.toLowerCase().includes(searchLower) ||
      ticket.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress').length,
    waiting: tickets.filter((t) => t.status === 'waiting-customer').length,
    resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage customer support requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertCircle className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              <p className="text-sm text-blue-700">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
          <div className="flex items-center">
            <FiRefreshCw className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
          <div className="flex items-center">
            <FiClock className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-purple-600">{stats.waiting}</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">Waiting</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-sm text-green-700">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={fetchTickets}
            className="btn btn-secondary flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          #{ticket.ticketNumber}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {ticket.subject}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiUser className="text-gray-400" />
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {ticket.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting-customer">Waiting for Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {ticket.assignedTo ? (
                        ticket.assignedTo.name
                      ) : (
                        <button
                          onClick={() => handleAssign(ticket._id)}
                          className="text-primary-600 hover:text-primary-700 text-xs"
                        >
                          Assign to me
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/support/${ticket._id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t dark:border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
