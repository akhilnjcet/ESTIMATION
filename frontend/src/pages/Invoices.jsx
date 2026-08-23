import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Trash2, Plus, X, Eye, Receipt, Search, CheckCircle2, Download, Settings } from 'lucide-react';

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
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); alert('Failed to delete invoice'); }
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
    setItems([...items, { product: '', productName: '', description: '', price: 0, quantity: 1, unit: 'Units', taxPercentage: 0, total: 0, autoCalculate: true }]);
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
    const shouldCalculate = newItems[index].autoCalculate !== false;
    newItems[index].total = shouldCalculate
      ? Number(newItems[index].price) * Number(newItems[index].quantity)
      : Number(newItems[index].price);
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
    } catch (err) { alert('Failed to save: ' + (err.response?.data?.message || err.message)); }
  };

  const renderPreviewDocument = (docData, activeTheme = null) => {
    const theme = activeTheme || docData.theme || 'classic';
    const itemsList = Array.isArray(docData.items) ? docData.items : [];

    // MODERN THEME STRUCTURAL LAYOUT
    if (theme === 'modern') {
      return (
        <div className="invoice-container theme-modern" style={{ padding: '2rem', background: '#F8FAFC', color: '#0F172A', borderRadius: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', padding: '1.5rem', borderRadius: '12px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {selectedProgram?.showLogo && selectedProgram?.logo && (
                <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '65px', objectFit: 'contain', marginBottom: '0.4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
              )}
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>{selectedProgram?.name}</h2>
              <p style={{ fontSize: '0.775rem', opacity: 0.9, margin: '0.2rem 0 0 0', maxWidth: '320px' }}>{selectedProgram?.address}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Modern Tax Invoice
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>TAX INVOICE</h1>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0.3rem 0 0 0' }}>#{docData.invoiceNumber || 'DRAFT'}</p>
              <p style={{ fontSize: '0.75rem', margin: '0.15rem 0 0 0', opacity: 0.85 }}>Date: {new Date(docData.createdAt || docData.date || Date.now()).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' }}>Billed To Customer</span>
              <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', margin: '0.2rem 0 0 0' }}>{docData.customer?.customerName || 'Select Customer'}</p>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>{docData.customer?.address || ''}</p>
            </div>
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #10B981', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>Payment Details</span>
              <p style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', margin: '0.2rem 0 0 0' }}>Mode: Bank Transfer / UPI</p>
              <span style={{ display: 'inline-block', background: '#D1FAE5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', marginTop: '0.3rem' }}>
                PAID IN FULL
              </span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem' }}>
            <thead>
              <tr style={{ background: '#1E293B', color: '#FFFFFF' }}>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem', borderRadius: '6px 0 0 6px' }}>#</th>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem' }}>Item & Service</th>
                <th style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.725rem' }}>Qty</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem' }}>Price</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem', borderRadius: '0 6px 6px 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem', fontSize: '0.775rem', color: '#64748B' }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '0.65rem', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>{item.productName || 'Item'}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit || 'Pcs'}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: '800', fontSize: '0.825rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', minWidth: '240px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                <span>Sub Total</span><span>&#8377;{(docData.subTotal || docData.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '900', color: '#3B82F6', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #3B82F6' }}>
                <span>Grand Total</span><span>&#8377;{(docData.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // EXECUTIVE THEME STRUCTURAL LAYOUT
    if (theme === 'executive') {
      return (
        <div className="invoice-container theme-executive" style={{ padding: '2rem', background: '#FFFFFF', color: '#0F172A', borderRadius: '14px', borderTop: '8px solid #0F172A' }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double #0F172A', paddingBottom: '1.25rem' }}>
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', margin: '0 auto 0.5rem auto', display: 'block' }} />
            )}
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Georgia, serif' }}>
              {selectedProgram?.name}
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.2rem 0 0 0' }}>{selectedProgram?.address}</p>
          </div>

          <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '0.75rem 1.25rem', marginTop: '1.25rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#F59E0B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Georgia, serif' }}>
              OFFICIAL TAX INVOICE
            </h1>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: '800', color: '#FFFFFF' }}>INVOICE NO: #{docData.invoiceNumber || 'DRAFT'}</span>
            </div>
          </div>

          <div style={{ border: '1px solid #0F172A', padding: '0.85rem', borderRadius: '6px', background: '#FAFAFA', marginTop: '1.25rem' }}>
            <div style={{ background: '#0F172A', color: '#D97706', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', borderRadius: '3px', display: 'inline-block' }}>
              CLIENT / CONSIGNEE
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.2rem 0 0 0' }}>{docData.customer?.address || ''}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem', border: '1px solid #0F172A' }}>
            <thead>
              <tr style={{ background: '#0F172A', color: '#F59E0B' }}>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>SR</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>ITEM DESCRIPTION</th>
                <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.725rem', fontWeight: '800' }}>QTY</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>PRICE</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #CBD5E1' }}>
                  <td style={{ padding: '0.6rem', fontSize: '0.775rem', fontWeight: '700' }}>{idx + 1}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.825rem', fontWeight: '800', color: '#0F172A' }}>{item.productName || 'Item'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit || 'Pcs'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '900', fontSize: '0.825rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid #0F172A' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A', borderBottom: '2px solid #D97706', paddingBottom: '0.3rem', display: 'inline-block' }}>
              GRAND TOTAL: &#8377;{(docData.totalAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    // CLASSIC STANDARD THEME STRUCTURAL LAYOUT (DEFAULT)
    return (
      <div className={`invoice-container theme-classic`} style={{ '--theme-color': selectedProgram?.themeColor || '#3b82f6', padding: '2rem', background: '#FFF', color: '#1e293b' }}>
        <div className="invoice-header">
          <div className="company-section">
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" className="company-logo" style={{ maxHeight: '85px', objectFit: 'contain' }} />
            )}
            <div className="company-details">
              <h1 className="company-name" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{selectedProgram?.name}</h1>
              <p className="company-address" style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{selectedProgram?.address}</p>
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>TAX INVOICE</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                <b>No:</b> #{docData.invoiceNumber || 'DRAFT'} | <b>Date:</b> {new Date(docData.createdAt || docData.date || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>

        <div className="invoice-info" style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Billed To:</h3>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '250px' }}>{docData.customer?.address || ''}</p>
          </div>
          {docData.showPaymentTerms !== false && (
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Payment Status:</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#0f172a' }}><b>Mode:</b> Bank / UPI / Cash</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>Fully Settled</p>
            </div>
          )}
        </div>

        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Sr.</th>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Item Description</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem' }}>Qty</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Unit Price</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>{String(idx + 1).padStart(2, '0')}</td>
                <td style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.productName || 'Item'}</div>
                  {item.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.description}</div>}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.85rem' }}>{item.quantity} {item.unit === 'Kg' ? 'Kg' : 'Pcs'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-section" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {docData.showTax !== false && (
            <>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Sub Total</span>
                <span style={{ fontWeight: '600' }}>&#8377;{(docData.subTotal || docData.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Tax</span>
                <span style={{ fontWeight: '600' }}>&#8377;{(docData.taxAmount || 0).toLocaleString()}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', borderTop: '2px solid #3b82f6', paddingTop: '0.5rem' }}>
            <span>Grand Total</span>
            <span>&#8377;{(docData.totalAmount || 0).toLocaleString()}</span>
          </div>
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
    setTimeout(() => { window.print(); }, 500);
  };

  const handleDownloadPdf = (docData) => {
    const element = document.querySelector('.modal-print-overlay .invoice-container') || document.querySelector('.invoice-container');
    if (!element) return;
    const fileName = `Invoice-${docData?.invoiceNumber || 'DRAFT'}.pdf`;
    
    const opt = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleToggleInvoiceStatus = async (inv) => {
    const currentVal = (inv.status || inv.paymentStatus || 'Unpaid').toUpperCase();
    const newStatus = currentVal === 'PAID' ? 'Unpaid' : 'Paid';
    const customerId = typeof inv.customer === 'object' ? inv.customer?._id : inv.customer;

    // Optimistic UI state update
    setInvoices(prev => prev.map(i => i._id === inv._id ? { ...i, status: newStatus, paymentStatus: newStatus } : i));

    try {
      await api.put(`/invoices/${inv._id}`, {
        ...inv,
        customer: customerId || null,
        status: newStatus,
        paymentStatus: newStatus
      });
      fetchInvoices();
    } catch (err) {
      alert('Failed to update invoice status: ' + (err.response?.data?.message || err.message));
      fetchInvoices();
    }
  };

  if (previewData) {
    return (
      <div 
        className="modal-print-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          background: 'rgba(11, 18, 32, 0.88)',
          backdropFilter: 'blur(16px)',
          padding: '2rem 1rem',
          overflowY: 'auto',
          display: 'flex',
          justify: 'center',
          alignItems: 'flex-start'
        }}
      >
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn-secondary-glass" onClick={() => setPreviewData(null)}>
              <X size={18} /> Close Preview
            </button>
            
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {['classic', 'modern', 'executive'].map(t => (
                <button
                  key={t}
                  onClick={() => setPreviewTheme(t)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: 'none',
                    background: previewTheme === t ? 'var(--primary)' : 'transparent',
                    color: previewTheme === t ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {t} Theme
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-gradient" onClick={() => handleDownloadPdf(previewData)}>
                <Download size={18} /> Download Invoice PDF File
              </button>

              <button className="btn-secondary-glass" onClick={triggerPrint} title="Print via Browser">
                <Printer size={18} /> Print
              </button>
            </div>
          </div>

          <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt size={26} style={{ color: 'var(--primary)' }} />
            Tax Invoices & Billing
          </h1>
          <p className="page-subtitle">Manage, create, and print professional GST invoices</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search invoice or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button 
            className="btn-gradient"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel Editor' : 'Create New Invoice'}
          </button>
        </div>
      </div>

      {/* Split Screen Form & Preview */}
      {showForm && (
        <div className="grid-12">
          <div className="glass-panel col-span-6" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Edit Invoice' : 'New Invoice Builder'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <select 
                    className="form-select" 
                    required 
                    value={formData.customer} 
                    onChange={e => setFormData({...formData, customer: e.target.value})}
                  >
                    <option value="">Select party...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice No.</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Auto-generated"
                    value={formData.invoiceNumber} 
                    onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="form-label">Line Items</span>
                  <button type="button" className="btn-secondary-glass" onClick={addItem} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {items.map((item, index) => (
                    <div key={index} className="glass-card" style={{ padding: '0.85rem', position: 'relative' }}>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)} 
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <X size={15} />
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.65rem' }}>
                        <div>
                          <label className="form-label">Product / Service</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required 
                            value={item.productName} 
                            onChange={e => updateItem(index, 'product', e.target.value)} 
                            list="product-list" 
                            placeholder="Name..." 
                          />
                        </div>
                        <div>
                          <label className="form-label">Qty</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            required 
                            value={item.quantity} 
                            onChange={e => updateItem(index, 'quantity', e.target.value)} 
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="form-label">Price (&#8377;)</label>
                            <label style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <input 
                                type="checkbox" 
                                checked={item.autoCalculate !== false} 
                                onChange={e => updateItem(index, 'autoCalculate', e.target.checked)} 
                              />
                              Per Pc
                            </label>
                          </div>
                          <input 
                            type="number" 
                            className="form-input" 
                            required 
                            value={item.price} 
                            onChange={e => updateItem(index, 'price', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Design & Tax Settings */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                  <Settings size={16} style={{ color: 'var(--primary)' }} /> Design & Tax Settings
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Document Theme</label>
                    <select 
                      className="form-select"
                      value={formData.theme || 'classic'}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    >
                      <option value="classic">Classic / Professional</option>
                      <option value="modern">Modern / Minimal</option>
                      <option value="executive">Bold / Executive</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.showTax !== false}
                        onChange={(e) => setFormData({ ...formData, showTax: e.target.checked })}
                      />
                      Include Tax Info in Print
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.showPaymentTerms !== false}
                        onChange={(e) => setFormData({ ...formData, showPaymentTerms: e.target.checked })}
                      />
                      Include Payment Terms
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.showSignature !== false}
                        onChange={(e) => setFormData({ ...formData, showSignature: e.target.checked })}
                      />
                      Include Authorized Signature
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.showFooter !== false}
                        onChange={(e) => setFormData({ ...formData, showFooter: e.target.checked })}
                      />
                      Include Footer Note
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Terms & Conditions</label>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.showTerms !== false}
                          onChange={(e) => setFormData({ ...formData, showTerms: e.target.checked })}
                          style={{ marginRight: '0.2rem' }}
                        />
                        Show in Print
                      </label>
                    </div>
                    <textarea 
                      className="form-textarea"
                      rows={2}
                      placeholder="Enter specific terms..."
                      value={formData.termsAndConditions || ''}
                      onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Footer Note (Print bottom)</label>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.showFooter !== false}
                          onChange={(e) => setFormData({ ...formData, showFooter: e.target.checked })}
                          style={{ marginRight: '0.2rem' }}
                        />
                        Show in Print
                      </label>
                    </div>
                    <textarea 
                      className="form-textarea"
                      rows={2}
                      placeholder="Enter custom footer note..."
                      value={formData.footerText || ''}
                      onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Notes (Internal only)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Internal notes..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem' }}>
                {editingId ? 'Update Invoice' : 'Save & Generate Invoice'}
              </button>
            </form>
          </div>

          <div className="glass-panel col-span-6" style={{ padding: '1.25rem', sticky: 'top', top: '90px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Document Live Preview
            </h3>
            <div style={{ borderRadius: '14px', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
              {renderPreviewDocument(livePreviewData, formData.theme)}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Master Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(inv => (
              <motion.tr key={inv._id} whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                <td style={{ fontWeight: '800', color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                <td style={{ fontWeight: '700' }}>{inv.customer?.customerName || 'Unknown'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: '800' }}>&#8377; {inv.totalAmount?.toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleInvoiceStatus(inv)}
                    className={`badge ${(inv.status || inv.paymentStatus || 'Unpaid').toUpperCase() === 'PAID' ? 'badge-success' : 'badge-warning'}`}
                    style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.15s ease' }}
                    title="Click to toggle Paid / Unpaid"
                  >
                    <CheckCircle2 size={11} /> {(inv.status || inv.paymentStatus || 'Unpaid').toUpperCase() === 'PAID' ? 'Paid' : 'Unpaid'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button className="btn-icon" onClick={() => { setPreviewData(inv); setPreviewTheme(inv.theme || 'classic'); }} title="View & Print"><Eye size={15} /></button>
                    <button className="btn-icon" onClick={() => handleEdit(inv)} title="Edit Invoice"><Edit2 size={15} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(inv._id)} title="Delete Invoice" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No tax invoices recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <datalist id="product-list">
        {products.map(p => <option key={p._id} value={p.productName}>{p.price ? `₹${p.price}` : ''}</option>)}
      </datalist>
    </div>
  );
};

export default Invoices;
