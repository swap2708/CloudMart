export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  block = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const blockClass = block ? 'btn-block' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`btn ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      onClick={onClick}
      {...rest}
    >
      {isLoading && <span className="spinner spinner-sm spinner-light" aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
