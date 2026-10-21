import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { productsApi } from '../../api/products.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import './admin.css';

const INITIAL = {
  name: '',
  description: '',
  price: '',
  category: '',
  image_url: '',
  is_active: true,
  quantity: '',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    productsApi.getProductById(id)
      .then(data => {
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: data.price != null ? String(data.price) : '',
          category: data.category || '',
          image_url: data.image_url || '',
          is_active: data.is_active ?? true,
          quantity: data.inventory?.quantity != null ? String(data.inventory.quantity) : '',
        });
      })
      .catch(() => setError('Failed to load product data.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Product name is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) return 'A valid price is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (form.quantity !== '' && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) return 'Quantity must be a non-negative integer.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      quantity: form.quantity !== '' ? parseInt(form.quantity, 10) : undefined,
    };

    try {
      if (isEdit) {
        await adminApi.updateProduct(id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="admin-page-header">
        <h1>{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Input label="Product Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" required />
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--gray-700)' }}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Product description..."
              rows={4}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Price ($) *" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" required />
            <Input label="Stock Quantity" name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} placeholder="0" />
          </div>
          <Input label="Category *" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Electronics" required />
          <Input label="Image URL" name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            Active (visible to customers)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
