export const Badge = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
};

export default Badge;
