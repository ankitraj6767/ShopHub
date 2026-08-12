import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiCpu } from 'react-icons/fi';

// Using FiCpu as alternative to BsRobot
import { chatWithAI, addChatMessage } from '../../store/slices/supportSlice';

const LiveChatWidget = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { chatMessages, chatSessionId } = useSelector((state) => state.support);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      // Add welcome message
      dispatch(addChatMessage({
        type: 'bot',
        message: "👋 Hi! I'm ShopHub AI Assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      }));
    }
  }, [isOpen, chatMessages.length, dispatch]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    setMessage('');

    dispatch(addChatMessage({
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString(),
    }));

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const result = await dispatch(chatWithAI({ message: userMessage, sessionId: chatSessionId }));
    setIsTyping(false);

    if (chatWithAI.rejected.match(result)) {
      dispatch(addChatMessage({
        type: 'bot',
        message: "I'm having trouble. Please try again or contact support.",
        timestamp: new Date().toISOString(),
      }));
    }

    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const formatMessage = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (processed.startsWith('• ')) {
        return <div key={i} className="flex items-start ml-2"><span className="mr-2">•</span><span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} /></div>;
      }
      return <div key={i} dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }} />;
    });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label={unreadCount > 0 ? `Open Chat, ${unreadCount} unread messages` : 'Open Chat'}
          aria-expanded="false"
        >
          <FiMessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all
            ${isMinimized ? 'w-72 h-14' : 'w-[calc(100%-2rem)] sm:w-96 h-[500px] max-h-[80vh]'}
            bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6
          `}
        >
          {/* Header */}
          <div
            className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-4 flex items-center justify-between cursor-pointer"
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiCpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">ShopHub Support</h3>
                {!isMinimized && (
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Online
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-primary-600"
                aria-label={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
                aria-expanded={!isMinimized}
              >
                <FiMinimize2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-primary-600"
                aria-label="Close Chat"
              >
                <FiX className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[calc(100%-120px)] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.type === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-700 shadow-sm rounded-bl-md text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="text-sm">{formatMessage(msg.message)}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !message.trim()}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    aria-label="Send Message"
                  >
                    <FiSend className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default LiveChatWidget;
