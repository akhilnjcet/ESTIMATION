import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Package, Plus, Search, Edit2, Trash2, X, Tag, BarChart2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ productName: '', hsnCode: '', price: '', stock: '', taxPercentage: '', category: '' });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  const handleEdit = (prod) => {
    setEditingId(prod._id);
    setFormData({
      productName: prod.productName,
      hsnCode: prod.hsnCode || '',
      price: prod.price,
      stock: prod.stock || 0,
      taxPercentage: prod.taxPercentage || 0,
      category: prod.category || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', formData);
        alert('Product saved successfully!');
      }
      setFormData({ productName: '', hsnCode: '', price: '', stock: '', taxPercentage: '', category: '' });
      setEditingId(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to save product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) { console.error(err); }
    }
  };

  const filteredProducts = products.filter(p => 
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hsnCode?.includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={28} style={{ color: 'var(--primary)' }} />
            Products & Inventory Catalog
          </h1>
          <p className="page-subtitle">Manage items, unit pricing, HSN codes, and stock levels</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search product or HSN code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button 
            className="btn-gradient"
            onClick={() => {
              if (showForm && editingId) {
                setEditingId(null);
                setFormData({ productName: '', hsnCode: '', price: '', stock: '', taxPercentage: '', category: '' });
              } else {
                setShowForm(!showForm);
              }
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel Editor' : 'Add New Product'}
          </button>
        </div>
      </div>

      {/* Editor Glass Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            {editingId ? 'Edit Product Item' : 'New Product Registration'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" required value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="Steel Rods 12mm" />
              </div>
              <div className="form-group">
                <label className="form-label">Price (&#8377;)</label>
                <input type="number" className="form-input" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="4500" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input type="number" className="form-input" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Percentage (%)</label>
                <input type="number" className="form-input" value={formData.taxPercentage} onChange={e => setFormData({...formData, taxPercentage: e.target.value})} placeholder="18" />
              </div>
              <div className="form-group">
                <label className="form-label">HSN Code</label>
                <input type="text" className="form-input" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} placeholder="7214" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Construction / Hardware" />
              </div>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>
              {editingId ? 'Update Product Item' : 'Save & Register Item'}
            </button>
          </form>
        </div>
      )}

      {/* Products Glass Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>HSN Code & Category</th>
              <th>Unit Price</th>
              <th>Available Stock</th>
              <th>Tax Rate</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(prod => (
              <tr key={prod._id}>
                <td style={{ fontWeight: '800' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} />
                    </div>
                    <span>{prod.productName}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <span className="badge badge-primary">{prod.hsnCode || 'No HSN'}</span>{' '}
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{prod.category || 'General'}</span>
                </td>
                <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                  &#8377; {Number(prod.price).toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${Number(prod.stock) > 10 ? 'badge-success' : 'badge-warning'}`}>
                    {prod.stock || 0} Units
                  </span>
                </td>
                <td style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                  {prod.taxPercentage || 0}%
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEdit(prod)} 
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon admin-only" 
                      onClick={() => handleDelete(prod._id)} 
                      title="Delete Product" 
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No inventory products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
