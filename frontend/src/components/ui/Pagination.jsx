import { Link } from 'react-router-dom';

const Pagination = ({ page, pages, baseUrl = '' }) => {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const buildUrl = (pageNum) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('page', pageNum);
    return `${url.pathname}${url.search}`;
  };

  return (
    <nav className="flex justify-center items-center space-x-2">
      {/* Previous */}
      {page > 1 ? (
        <Link
          to={buildUrl(page - 1)}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        >
          Previous
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed">
          Previous
        </span>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((num) => (
        <Link
          key={num}
          to={buildUrl(num)}
          className={`px-4 py-2 rounded-lg transition ${
            num === page
              ? 'bg-primary-600 text-white'
              : 'border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {num}
        </Link>
      ))}

      {/* Next */}
      {page < pages ? (
        <Link
          to={buildUrl(page + 1)}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        >
          Next
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed">
          Next
        </span>
      )}
    </nav>
  );
};

export default Pagination;
