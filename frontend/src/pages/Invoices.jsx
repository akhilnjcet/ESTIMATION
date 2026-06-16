import { useState, useEffect } from 'react';
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
  const [previewTheme, setPreviewTheme] = useState('classic');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ 
    customer: '', 
    notes: '', 
    terms: '',
    showTerms: true,
    showTax: true,
    showPaymentTerms: true,
    showSignature: true,
    showFooter: true,
    footerText: '',
    theme: 'classic',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: ''
  });
  const [items, setItems] = useState([]);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [prevProgramId, setPrevProgramId] = useState(selectedProgram?._id);
  if (selectedProgram?._id !== prevProgramId) {
    setPrevProgramId(selectedProgram?._id);
    if (!editingId && selectedProgram) {
      setFormData(prev => ({
        ...prev,
        terms: selectedProgram.defaultTerms || prev.terms,
        showTerms: selectedProgram.showTermsByDefault !== undefined ? selectedProgram.showTermsByDefault : true,
        footerText: selectedProgram.footerText || 'This is a computer generated invoice.\nThank you for your business! | Powered by Krishna ERP'
      }));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, [selectedProgram]);

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

  const resetForm = () => {
    setFormData({ 
      customer: '', 
      notes: '', 
      terms: selectedProgram?.defaultTerms || '',
      showTerms: selectedProgram?.showTermsByDefault !== undefined ? selectedProgram.showTermsByDefault : true,
      showTax: true,
      showPaymentTerms: true,
      showSignature: true,
      showFooter: true,
      footerText: selectedProgram?.footerText || 'This is a computer generated invoice.\nThank you for your business! | Powered by Krishna ERP',
      theme: 'classic',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: ''
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
      showTerms: inv.showTerms !== undefined ? inv.showTerms : true,
      showTax: inv.showTax !== undefined ? inv.showTax : true,
      showPaymentTerms: inv.showPaymentTerms !== undefined ? inv.showPaymentTerms : true,
      showSignature: inv.showSignature !== undefined ? inv.showSignature : true,
      showFooter: inv.showFooter !== undefined ? inv.showFooter : true,
      footerText: inv.footerText !== undefined ? inv.footerText : (selectedProgram?.footerText || 'This is a computer generated invoice.\nThank you for your business! | Powered by Krishna ERP'),
      theme: inv.theme || 'classic',
      date: inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      invoiceNumber: inv.invoiceNumber || ''
    });
    setItems(inv.items.map(item => ({
      ...item,
      product: item.product?._id || item.product
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addItem = () => {
    setItems([...items, { product: '', productName: '', description: '', price: 0, quantity: 1, unit: 'Units', taxPercentage: 0, total: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'product') {
      const prod = products.find(p => p._id === value || p.productName === value);
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
    let taxAmount = formData.showTax
      ? items.reduce((acc, item) => acc + (item.total * Number(item.taxPercentage) / 100), 0)
      : 0;
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

  const renderPreviewDocument = (docData, activeTheme = null) => {
    const theme = activeTheme || docData.theme || 'classic';
    return (
      <div className={`invoice-container theme-${theme}`} style={{ '--theme-color': selectedProgram?.themeColor || '#4f46e5' }}>
        <div className="invoice-header">
          <div className="company-section">
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" className="company-logo" />
            )}
            <div className="company-details">
              <h1 className="company-name">{selectedProgram?.name}</h1>
              <p className="company-address">{selectedProgram?.address}</p>
            </div>
          </div>
          
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            marginTop: '10px'
          }}>
            <div>
              <h2 style={{ margin: 0, color: '#111', fontSize: '28px', fontWeight: '900', letterSpacing: '2px' }}>INVOICE</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#111' }}>
                <b>No:</b> #{docData.invoiceNumber || 'DRAFT'} | <b>Date:</b> {new Date(docData.createdAt || docData.date).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>

        <div className="invoice-info">
          <div>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '10px' }}>Billed To:</h3>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666', maxWidth: '250px' }}>{docData.customer?.address || ''}</p>
          </div>
          {docData.showPaymentTerms !== false && (
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '10px' }}>Payment Info:</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#111' }}><b>Mode:</b> Bank / UPI / Cash</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#111' }}><b>Status:</b> Fully Paid</p>
            </div>
          )}
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Sr.</th>
              <th>Item Description</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Unit Price</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {docData.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ color: '#999' }}>{String(idx + 1).padStart(2, '0')}</td>
                <td>
                  <div style={{ fontWeight: '600', color: '#111' }}>{item.productName || 'Item'}</div>
                  {item.description && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{item.description}</div>}
                </td>
                 <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit === 'Kg' ? 'Kg' : 'Pcs'}</td>
                <td style={{ textAlign: 'right' }}>&#8377;{(item.price || 0).toLocaleString()}</td>
                <td style={{ textAlign: 'right', fontWeight: '700' }}>&#8377;{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-section">
          {docData.showTax !== false && (
            <>
              <div className="total-row">
                <span style={{ color: '#666' }}>Sub Total</span>
                <span style={{ fontWeight: '600' }}>&#8377;{(docData.subTotal || docData.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span style={{ color: '#666' }}>Tax</span>
                <span style={{ fontWeight: '600' }}>&#8377;{(docData.taxAmount || 0).toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="total-row grand-total">
            <span>Grand Total</span>
            <span>&#8377;{(docData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>

          <div className="invoice-footer">
            <div style={{ maxWidth: '350px' }}>
              {docData.showTerms && docData.terms && (
                <>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Terms & Conditions:</h4>
                  <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {docData.terms}
                  </div>
                </>
              )}
              {docData.showFooter !== false && (docData.footerText || '').split('\n').map((line, idx) => (
                <p key={idx} style={{ fontSize: '10px', color: '#999', margin: idx > 0 ? '2px 0 0 0' : '10px 0 0 0' }}>
                  {line}
                </p>
              ))}
            </div>
            
            {docData.showSignature !== false && (selectedProgram?.signatureUrl || selectedProgram?.signatureTitle) && (
              <div className="signature-section">
                {selectedProgram?.signatureUrl && (
                  <img src={selectedProgram.signatureUrl} alt="Signature" className="signature-image" />
                )}
                {selectedProgram?.signatureTitle && (
                  <p className="signature-label">{selectedProgram.signatureTitle}</p>
                )}
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#999' }}>For {selectedProgram?.name}</p>
              </div>
            )}
          </div>
      </div>
    );
  };

  const triggerPrint = async () => {
    const images = document.querySelectorAll('.invoice-container img');
    await Promise.all(
      [...images].map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (previewData) {
    return (
      <div className="preview-overlay bg-gray-900/60 backdrop-blur-sm min-h-screen p-2 md:p-8 fixed inset-0 z-[2000] overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 z-10 p-2 no-print">
            <button className="btn btn-secondary flex items-center gap-2 bg-white/90 backdrop-blur-md" onClick={() => setPreviewData(null)}>
              <X size={18} /> <span>Close</span>
            </button>
            
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg border shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase px-1">Theme</span>
              <select 
                className="form-control py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                style={{ width: '180px' }}
                value={previewTheme}
                onChange={(e) => setPreviewTheme(e.target.value)}
              >
                <option value="classic">Classic / Professional</option>
                <option value="modern">Modern Banner</option>
                <option value="minimalist">Clean Minimalist</option>
              </select>
            </div>

            <button className="btn btn-primary flex items-center gap-2 shadow-lg" onClick={triggerPrint}>
              <Printer size={18} /> <span>Print</span>
            </button>
          </div>
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {renderPreviewDocument(previewData, previewTheme)}
          </div>
        </div>
      </div>
    );
  }

  const totals = getTotals();
  const livePreviewData = {
    customer: customers.find(c => c._id === formData.customer),
    items: items,
    subTotal: totals.subTotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    showTerms: formData.showTerms,
    showTax: formData.showTax,
    showPaymentTerms: formData.showPaymentTerms,
    showSignature: formData.showSignature,
    showFooter: formData.showFooter,
    footerText: formData.footerText,
    theme: formData.theme,
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="form-group mb-0">
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
                    <div className="form-group mb-0">
                      <label className="form-label">Invoice No. (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Auto-generated if blank"
                        value={formData.invoiceNumber} 
                        onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                      />
                    </div>
                    <div className="form-group mb-0">
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
                              <div className="flex gap-1">
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  style={{ minWidth: '50px' }}
                                  required 
                                  value={item.quantity} 
                                  onChange={e => updateItem(index, 'quantity', e.target.value)} 
                                />
                                <select 
                                  className="form-control px-1" 
                                  style={{ width: '70px', flexShrink: 0 }}
                                  value={item.unit || 'Units'} 
                                  onChange={e => updateItem(index, 'unit', e.target.value)}
                                >
                                  <option value="Units">Pcs</option>
                                  <option value="Kg">Kg</option>
                                </select>
                              </div>
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
                      <div className="flex justify-center mt-4">
                        <button 
                          type="button" 
                          className="btn btn-secondary flex items-center gap-2 w-full py-3 justify-center border-dashed border-2 hover:border-primary hover:text-primary transition-all duration-200" 
                          onClick={addItem}
                        >
                          <Plus size={18} />
                          <span>Add Another Line Item</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 border-t pt-6">
                    <h3 className="font-bold text-gray-700 mb-4">Design & Tax Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group mb-0">
                        <label className="form-label">Document Theme</label>
                        <select 
                          className="form-control" 
                          value={formData.theme} 
                          onChange={e => setFormData({...formData, theme: e.target.value})}
                        >
                          <option value="classic">Classic / Professional</option>
                          <option value="modern">Modern Banner</option>
                          <option value="minimalist">Clean Minimalist</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 justify-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showTax} 
                            onChange={e => setFormData({...formData, showTax: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Include Tax Info in Print</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showPaymentTerms} 
                            onChange={e => setFormData({...formData, showPaymentTerms: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Include Payment Info</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showSignature !== false} 
                            onChange={e => setFormData({...formData, showSignature: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Include Authorized Signature</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showFooter !== false} 
                            onChange={e => setFormData({...formData, showFooter: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Include Footer Note</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Terms & Conditions</h3>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showTerms} 
                            onChange={e => setFormData({...formData, showTerms: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Show in Print</span>
                        </label>
                      </div>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        value={formData.terms} 
                        onChange={e => setFormData({...formData, terms: e.target.value})} 
                        placeholder="Enter specific terms for this invoice..."
                        disabled={!formData.showTerms}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Footer Note (Print bottom)</h3>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-primary rounded" 
                            checked={formData.showFooter !== false} 
                            onChange={e => setFormData({...formData, showFooter: e.target.checked})} 
                          />
                          <span className="text-sm font-bold text-gray-600">Show in Print</span>
                        </label>
                      </div>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        value={formData.footerText} 
                        onChange={e => setFormData({...formData, footerText: e.target.value})} 
                        placeholder="Enter custom footer note..."
                        disabled={formData.showFooter === false}
                      />
                    </div>
                  </div>

                  <div className="form-group mb-8">
                    <label className="form-label">Notes (Internal only)</label>
                    <input type="text" className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes..." />
                  </div>

                  <button type="submit" className="btn btn-primary w-full py-4 text-lg shadow-xl hover:scale-[1.01] transition-transform">
                    {editingId ? 'Update & Save Changes' : 'Save & Generate Invoice'}
                  </button>
                </form>
              </div>

              <div className="hidden lg:block sticky top-8">
                <h2 className="text-xl font-bold mb-6 text-gray-400">Document Preview</h2>
                <div className="shadow-2xl rounded-2xl overflow-hidden border">
              {renderPreviewDocument(livePreviewData, formData.theme)}
            </div>
              </div>
            </div>
          )}

          <div className="card shadow-xl border-none bg-white">
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
                            onClick={() => { setPreviewData(inv); setPreviewTheme(inv.theme || 'classic'); }}
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
            {products.map(p => <option key={p._id} value={p.productName}>{p.price ? `₹${p.price}` : ''}</option>)}
          </datalist>
    </div>
  );
};

export default Invoices;
