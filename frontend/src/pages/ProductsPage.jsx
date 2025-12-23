import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiX, FiCheck, FiSliders, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import { fetchProducts, fetchCategories } from '../store/slices/productSlice';
import ProductCard from '../components/ui/ProductCard';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';

// Custom Dropdown Component
const FilterDropdown = ({ label, value, options, onChange, isMulti = false, renderOption, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : label;
  const hasValue = value && value !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
          ${hasValue 
            ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }
          shadow-sm hover:shadow-md
        `}
      >
        {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
        <span className="font-medium whitespace-nowrap">{displayLabel}</span>
        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[320px] overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${value === option.value 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${value === option.value 
                    ? 'border-primary-500 bg-primary-500 text-white' 
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {value === option.value && <FiCheck className="w-3 h-3" />}
                </span>
                {renderOption ? renderOption(option) : <span>{option.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Price Range Dropdown
const PriceRangeDropdown = ({ minPrice, maxPrice, onMinChange, onMaxChange, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMin, setTempMin] = useState(minPrice);
  const [tempMax, setTempMax] = useState(maxPrice);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setTempMin(minPrice);
    setTempMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = minPrice || maxPrice;
  const displayLabel = hasValue 
    ? `₹${minPrice || '0'} - ₹${maxPrice || '∞'}` 
    : 'Price Range';

  const pricePresets = [
    { label: 'Under ₹500', min: '', max: '500' },
    { label: '₹500 - ₹1,000', min: '500', max: '1000' },
    { label: '₹1,000 - ₹2,500', min: '1000', max: '2500' },
    { label: '₹2,500 - ₹5,000', min: '2500', max: '5000' },
    { label: 'Above ₹5,000', min: '5000', max: '' },
  ];

  const handleApply = () => {
    onMinChange(tempMin);
    onMaxChange(tempMax);
    setIsOpen(false);
  };

  const handlePreset = (preset) => {
    onMinChange(preset.min);
    onMaxChange(preset.max);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
          ${hasValue 
            ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }
          shadow-sm hover:shadow-md
        `}
      >
        <span className="text-gray-500 dark:text-gray-400">₹</span>
        <span className="font-medium whitespace-nowrap">{displayLabel}</span>
        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Preset Options */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Quick Select</p>
            <div className="space-y-1">
              {pricePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePreset(preset)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Custom Range</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses} ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Mobile Filter Bottom Sheet
const MobileFilterSheet = ({ 
  isOpen, 
  onClose, 
  categories, 
  category, 
  minPrice, 
  maxPrice, 
  rating, 
  sort, 
  onFilterChange, 
  onClearFilters,
  sortOptions,
  ratingOptions 
}) => {
  const [tempCategory, setTempCategory] = useState(category);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempRating, setTempRating] = useState(rating);
  const [tempSort, setTempSort] = useState(sort);

  useEffect(() => {
    setTempCategory(category);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempRating(rating);
    setTempSort(sort);
  }, [category, minPrice, maxPrice, rating, sort, isOpen]);

  const handleApply = () => {
    onFilterChange('category', tempCategory);
    onFilterChange('minPrice', tempMinPrice);
    onFilterChange('maxPrice', tempMaxPrice);
    onFilterChange('rating', tempRating);
    onFilterChange('sort', tempSort);
    onClose();
  };

  const handleClear = () => {
    setTempCategory('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempRating('');
    setTempSort('newest');
    onClearFilters();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl max-h-[85vh] overflow-hidden animate-slideUp">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters & Sort</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-5 py-4 space-y-6">
          {/* Sort By */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Sort By</h3>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempSort(option.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    tempSort === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTempCategory('')}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !tempCategory
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTempCategory(cat)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    tempCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Price Range</h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempMinPrice}
                  onChange={(e) => setTempMinPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  min="0"
                />
              </div>
              <span className="text-gray-400 font-medium">to</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Rating</h3>
            <div className="space-y-2">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempRating(option.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    tempRating === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  {option.rating && <StarRating rating={option.rating} />}
                  <span className={`text-sm font-medium ${tempRating === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const productsState = useSelector((state) => state.products) || {};
  const { 
    products = [], 
    categories = [], 
    page = 1, 
    pages = 1, 
    total = 0, 
    isLoading = false 
  } = productsState;
  
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Get filter values from URL
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const sort = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (rating) params.rating = rating;
    if (sort) params.sort = sort;
    if (featured) params.featured = featured;
    params.page = currentPage;

    dispatch(fetchProducts(params));
  }, [dispatch, keyword, category, minPrice, maxPrice, rating, sort, featured, currentPage]);

  const updateFilter = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset page when filter changes
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Avg. Customer Review' },
    { value: 'popularity', label: 'Most Popular' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '4', label: '4 Stars & Up', rating: 4 },
    { value: '3', label: '3 Stars & Up', rating: 3 },
    { value: '2', label: '2 Stars & Up', rating: 2 },
    { value: '1', label: '1 Star & Up', rating: 1 },
  ];

  const hasActiveFilters = category || minPrice || maxPrice || rating;
  const activeFilterCount = [category, minPrice || maxPrice, rating].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Filter Bar */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Row */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {keyword ? `Results for "${keyword}"` : featured ? '⭐ Featured Products' : 'All Products'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {total.toLocaleString()} {total === 1 ? 'product' : 'products'} found
                {featured && ' • Showing featured products only'}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Grid View"
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="List View"
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="py-3">
            {/* Mobile Filter Button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
              >
                <FiFilter className="w-5 h-5" />
                <span>Filters & Sort</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Filter Dropdowns */}
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <FilterDropdown
                label="Category"
                value={category}
                options={categoryOptions}
                onChange={(val) => updateFilter('category', val)}
                icon={<FiSliders className="w-4 h-4" />}
              />

              {/* Price Range Dropdown */}
              <PriceRangeDropdown
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinChange={(val) => updateFilter('minPrice', val)}
                onMaxChange={(val) => updateFilter('maxPrice', val)}
              />

              {/* Rating Dropdown */}
              <FilterDropdown
                label="Rating"
                value={rating}
                options={ratingOptions}
                onChange={(val) => updateFilter('rating', val)}
                renderOption={(option) => (
                  <div className="flex items-center gap-2">
                    {option.rating && <StarRating rating={option.rating} />}
                    <span>{option.label}</span>
                  </div>
                )}
              />

              {/* Sort Dropdown */}
              <FilterDropdown
                label="Sort By"
                value={sort}
                options={sortOptions}
                onChange={(val) => updateFilter('sort', val)}
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                >
                  <FiX className="w-4 h-4" />
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Tags - Desktop Only */}
          {hasActiveFilters && (
            <div className="hidden md:flex flex-wrap items-center gap-2 pb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active:</span>
              {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-medium">
                  {category}
                  <button onClick={() => updateFilter('category', '')} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium">
                  ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                  <button 
                    onClick={() => {
                      updateFilter('minPrice', '');
                      updateFilter('maxPrice', '');
                    }} 
                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {rating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                  <StarRating rating={parseInt(rating)} />
                  <span>& Up</span>
                  <button onClick={() => updateFilter('rating', '')} className="hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5 transition-colors">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              <FiX className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} listView />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  page={page}
                  pages={pages}
                  baseUrl={`/products?${searchParams.toString()}`}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        category={category}
        minPrice={minPrice}
        maxPrice={maxPrice}
        rating={rating}
        sort={sort}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        sortOptions={sortOptions}
        ratingOptions={ratingOptions}
      />
    </div>
  );
};

export default ProductsPage;
