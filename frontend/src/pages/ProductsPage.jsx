import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import { fetchProducts, fetchCategories } from '../store/slices/productSlice';
import ProductCard from '../components/ui/ProductCard';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';

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
  const [showFilters, setShowFilters] = useState(false);

  // Get filter values from URL
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const sort = searchParams.get('sort') || 'newest';
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
    params.page = currentPage;

    dispatch(fetchProducts(params));
  }, [dispatch, keyword, category, minPrice, maxPrice, rating, sort, currentPage]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset page when filter changes
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popularity', label: 'Most Popular' },
  ];

  const ratingOptions = [4, 3, 2, 1];

  const hasActiveFilters = category || minPrice || maxPrice || rating;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {keyword ? `Search results for "${keyword}"` : 'All Products'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} products found</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="input w-auto"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-secondary flex items-center gap-2"
          >
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside
          className={`md:w-64 flex-shrink-0 ${
            showFilters ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Category</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    !category ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateFilter('category', cat)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      category === cat
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="input text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
                <span className="text-gray-600 dark:text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="input text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Rating</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('rating', '')}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    !rating ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Ratings
                </button>
                {ratingOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => updateFilter('rating', r.toString())}
                    className={`flex items-center w-full text-left px-3 py-2 rounded-lg transition ${
                      rating === r.toString()
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-yellow-400">{'★'.repeat(r)}</span>
                    <span className="text-gray-300 dark:text-gray-600">{'★'.repeat(5 - r)}</span>
                    <span className="ml-2">& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={() => setShowFilters(false)}
              className="md:hidden w-full btn-primary mt-4"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">
                  {category}
                  <button
                    onClick={() => updateFilter('category', '')}
                    className="ml-2"
                  >
                    <FiX />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">
                  ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                  <button
                    onClick={() => {
                      updateFilter('minPrice', '');
                      updateFilter('maxPrice', '');
                    }}
                    className="ml-2"
                  >
                    <FiX />
                  </button>
                </span>
              )}
              {rating && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">
                  {rating}+ Stars
                  <button
                    onClick={() => updateFilter('rating', '')}
                    className="ml-2"
                  >
                    <FiX />
                  </button>
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <Spinner size="lg" className="py-12" />
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8">
                <Pagination
                  page={page}
                  pages={pages}
                  baseUrl={`/products?${searchParams.toString()}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
