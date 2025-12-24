import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiArrowLeft,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';
import {
  fetchTicketById,
  addTicketMessage,
  closeTicket,
} from '../store/slices/supportSlice';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

// Safe date formatter helper
const safeFormatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleString();
  } catch {
    return 'N/A';
  }
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTicket, isLoading } = useSelector((state) => state.support);
  const { user } = useSelector((state) => state.auth);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchTicketById(id));
  }, [dispatch, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTicket?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    const result = await dispatch(addTicketMessage({ ticketId: id, message }));
    setSending(false);

    if (addTicketMessage.fulfilled.match(result)) {
      setMessage('');
    } else {
      toast.error(result.payload || 'Failed to send message');
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    const result = await dispatch(closeTicket(id));
    if (closeTicket.fulfilled.match(result)) {
      toast.success('Ticket closed successfully');
    } else {
      toast.error(result.payload || 'Failed to close ticket');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FiAlertCircle className="text-blue-600" />;
      case 'in-progress':
        return <FiClock className="text-yellow-600" />;
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
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !currentTicket) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentTicket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ticket Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The ticket you're looking for doesn't exist.</p>
          <Link to="/help" className="btn btn-primary">Go to Help Center</Link>
        </div>
      </div>
    );
  }

  const ticket = currentTicket;
  const isTicketClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/help"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back to Help Center
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">#{ticket.ticketNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority} priority
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ticket.subject}</h1>
              <p className="text-gray-500 dark:text-gray-400 capitalize">
                Category: {ticket.category.replace('-', ' ')}
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Created: {safeFormatDate(ticket.createdAt)}</p>
              <p>Updated: {safeFormatDate(ticket.updatedAt)}</p>
              {ticket.assignedTo && (
                <p className="mt-2 text-primary-600">
                  Assigned to: {ticket.assignedTo.name}
                </p>
              )}
            </div>
          </div>

          {!isTicketClosed && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <button
                onClick={handleCloseTicket}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Close this ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Conversation</h2>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.map((msg, index) => {
            const isUserMessage = msg.sender === 'user';
            const isAgentMessage = msg.sender === 'agent' || msg.sender === 'system';

            return (
              <div
                key={index}
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isUserMessage ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isAgentMessage ? (
                      <FiUserCheck className="text-primary-600" />
                    ) : (
                      <FiUser className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isAgentMessage ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {safeFormatDate(msg.createdAt || msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      isUserMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
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
                placeholder="Type your reply..."
                className="flex-1 input resize-none"
                rows={2}
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
            This ticket has been {ticket.status}. Create a new ticket if you need further assistance.
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage;
