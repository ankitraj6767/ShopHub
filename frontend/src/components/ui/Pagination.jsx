import { Link } from 'react-router-dom';

const Pagination = ({ page, pages, currentPage, totalPages, baseUrl = '', onPageChange }) => {
  // Support both naming conventions
  const activePage = currentPage || page || 1;
  const totalPagesCount = totalPages || pages || 1;

  if (totalPagesCount <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    let startPage = Math.max(1, activePage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPagesCount, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const buildUrl = (pageNum) => {
    const url = new URL(baseUrl || window.location.pathname, window.location.origin);
    url.searchParams.set('page', pageNum);
    return `${url.pathname}${url.search}`;
  };

  const handlePageClick = (pageNum, e) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(pageNum);
    }
  };

  return (
    <nav className="flex justify-center items-center space-x-2">
      {/* Previous */}
      {activePage > 1 ? (
        onPageChange ? (
          <button
            onClick={(e) => handlePageClick(activePage - 1, e)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition"
          >
            Previous
          </button>
        ) : (
          <Link
            to={buildUrl(activePage - 1)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition"
          >
            Previous
          </Link>
        )
      ) : (
        <span className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed">
          Previous
        </span>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((num) => (
        onPageChange ? (
          <button
            key={num}
            onClick={(e) => handlePageClick(num, e)}
            className={`px-4 py-2 rounded-lg transition ${
              num === activePage
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {num}
          </button>
        ) : (
          <Link
            key={num}
            to={buildUrl(num)}
            className={`px-4 py-2 rounded-lg transition ${
              num === activePage
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {num}
          </Link>
        )
      ))}

      {/* Next */}
      {activePage < totalPagesCount ? (
        onPageChange ? (
          <button
            onClick={(e) => handlePageClick(activePage + 1, e)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition"
          >
            Next
          </button>
        ) : (
          <Link
            to={buildUrl(activePage + 1)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition"
          >
            Next
          </Link>
        )
      ) : (
        <span className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed">
          Next
        </span>
      )}
    </nav>
  );
};

export default Pagination;
