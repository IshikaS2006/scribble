import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}
        aria-hidden="true"
      ></div>
      {message && (
        <p className="text-gray-600 font-semibold text-sm">
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  size: 'medium',
  message: 'Loading...',
};

export default LoadingSpinner;
