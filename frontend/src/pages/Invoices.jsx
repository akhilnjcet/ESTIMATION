import React, { useState, useEffect } from 'react';
import api from '../utils/api';

import { useProgram } from '../context/ProgramContext';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const { selectedProgram } = useProgram();
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null); 
  
  const [formData, setFormData] = useState({ customer: '', notes: '', terms: '' });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try { const { data } = await api.get('/invoices'); setInvoices(data); } catch (err) {}
  };
  const fetchCustomers = async () => {
    try { const { data } = await api.get('/customers'); setCustomers(data); if(data.length > 0) setFormData(f => ({...f, customer: data[0]._id})); } catch (err) {}
  };
  const fetchProducts = async () => {
    try { const { data } = await api.get('/products'); setProducts(data); } catch (err) {}
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
    
    for (let item of items) {
      if (!item.productName) return alert('Product name is required for all items');
    }

    const { subTotal, taxAmount, totalAmount } = getTotals();
    
    const cleanedItems = items.map(item => {
      const { product, ...rest } = item;
      return product ? item : rest;
    });

    const payload = { ...formData, items: cleanedItems, subTotal, taxAmount, discount: 0, totalAmount };
    
    try {
      await api.post('/invoices', payload);
      setFormData({ customer: customers[0]?._id, notes: '', terms: '' });
      setItems([]);
      setShowForm(false);
      fetchInvoices();
    } catch (err) {
      alert('Failed to save invoice: ' + (err.response?.data?.message || err.message));
      console.error(err);
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
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); font-size: 16px; line-height: 24px; color: #555; }
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
                ${docData.customer?.gstNumber ? `<p style="font-weight: normal; color: #64748b;">GST: ${docData.customer?.gstNumber}</p>` : ''}
              </div>
              <div style="text-align: right">
                <h3>Invoice Details:</h3>
                <p style="font-weight: normal">Date: <strong>${new Date(docData.createdAt).toLocaleDateString()}</strong></p>
                <p style="font-weight: normal">Due Date: <strong>${new Date(new Date(docData.createdAt).getTime() + 7*24*60*60*1000).toLocaleDateString()}</strong></p>
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
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${docData.subTotal.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Tax Amount:</span>
                <span>₹${docData.taxAmount.toLocaleString()}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Amount:</span>
                <span>₹${docData.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            ${docData.notes ? `
              <div style="margin-top: 50px; font-size: 12px;">
                <h3 style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Notes:</h3>
                <p>${docData.notes}</p>
              </div>
            ` : ''}

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
      <div className="card" style={{ background: '#fff', padding: isLive ? '1.5rem' : '3rem', color: '#000', margin: '0 auto', maxWidth: '800px', transform: isLive ? 'scale(0.95)' : 'none', transformOrigin: 'top center' }}>
        <div className="flex justify-between items-start mb-6 border-b pb-4" style={{ borderBottom: '2px solid #e2e8f0' }}>
          <div>
            <h1 style={{ fontSize: isLive ? '1.8rem' : '2.5rem', color: 'var(--secondary)', margin: 0 }}>INVOICE</h1>
            <p style={{ color: '#64748b', margin: 0 }}>#{docData.invoiceNumber || docData.quotationNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: isLive ? '1.2rem' : '1.5rem', color: selectedProgram?.themeColor || 'var(--secondary)' }}>{selectedProgram?.name || 'Program Name'}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: isLive ? '0.8rem' : '1rem' }}>{selectedProgram?.address || 'Address not set'}</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: isLive ? '0.8rem' : '1rem' }}>{selectedProgram?.email || 'email@example.com'} • {selectedProgram?.phone}</p>
            {selectedProgram?.gstNumber && <p style={{ margin: 0, color: '#64748b', fontSize: isLive ? '0.8rem' : '1rem' }}>GST: {selectedProgram?.gstNumber}</p>}
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <div>
            <h3 style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Billed To:</h3>
            <p style={{ fontWeight: 'bold', fontSize: isLive ? '1.1rem' : '1.25rem', margin: 0 }}>{docData.customer?.customerName || 'Customer Name'}</p>
            <p style={{ margin: 0, fontSize: isLive ? '0.85rem' : '1rem' }}>{docData.customer?.email}</p>
            <p style={{ margin: 0, fontSize: isLive ? '0.85rem' : '1rem' }}>{docData.customer?.phone}</p>
            {docData.customer?.gstNumber && <p style={{ margin: 0, fontSize: isLive ? '0.85rem' : '1rem' }}>GST: {docData.customer?.gstNumber}</p>}
          </div>
          <div style={{ textAlign: 'right', fontSize: isLive ? '0.85rem' : '1rem' }}>
            <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(docData.createdAt).toLocaleDateString()}</p>
            <p style={{ margin: 0 }}><strong>Due Date:</strong> {new Date(new Date(docData.createdAt).getTime() + 7*24*60*60*1000).toLocaleDateString()}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: isLive ? '0.85rem' : '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {docData.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.productName || 'Item Name'}</div>
                  {item.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.description}</div>}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{(item.price || 0).toLocaleString()}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.taxPercentage || 0}%</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
            {docData.items.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>Add items to see them here</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ width: isLive ? '250px' : '300px', marginLeft: 'auto', fontSize: isLive ? '0.85rem' : '1rem' }}>
          <div className="flex justify-between mb-2">
            <span style={{ color: '#64748b' }}>Subtotal:</span>
            <span>₹{(docData.subTotal || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span style={{ color: '#64748b' }}>Tax:</span>
            <span>₹{(docData.taxAmount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '2px solid #e2e8f0', fontSize: isLive ? '1.1rem' : '1.25rem', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span style={{ color: 'var(--secondary)' }}>₹{(docData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {(docData.notes || docData.terms) && (
          <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: isLive ? '0.8rem' : '0.9rem' }}>
            {docData.notes && <div className="mb-2"><strong>Notes:</strong> {docData.notes}</div>}
            {docData.terms && <div><strong>Terms & Conditions:</strong> {docData.terms}</div>}
          </div>
        )}
      </div>
    );
  };

  if (previewData) {
    return (
      <div className="preview-overlay" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem' }}>
        <div className="flex justify-between items-center mb-4 print-hide">
          <button className="btn btn-secondary" onClick={() => setPreviewData(null)}>← Back</button>
          <button className="btn btn-primary" onClick={() => handlePrint(previewData)} style={{ backgroundColor: 'var(--secondary)' }}>Print PDF</button>
        </div>
        {renderPreviewDocument(previewData, false)}
      </div>
    );
  }

  const totals = getTotals();
  const liveSelectedCustomer = customers.find(c => c._id === formData.customer);
  
  const livePreviewData = {
    invoiceNumber: 'DRAFT',
    createdAt: new Date(),
    customer: liveSelectedCustomer,
    items: items,
    subTotal: totals.subTotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    notes: formData.notes,
    terms: formData.terms
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>Invoices</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: 'var(--secondary)' }}>{showForm ? 'Cancel' : 'Create Invoice'}</button>
      </div>
      
      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', alignItems: 'start' }}>
          
          <div className="card" style={{ borderTop: '4px solid var(--secondary)', position: 'sticky', top: '1rem' }}>
            <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
            {customers.length === 0 ? <p style={{color:'red'}}>Please add a customer first!</p> : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select className="form-control" required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                    <option value="" disabled>Select a customer...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Items</h3>
                    <button type="button" className="btn btn-secondary" onClick={addItem} style={{padding:'0.5rem', fontSize:'0.75rem'}}>+ Add Item</button>
                  </div>
                  
                  {items.length === 0 && <div style={{padding:'1rem', textAlign:'center', background:'#f8fafc', borderRadius:'8px', color:'gray', fontSize:'0.875rem'}}>Click "+ Add Item" to begin</div>}

                  {items.map((item, index) => (
                    <div key={index} style={{background:'#f8fafc', padding:'1rem', borderRadius:'8px', marginBottom:'1rem', border:'1px solid var(--border)'}}>
                      <div className="flex gap-2 mb-2">
                        <div style={{flex: 2}}>
                          <label className="form-label" style={{fontSize:'0.75rem', marginBottom:'0.2rem'}}>Product / Service</label>
                          <input type="text" className="form-control" style={{padding:'0.5rem'}} required value={item.productName} onChange={e => updateItem(index, 'product', e.target.value)} list="product-list" placeholder="Name..." />
                          <datalist id="product-list">
                            {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                          </datalist>
                        </div>
                        <div style={{flex: 1}}>
                          <label className="form-label" style={{fontSize:'0.75rem', marginBottom:'0.2rem'}}>Qty</label>
                          <input type="number" className="form-control" style={{padding:'0.5rem'}} required value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                        </div>
                        <div style={{flex: 1}}>
                          <label className="form-label" style={{fontSize:'0.75rem', marginBottom:'0.2rem'}}>Price</label>
                          <input type="number" className="form-control" style={{padding:'0.5rem'}} required value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} />
                        </div>
                        <div style={{flex: 1}}>
                          <label className="form-label" style={{fontSize:'0.75rem', marginBottom:'0.2rem'}}>Tax %</label>
                          <input type="number" className="form-control" style={{padding:'0.5rem'}} value={item.taxPercentage} onChange={e => updateItem(index, 'taxPercentage', e.target.value)} />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-end">
                        <div style={{flex: 1}}>
                          <label className="form-label" style={{fontSize:'0.75rem', marginBottom:'0.2rem'}}>Description</label>
                          <input type="text" className="form-control" style={{padding:'0.5rem'}} value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} placeholder="Details..." />
                        </div>
                        <button type="button" onClick={() => removeItem(index)} className="btn btn-secondary" style={{color:'red', borderColor:'red', height:'35px', padding:'0 0.5rem'}}>X</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-grid">
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input type="text" className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Thank you for your business..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Terms</label>
                    <input type="text" className="form-control" value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Payment due on receipt..." />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'1rem', fontSize:'1rem', backgroundColor: 'var(--secondary)'}}>Save & Generate Invoice</button>
              </form>
            )}
          </div>

          <div style={{ position: 'sticky', top: '1rem' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Live Preview</h2>
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              {renderPreviewDocument(livePreviewData, true)}
            </div>
          </div>
          
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td><strong style={{ color: 'var(--secondary)' }}>{inv.invoiceNumber}</strong></td>
                  <td>{inv.customer?.customerName || 'Unknown'}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>₹ {inv.totalAmount?.toLocaleString()}</td>
                  <td><span style={{ color: 'var(--danger)', padding: '0.2rem 0.5rem', background: '#fef2f2', borderRadius: '4px' }}>{inv.status}</span></td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => setPreviewData(inv)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}>View / Print</button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>No invoices found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
