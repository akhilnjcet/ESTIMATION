import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ productName: '', hsnCode: '', price: '', stock: '', taxPercentage: '', category: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      setFormData({ productName: '', hsnCode: '', price: '', stock: '', taxPercentage: '', category: '' });
      setShowForm(false);
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products & Inventory</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>
      
      {showForm && (
        <div className="card mb-4">
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-control" required value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Price (&#8377;)</label>
                <input type="number" className="form-control" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Percentage (%)</label>
                <input type="number" className="form-control" value={formData.taxPercentage} onChange={e => setFormData({...formData, taxPercentage: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">HSN Code</label>
                <input type="text" className="form-control" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>HSN / Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Tax %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod._id}>
                  <td><strong>{prod.productName}</strong></td>
                  <td>{prod.hsnCode || '-'} / {prod.category || '-'}</td>
                  <td>&#8377; {prod.price.toLocaleString()}</td>
                  <td>{prod.stock}</td>
                  <td>{prod.taxPercentage}%</td>
                  <td>
                    <button className="btn btn-secondary admin-only" onClick={() => handleDelete(prod._id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
