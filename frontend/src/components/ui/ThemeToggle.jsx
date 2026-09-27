import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      aria-pressed={isDarkMode}
      className={`p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none ${
        isDarkMode
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <FiSun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <FiMoon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;
