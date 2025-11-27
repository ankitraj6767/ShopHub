import { FiStar } from 'react-icons/fi';

const Rating = ({ value, text, color = 'text-yellow-400' }) => {
  return (
    <div className="flex items-center">
      <div className={`flex items-center ${color}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-5 h-5 ${star <= value ? 'fill-current' : ''}`}
          />
        ))}
      </div>
      {text && <span className="ml-2 text-gray-600">{text}</span>}
    </div>
  );
};

export default Rating;
