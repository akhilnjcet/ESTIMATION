import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Trash2, Plus, X, Eye } from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
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
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, [selectedProgram]);

  const fetchInvoices = async () => {
    try { const { data } = await api.get('/invoices'); setInvoices(data); } catch (err) {}
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
      alert('Invoice deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete invoice');
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

  const handleEdit = (inv) => {
    setEditingId(inv._id);
    setFormData({
      customer: inv.customer?._id || inv.customer,
      notes: inv.notes || '',
      terms: inv.terms || '',
      date: inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setItems(inv.items.map(item => ({
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
        await api.put(`/invoices/${editingId}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      resetForm();
      fetchInvoices();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePrint = (docData) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${docData.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; font-size: 16px; line-height: 24px; color: #555; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${selectedProgram?.themeColor || '#4f46e5'}; padding-bottom: 20px; margin-bottom: 30px; }
            .business-info h1 { margin: 0; color: ${selectedProgram?.themeColor || '#4f46e5'}; font-size: 28px; }
            .business-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 32px; color: #e2e8f0; font-weight: 800; letter-spacing: -1px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details div { width: 45%; }
            .details h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
            .details p { margin: 0; font-weight: bold; font-size: 14px; }
            table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-bottom: 30px; }
            table th { background: #f8fafc; padding: 12px; border-bottom: 2px solid #edf2f7; font-size: 12px; text-transform: uppercase; color: #64748b; }
            table td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
            .totals { width: 300px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 20px; font-weight: bold; color: ${selectedProgram?.themeColor || '#4f46e5'}; border-top: 2px solid #edf2f7; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 100px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 11px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="business-info">
                <h1>${selectedProgram?.name}</h1>
                <p>${selectedProgram?.address || ''}</p>
                <p>Phone: ${selectedProgram?.phone || ''} | Email: ${selectedProgram?.email || ''}</p>
                ${selectedProgram?.gstNumber ? `<p>GST: ${selectedProgram?.gstNumber}</p>` : ''}
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p style="font-weight: bold; color: #1e293b;">${docData.invoiceNumber}</p>
              </div>
            </div>

            <div class="details">
              <div>
                <h3>Billed To:</h3>
                <p style="font-size: 18px;">${docData.customer?.customerName}</p>
                <p style="font-weight: normal; color: #64748b;">${docData.customer?.phone || ''}</p>
                <p style="font-weight: normal; color: #64748b;">${docData.customer?.email || ''}</p>
              </div>
              <div style="text-align: right">
                <h3>Invoice Details:</h3>
                <p style="font-weight: normal">Date: <strong>${new Date(docData.createdAt || docData.date).toLocaleDateString()}</strong></p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center">Qty</th>
                  <th style="text-align: right">Price</th>
                  <th style="text-align: right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${docData.items.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: bold">${item.productName}</div>
                      <div style="font-size: 11px; color: #64748b">${item.description || ''}</div>
                    </td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: right">₹${item.price.toLocaleString()}</td>
                    <td style="text-align: right">₹${item.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row grand-total">
                <span>Total Amount:</span>
                <span>₹${docData.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Powered by Krishna IT Solutions</p>
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
    return (
      <div className="preview-document-card card" style={{ 
        background: '#fff', 
        padding: isLive ? '1rem' : 'clamp(1rem, 3vw, 2.5rem)', 
        color: '#000', 
        margin: '0 auto', 
        width: isLive ? '100%' : '95%',
        maxWidth: '800px', 
        overflow: 'hidden',
        boxShadow: isLive ? 'none' : '0 10px 30px rgba(0,0,0,0.08)',
        border: '1px solid #edf2f7'
      }}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 border-b pb-4">
          <div className="w-full sm:w-auto">
            <h1 className="font-black tracking-tighter" style={{ fontSize: isLive ? '1.8rem' : 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--secondary)', margin: 0 }}>INVOICE</h1>
            <p className="text-sm text-gray-500" style={{ margin: 0 }}>#{docData.invoiceNumber || 'DRAFT'}</p>
          </div>
          <div className="sm:text-right w-full sm:w-auto">
            <h2 className="text-xl font-bold" style={{ margin: 0, color: selectedProgram?.themeColor || 'var(--secondary)' }}>{selectedProgram?.name}</h2>
            <p className="text-[11px] text-gray-500 max-w-[250px] sm:ml-auto mt-1 leading-tight">{selectedProgram?.address}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
          <div>
            <h3 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Billed To:</h3>
            <p className="font-bold text-lg">{docData.customer?.customerName || 'Select Customer'}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm"><strong>Date:</strong> {new Date(docData.createdAt || docData.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase">Item</th>
                <th className="p-3 text-center text-[10px] font-bold text-gray-400 uppercase" style={{ width: '50px' }}>Qty</th>
                <th className="p-3 text-right text-[10px] font-bold text-gray-400 uppercase" style={{ width: '90px' }}>Price</th>
                <th className="p-3 text-right text-[10px] font-bold text-gray-400 uppercase" style={{ width: '100px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {docData.items.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50/50">
                  <td className="p-3">
                    <div className="font-bold text-gray-900 text-sm">{item.productName || 'Item'}</div>
                    {item.description && <div className="text-[10px] text-gray-400 italic leading-tight">{item.description}</div>}
                  </td>
                  <td className="p-3 text-center text-xs">{item.quantity}</td>
                  <td className="p-3 text-right text-xs">&#8377;{(item.price || 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-gray-900 text-xs">&#8377;{(item.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-full sm:w-64 ml-auto">
          <div className="flex justify-between items-center py-4 border-t-2 border-gray-900">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-primary">&#8377;{(docData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  if (previewData) {
    return (
      <div className="preview-overlay bg-gray-900/60 backdrop-blur-sm min-h-screen p-2 md:p-8 fixed inset-0 z-[2000] overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 z-10 p-2 no-print">
            <button className="btn btn-secondary flex items-center gap-2 bg-white/90 backdrop-blur-md" onClick={() => setPreviewData(null)}>
              <X size={18} /> <span>Close</span>
            </button>
            <button className="btn btn-primary flex items-center gap-2 shadow-lg" onClick={() => window.print()}>
              <Printer size={18} /> <span>Print</span>
            </button>
          </div>
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {renderPreviewDocument(previewData, false)}
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Manage and track your billing records</p>
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
            {showForm ? 'Cancel' : 'Create New Invoice'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-top-4">
          <div className="card shadow-2xl border-t-4 border-primary">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
              {editingId ? 'Update Invoice' : 'Invoice Details'}
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
                  <label className="form-label">Invoice Date</label>
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
                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed">
                      No items added yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms</label>
                  <input type="text" className="form-control" value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Payment terms..." />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-4 text-lg shadow-xl hover:scale-[1.01] transition-transform">
                {editingId ? 'Update & Save Changes' : 'Save & Generate Invoice'}
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
                <th className="py-4">Invoice No</th>
                <th className="py-4">Customer</th>
                <th className="py-4">Date</th>
                <th className="py-4">Amount</th>
                <th className="py-4 text-center">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map(inv => (
                <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 font-bold text-primary">{inv.invoiceNumber}</td>
                  <td className="py-4">
                    <div className="font-bold text-gray-900">{inv.customer?.customerName || 'Unknown'}</div>
                  </td>
                  <td className="py-4 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-gray-900">&#8377; {inv.totalAmount?.toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-2 text-gray-400 hover:text-primary transition-colors bg-white border rounded-lg shadow-sm"
                        onClick={() => setPreviewData(inv)}
                        title="View / Print"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-white border rounded-lg shadow-sm"
                        onClick={() => handleEdit(inv)}
                        title="Edit Invoice"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-white border rounded-lg shadow-sm"
                        onClick={() => handleDelete(inv._id)}
                        title="Delete Invoice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-gray-400">No invoices found.</td>
                </tr>
              )}
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

export default Invoices;
