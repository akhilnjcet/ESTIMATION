import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Plus, X, Eye, Trash2 } from 'lucide-react';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const { selectedProgram } = useProgram();
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    customer: '', 
    notes: '', 
    terms: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
    fetchProducts();
  }, [selectedProgram]);

  const fetchQuotations = async () => {
    try { const { data } = await api.get('/quotations'); setQuotations(data); } catch (err) {}
  };

  const filteredQuotations = quotations.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      fetchQuotations();
      alert('Quotation deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete quotation');
    }
  };

  const fetchCustomers = async () => {
    try { const { data } = await api.get('/customers'); setCustomers(data); } catch (err) {}
  };
  const fetchProducts = async () => {
    try { const { data } = await api.get('/products'); setProducts(data); } catch (err) {}
  };

  const resetForm = () => {
    setFormData({ 
      customer: '', 
      notes: '', 
      terms: '',
      date: new Date().toISOString().split('T')[0]
    });
    setItems([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setFormData({
      customer: q.customer?._id || q.customer,
      notes: q.notes || '',
      terms: q.terms || '',
      date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setItems(q.items.map(item => ({
      ...item,
      product: item.product?._id || item.product
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addItem = () => {
    setItems([...items, { product: '', productName: '', description: '', price: 0, quantity: 1, taxPercentage: 0, total: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        newItems[index] = { ...newItems[index], product: prod._id, productName: prod.productName, price: prod.price, taxPercentage: prod.taxPercentage || 0 };
      } else {
        newItems[index] = { ...newItems[index], product: '', productName: value };
      }
    } else {
      newItems[index][field] = value;
    }
    newItems[index].total = Number(newItems[index].price) * Number(newItems[index].quantity);
    setItems(newItems);
  };

  const removeItem = (index) => { setItems(items.filter((_, i) => i !== index)); };

  const getTotals = () => {
    let subTotal = items.reduce((acc, item) => acc + item.total, 0);
    let taxAmount = items.reduce((acc, item) => acc + (item.total * Number(item.taxPercentage) / 100), 0);
    let totalAmount = subTotal + taxAmount;
    return { subTotal, taxAmount, totalAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert('Please add at least one item');
    
    const { subTotal, taxAmount, totalAmount } = getTotals();
    const payload = { ...formData, items, subTotal, taxAmount, discount: 0, totalAmount };
    
    try {
      if (editingId) {
        await api.put(`/quotations/${editingId}`, payload);
      } else {
        await api.post('/quotations', payload);
      }
      resetForm();
      fetchQuotations();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePrint = (docData) => {
    const printWindow = window.open('', '_blank');
    const customer = customers.find(c => c._id === (docData.customer?._id || docData.customer));
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation - ${docData.quotationNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .doc-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; font-size: 14px; line-height: 24px; color: #555; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${selectedProgram?.themeColor || '#4f46e5'}; padding-bottom: 20px; margin-bottom: 30px; }
            .business-info h1 { margin: 0; color: ${selectedProgram?.themeColor || '#4f46e5'}; font-size: 28px; }
            .business-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
            .doc-title { text-align: right; }
            .doc-title h2 { margin: 0; font-size: 32px; color: #e2e8f0; font-weight: 800; letter-spacing: -1px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details div { width: 45%; }
            .details h3 { font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; font-weight: bold; }
            .details p { margin: 0; font-weight: bold; font-size: 14px; color: #1e293b; }
            table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-bottom: 30px; }
            table th { background: #f8fafc; padding: 12px; border-bottom: 2px solid #edf2f7; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            table td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 13px; color: #1e293b; }
            .totals { width: 250px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: ${selectedProgram?.themeColor || '#4f46e5'}; border-top: 2px solid #edf2f7; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 100px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 11px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="doc-box">
            <div class="header">
              <div class="business-info">
                <h1>${selectedProgram?.name}</h1>
                <p>${selectedProgram?.address || ''}</p>
                <p>Phone: ${selectedProgram?.phone || ''} | Email: ${selectedProgram?.email || ''}</p>
              </div>
              <div class="doc-title">
                <h2 style="color: ${selectedProgram?.themeColor || '#4f46e5'}; opacity: 0.1">QUOTATION</h2>
                <p style="font-weight: bold; color: #1e293b; margin: 0; font-size: 18px;">${docData.quotationNumber}</p>
              </div>
            </div>

            <div class="details">
              <div>
                <h3>Quoted To:</h3>
                <p style="font-size: 16px;">${docData.customer?.customerName || customer?.customerName}</p>
                <p style="font-weight: normal; color: #64748b; font-size: 12px;">${docData.customer?.address || customer?.address || ''}</p>
                <p style="font-weight: normal; color: #64748b; font-size: 12px;">Phone: ${docData.customer?.phone || customer?.phone || ''}</p>
              </div>
              <div style="text-align: right">
                <h3>Document Details:</h3>
                <p style="font-weight: normal">Date: <strong>${new Date(docData.createdAt || docData.date).toLocaleDateString('en-GB')}</strong></p>
                <p style="font-weight: normal">Valid Until: <strong>${new Date(new Date(docData.createdAt || docData.date).getTime() + 15*24*60*60*1000).toLocaleDateString('en-GB')}</strong></p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: left; border-bottom: 2px solid #edf2f7; padding: 12px 0;">Sr.</th>
                  <th style="text-align: left; border-bottom: 2px solid #edf2f7; padding: 12px 0;">Item Description</th>
                  <th style="width: 60px; text-align: center; border-bottom: 2px solid #edf2f7; padding: 12px 0;">Qty</th>
                  <th style="width: 100px; text-align: right; border-bottom: 2px solid #edf2f7; padding: 12px 0;">Price</th>
                  <th style="width: 120px; text-align: right; border-bottom: 2px solid #edf2f7; padding: 12px 0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${docData.items.map((item, idx) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">${idx + 1}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                      <div style="font-weight: bold; color: #1e293b;">${item.productName}</div>
                      ${item.description ? `<div style="font-size: 11px; color: #64748b;">${item.description}</div>` : ''}
                    </td>
                    <td style="text-align: center; padding: 12px 0; border-bottom: 1px solid #edf2f7;">${item.quantity}</td>
                    <td style="text-align: right; padding: 12px 0; border-bottom: 1px solid #edf2f7;">₹${(item.price || 0).toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold; padding: 12px 0; border-bottom: 1px solid #edf2f7;">₹${(item.total || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals" style="margin-top: 30px;">
              <div class="total-row grand-total" style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: ${selectedProgram?.themeColor || '#4f46e5'}; border-top: 2px solid #edf2f7; padding-top: 15px;">
                <span>Grand Total:</span>
                <span>₹${(docData.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <p>This is a computer generated quotation.</p>
              <p>Thank you for your interest! | Powered by Krishna ERP</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderPreviewDocument = (docData, isLive = false) => {
    const customer = customers.find(c => c._id === (docData.customer?._id || docData.customer));
    return (
      <div className="card" style={{ background: '#fff', padding: isLive ? '1.5rem' : '3rem', color: '#1e293b', margin: '0 auto', maxWidth: '800px', transform: isLive ? 'scale(0.95)' : 'none', transformOrigin: 'top center' }}>
        <div className="flex justify-between items-start mb-8 border-b pb-6">
          <div>
            <h1 className="font-black tracking-tighter" style={{ fontSize: isLive ? '1.5rem' : '2.2rem', color: selectedProgram?.themeColor || 'var(--primary)', margin: 0 }}>QUOTATION</h1>
            <div className="mt-2 bg-gray-100 inline-block px-3 py-1 rounded text-sm font-bold text-gray-600">
              #{docData.quotationNumber || 'DRAFT'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="text-xl font-bold" style={{ margin: 0, color: '#ef4444' }}>{selectedProgram?.name}</h2>
            <p className="text-xs text-gray-500 max-w-[200px] ml-auto mt-1">{selectedProgram?.address}</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Quoted To:</h3>
            <p className="font-bold text-lg text-gray-900 leading-tight">{docData.customer?.customerName || customer?.customerName || 'Select Customer'}</p>
            <p className="text-sm text-gray-500 mt-1">{docData.customer?.address || customer?.address || ''}</p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Date:</h3>
            <p className="font-bold text-gray-900">{new Date(docData.createdAt || docData.date).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase" style={{ width: '40px', paddingLeft: 0 }}>Sr.</th>
              <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase" style={{ paddingLeft: 0 }}>Item Description</th>
              <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase" style={{ width: '60px' }}>Qty</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase" style={{ width: '100px' }}>Price</th>
              <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase" style={{ width: '120px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {docData.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-4 text-sm text-gray-500" style={{ paddingLeft: 0 }}>{idx + 1}</td>
                <td className="py-4" style={{ paddingLeft: 0 }}>
                  <div className="font-bold text-gray-900">{item.productName || 'Item'}</div>
                  {item.description && <div className="text-[10px] text-gray-400 italic">{item.description}</div>}
                </td>
                <td className="py-4 text-center text-sm font-medium">{item.quantity}</td>
                <td className="py-4 text-right text-sm">&#8377; {(item.price || 0).toLocaleString()}</td>
                <td className="py-4 text-right font-bold text-gray-900">&#8377; {(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="w-64 ml-auto">
          <div className="flex justify-between items-center py-4 border-t-2 border-gray-900">
            <span className="text-sm font-bold text-gray-400 uppercase">Grand Total</span>
            <span className="text-2xl font-black text-gray-900">&#8377; {(docData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  if (previewData) {
    return (
      <div className="preview-overlay bg-gray-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button className="btn btn-secondary flex items-center gap-2" onClick={() => setPreviewData(null)}>
              <X size={18} /> Close
            </button>
            <button className="btn btn-primary flex items-center gap-2" onClick={() => handlePrint(previewData)}>
              <Printer size={18} /> Print PDF
            </button>
          </div>
          {renderPreviewDocument(previewData, false)}
        </div>
      </div>
    );
  }

  const totals = getTotals();
  const livePreviewData = {
    customer: customers.find(c => c._id === formData.customer),
    items: items,
    totalAmount: totals.totalAmount,
    date: formData.date
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500">Manage and track your business proposals</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input 
              type="text" 
              className="form-control pl-10" 
              placeholder="Search name or number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
            </div>
          </div>
          <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2 whitespace-nowrap`}
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Create New Quotation'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-top-4">
          <div className="card shadow-2xl border-t-4 border-primary">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
              {editingId ? 'Update Quotation' : 'Quotation Details'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select 
                    className="form-control" 
                    required 
                    value={formData.customer} 
                    onChange={e => setFormData({...formData, customer: e.target.value})}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quotation Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">Line Items</h3>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)} 
                        className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border hover:bg-rose-50"
                      >
                        <X size={14} />
                      </button>
                      <div className="grid grid-cols-12 gap-3 mb-3">
                        <div className="col-span-12 md:col-span-6">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Product / Service</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            value={item.productName} 
                            onChange={e => updateItem(index, 'product', e.target.value)} 
                            list="product-list" 
                            placeholder="Name..." 
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                          <input type="number" className="form-control" required value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Price</label>
                          <input type="number" className="form-control" required value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Total</label>
                          <div className="h-[38px] flex items-center font-bold text-primary">&#8377; {item.total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms</label>
                  <input type="text" className="form-control" value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Terms..." />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-4 text-lg shadow-xl">
                {editingId ? 'Update Quotation' : 'Save & Generate Quotation'}
              </button>
            </form>
          </div>

          <div className="hidden lg:block sticky top-8">
            <h2 className="text-xl font-bold mb-6 text-gray-400">Document Preview</h2>
            <div className="shadow-2xl rounded-2xl overflow-hidden border">
              {renderPreviewDocument(livePreviewData, true)}
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-xl border-none">
        <div className="table-container border-none shadow-none">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4">Quotation No</th>
                <th className="py-4">Customer</th>
                <th className="py-4">Date</th>
                <th className="py-4">Amount</th>
                <th className="py-4 text-center">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.map(q => (
                <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-bold text-primary">{q.quotationNumber}</td>
                  <td>{q.customer?.customerName || 'Unknown'}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="font-bold text-gray-900">&#8377; {q.totalAmount?.toLocaleString()}</td>
                  <td className="text-center">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-primary bg-white border rounded-lg shadow-sm" onClick={() => setPreviewData(q)}>
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-emerald-600 bg-white border rounded-lg shadow-sm" onClick={() => handleEdit(q)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-rose-600 bg-white border rounded-lg shadow-sm" onClick={() => handleDelete(q._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <datalist id="product-list">
        {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
      </datalist>
    </div>
  );
};

export default Quotations;
