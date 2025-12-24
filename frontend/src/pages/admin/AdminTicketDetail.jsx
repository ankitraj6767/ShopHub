import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiUserCheck,
  FiPackage,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { safeToLocaleString } from '../../utils/helpers';

const AdminTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/support/tickets/${id}`);
      setTicket(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch ticket');
      navigate('/admin/support');
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await api.post(`/support/tickets/${id}/messages`, { message });
      setMessage('');
      await fetchTicket();
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/support/admin/tickets/${id}/status`, { status: newStatus });
      setTicket({ ...ticket, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
    setStatusUpdating(false);
  };

  const handleAssignToMe = async () => {
    try {
      await api.patch(`/support/admin/tickets/${id}/assign`);
      await fetchTicket();
      toast.success('Ticket assigned to you');
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FiAlertCircle className="text-blue-600" />;
      case 'in-progress':
        return <FiClock className="text-yellow-600" />;
      case 'waiting-customer':
        return <FiClock className="text-purple-600" />;
      case 'resolved':
      case 'closed':
        return <FiCheckCircle className="text-green-600" />;
      default:
        return <FiAlertCircle className="text-gray-600" />;
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
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ticket Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The ticket you're looking for doesn't exist.</p>
        <Link to="/admin/support" className="btn btn-primary">Back to Support</Link>
      </div>
    );
  }

  const isTicketClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/support"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back to Support Tickets
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ticket #{ticket.ticketNumber}
          </h1>
          <div className="flex items-center gap-2">
            {getStatusIcon(ticket.status)}
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className={`text-sm font-medium px-3 py-1.5 rounded-full border-0 ${getStatusColor(ticket.status)}`}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-customer">Waiting for Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                Category: {ticket.category?.replace('-', ' ')}
              </p>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {ticket.messages?.map((msg, index) => {
                const isUserMessage = msg.sender === 'user';
                const isAgentMessage = msg.sender === 'agent' || msg.sender === 'system';

                return (
                  <div
                    key={index}
                    className={`flex ${isAgentMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${isAgentMessage ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isAgentMessage ? (
                          <FiUserCheck className="text-primary-600" />
                        ) : (
                          <FiUser className="text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isAgentMessage ? 'Support Team' : ticket.user?.name || 'Customer'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {safeToLocaleString(msg.createdAt || msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          isAgentMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Form */}
            {!isTicketClosed ? (
              <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    className="flex-1 input resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="btn btn-primary self-end"
                  >
                    {sending ? <Spinner size="sm" /> : <FiSend />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-center text-gray-600 dark:text-gray-300">
                <FiCheckCircle className="inline-block mr-2" />
                This ticket has been {ticket.status}. You can change the status to reopen it.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Ticket Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiUser className="mr-2" /> Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium dark:text-white">{ticket.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium flex items-center dark:text-white">
                  <FiMail className="mr-2 text-gray-400" />
                  {ticket.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ticket Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium dark:text-white">{safeToLocaleString(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium dark:text-white">{safeToLocaleString(ticket.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                {ticket.assignedTo ? (
                  <p className="font-medium text-primary-600">{ticket.assignedTo.name}</p>
                ) : (
                  <button
                    onClick={handleAssignToMe}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Assign to me
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Related Order */}
          {ticket.order && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FiPackage className="mr-2" /> Related Order
              </h3>
              <div className="space-y-2">
                <p className="text-sm dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Order #:</span>{' '}
                  <Link
                    to={`/admin/orders/${ticket.order._id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {ticket.order.orderNumber}
                  </Link>
                </p>
                <p className="text-sm dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
                  <span className="capitalize">{ticket.order.status}</span>
                </p>
                <p className="text-sm dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Total:</span>{' '}
                  ₹{ticket.order.totalPrice?.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleStatusChange('in-progress')}
                disabled={ticket.status === 'in-progress' || statusUpdating}
                className="w-full btn btn-secondary text-sm"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleStatusChange('waiting-customer')}
                disabled={ticket.status === 'waiting-customer' || statusUpdating}
                className="w-full btn btn-secondary text-sm"
              >
                Waiting for Customer
              </button>
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={ticket.status === 'resolved' || statusUpdating}
                className="w-full btn btn-primary text-sm"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={ticket.status === 'closed' || statusUpdating}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white py-2"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetail;
