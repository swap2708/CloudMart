export const Spinner = ({
  size = 'md',
  light = false,
  center = false,
  text,
  className = '',
}) => {
  const spinnerElement = (
    <div
      className={`spinner spinner-${size} ${light ? 'spinner-light' : ''} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );

  if (center) {
    return (
      <div className="loading-container">
        {spinnerElement}
        {text && <p>{text}</p>}
      </div>
    );
  }

  return (
    <>
      {spinnerElement}
      {text && <span style={{ marginLeft: '0.5rem' }}>{text}</span>}
    </>
  );
};

export default Spinner;
