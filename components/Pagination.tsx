
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    // Always show first, last, current, and neighbors
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && i > 1) ||
        (i === currentPage + 2 && i < totalPages)
      ) {
        pages.push('...');
      }
    }
    // Deduplicate '...' if logic overlaps
    return [...new Set(pages)];
  };

  return (
    <div className="flex justify-center items-center space-x-2 mt-12 animate-fade-in">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center border-2 border-white ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
            : 'bg-white text-clay-text shadow-plastic hover:shadow-clay-hover hover:-translate-y-1 hover:text-clay-purple'
        }`}
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex space-x-2">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all border-2 border-white flex items-center justify-center ${
                  currentPage === page
                    ? 'bg-clay-purple text-white shadow-inner scale-95'
                    : 'bg-white text-clay-text shadow-plastic hover:shadow-clay-hover hover:-translate-y-1 hover:text-clay-purple'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center border-2 border-white ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
            : 'bg-white text-clay-text shadow-plastic hover:shadow-clay-hover hover:-translate-y-1 hover:text-clay-purple'
        }`}
      >
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Pagination;
