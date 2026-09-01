import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiClock, FiTag, FiGrid, FiX } from 'react-icons/fi';
import { fetchSearchSuggestions, clearSearchSuggestions } from '../../store/slices/activitySlice';
import { useDebounce } from '../../utils/useDebounce';

const SmartSearchBar = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { searchSuggestions, suggestionsLoading } = useSelector((state) => state.activity);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2 && isAuthenticated) {
      dispatch(fetchSearchSuggestions(debouncedQuery));
    } else {
      dispatch(clearSearchSuggestions());
    }
  }, [debouncedQuery, dispatch, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery) => {
    const q = searchQuery || query;
    if (q.trim()) {
      navigate(`/products?search=${encodeURIComponent(q.trim())}`);
      setQuery('');
      setIsFocused(false);
      dispatch(clearSearchSuggestions());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'category') {
      navigate(`/products?category=${encodeURIComponent(suggestion.text)}`);
    } else {
      handleSearch(suggestion.text);
    }
    setIsFocused(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'history':
        return <FiClock className="w-4 h-4 text-gray-400" />;
      case 'category':
        return <FiGrid className="w-4 h-4 text-blue-500" />;
      case 'product':
        return <FiTag className="w-4 h-4 text-green-500" />;
      default:
        return <FiSearch className="w-4 h-4 text-gray-400" />;
    }
  };

  const showSuggestions = isFocused && query.length >= 2 && (searchSuggestions.length > 0 || suggestionsLoading);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search products, brands, categories"
          placeholder="Search products, brands, categories..."
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              dispatch(clearSearchSuggestions());
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 overflow-hidden z-50"
          >
            {suggestionsLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <ul className="py-2 max-h-80 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      {getIcon(suggestion.type)}
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 dark:text-white">
                          {suggestion.text}
                        </span>
                        {suggestion.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            in {suggestion.category}
                          </span>
                        )}
                      </div>
                      {suggestion.type === 'history' && (
                        <span className="text-xs text-gray-400">Recent</span>
                      )}
                      {suggestion.type === 'category' && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          Category
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearchBar;
