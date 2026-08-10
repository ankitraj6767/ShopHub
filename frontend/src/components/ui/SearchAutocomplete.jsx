import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiClock, FiTrendingUp, FiX } from 'react-icons/fi';
import api from '../../utils/api';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT = 5;

const SearchAutocomplete = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches] = useState(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products?keyword=${encodeURIComponent(query)}&limit=5`);
        setSuggestions(data.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const removeRecentSearch = (term, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (product) => {
    saveRecentSearch(product.name);
    navigate(`/products/${product._id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentClick = (term) => {
    navigate(`/products?keyword=${encodeURIComponent(term)}`);
    setIsOpen(false);
    setQuery('');
  };

  const handlePopularClick = (term) => {
    saveRecentSearch(term);
    navigate(`/products?category=${encodeURIComponent(term)}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          aria-label="Search products"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          )}

          {/* Product Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Products</p>
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <img
                    src={product.images?.[0]?.url || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40?text=P';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-primary-600 font-bold">₹{product.price}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No query - show recent and popular */}
          {!query && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-2 border-b dark:border-gray-700">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                    <FiClock className="w-3 h-3" /> Recent Searches
                  </p>
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => handleRecentClick(term)}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{term}</span>
                      <button
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              <div className="p-2">
                <p className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <FiTrendingUp className="w-3 h-3" /> Popular Categories
                </p>
                <div className="flex flex-wrap gap-2 px-3 py-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularClick(term)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No products found for "{query}"</p>
              <button
                onClick={handleSearch}
                className="mt-2 text-primary-600 hover:underline text-sm"
              >
                Search for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
