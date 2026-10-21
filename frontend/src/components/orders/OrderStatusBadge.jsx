import Badge from '../ui/Badge';

export const OrderStatusBadge = ({ status = 'pending' }) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'confirmed':
      return <Badge variant="info">Confirmed</Badge>;
    case 'processing':
      return <Badge variant="primary">Processing</Badge>;
    case 'shipped':
      return <Badge variant="info">Shipped</Badge>;
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'pending':
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
};

export default OrderStatusBadge;
