export const Alert = ({
  variant = 'info',
  children,
  onClose,
  className = '',
}) => {
  if (!children) return null;

  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert">
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            color: 'inherit',
            opacity: 0.7,
          }}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
