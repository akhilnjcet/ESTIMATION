import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Plus, X, Eye, Trash2, FileText, Search, CheckCircle2, Download, Settings } from 'lucide-react';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
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
    quotationNumber: ''
  });
  const [items, setItems] = useState([]);

  const fetchQuotations = async () => {
    try {
      const { data } = await api.get('/quotations');
      setQuotations(data);
    } catch (err) { console.error('Failed to fetch quotations:', err); }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) { console.error('Failed to fetch customers:', err); }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (err) { console.error('Failed to fetch products:', err); }
  };

  const [prevProgramId, setPrevProgramId] = useState(selectedProgram?._id);
  if (selectedProgram?._id !== prevProgramId) {
    setPrevProgramId(selectedProgram?._id);
    if (!editingId && selectedProgram) {
      setFormData(prev => ({
        ...prev,
        terms: selectedProgram.defaultTerms || prev.terms,
        showTerms: selectedProgram.showTermsByDefault !== undefined ? selectedProgram.showTermsByDefault : true,
        footerText: selectedProgram.footerText || 'This is a computer generated quotation.\nThank you for your interest! | Powered by Krishna ERP'
      }));
    }
  }

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
    fetchProducts();
  }, [selectedProgram]);

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
    } catch (err) { console.error(err); alert('Failed to delete quotation'); }
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
      showItemPrices: true,
      lumpsumAmount: '',
      footerText: selectedProgram?.footerText || 'This is a computer generated quotation.\nThank you for your interest! | Powered by Krishna ERP',
      theme: 'classic',
      date: new Date().toISOString().split('T')[0],
      quotationNumber: ''
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
      showTerms: q.showTerms !== undefined ? q.showTerms : true,
      showTax: q.showTax !== undefined ? q.showTax : true,
      showPaymentTerms: q.showPaymentTerms !== undefined ? q.showPaymentTerms : true,
      showSignature: q.showSignature !== undefined ? q.showSignature : true,
      showFooter: q.showFooter !== undefined ? q.showFooter : true,
      showItemPrices: q.showItemPrices !== undefined ? q.showItemPrices : true,
      lumpsumAmount: q.showItemPrices === false ? (q.subTotal || 0) : '',
      footerText: q.footerText !== undefined ? q.footerText : (selectedProgram?.footerText || 'This is a computer generated quotation.\nThank you for your interest! | Powered by Krishna ERP'),
      theme: q.theme || 'classic',
      date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      quotationNumber: q.quotationNumber || ''
    });
    setItems(q.items.map(item => ({
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
    let subTotal = formData.showItemPrices === false ? Number(formData.lumpsumAmount || 0) : items.reduce((acc, item) => acc + item.total, 0);
    let taxAmount = formData.showTax
      ? (formData.showItemPrices === false ? 0 : items.reduce((acc, item) => acc + (item.total * Number(item.taxPercentage) / 100), 0))
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
        await api.put(`/quotations/${editingId}`, payload);
      } else {
        await api.post('/quotations', payload);
      }
      resetForm();
      fetchQuotations();
    } catch (err) { alert('Failed to save quotation: ' + (err.response?.data?.message || err.message)); }
  };

  const renderPreviewDocument = (docData, activeTheme = null) => {
    const theme = activeTheme || docData.theme || 'classic';
    const itemsList = Array.isArray(docData.items) ? docData.items : [];

    // MODERN THEME STRUCTURAL LAYOUT
    if (theme === 'modern') {
      return (
        <div className="invoice-container theme-modern" style={{ padding: '2rem', background: '#F8FAFC', color: '#0F172A', borderRadius: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #8B5CF6 100%)', padding: '1.5rem', borderRadius: '12px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {selectedProgram?.showLogo && selectedProgram?.logo && (
                <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '65px', objectFit: 'contain', marginBottom: '0.4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
              )}
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>{selectedProgram?.name}</h2>
              <p style={{ fontSize: '0.775rem', opacity: 0.9, margin: '0.2rem 0 0 0', maxWidth: '320px' }}>{selectedProgram?.address}</p>
              {selectedProgram?.phone && <p style={{ fontSize: '0.775rem', opacity: 0.9, margin: '0.1rem 0 0 0' }}>Ph: {selectedProgram.phone}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Modern Estimation Template
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>QUOTATION</h1>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0.3rem 0 0 0' }}>#{docData.quotationNumber || 'EST-DRAFT'}</p>
              <p style={{ fontSize: '0.75rem', margin: '0.15rem 0 0 0', opacity: 0.85 }}>Date: {new Date(docData.createdAt || docData.date || Date.now()).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#8B5CF6', textTransform: 'uppercase' }}>Estimate Prepared For</span>
              <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', margin: '0.2rem 0 0 0' }}>{docData.customer?.customerName || 'Select Customer'}</p>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>{docData.customer?.address || ''}</p>
              {docData.customer?.phone && <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Ph: {docData.customer.phone}</p>}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem' }}>
            <thead>
              <tr style={{ background: '#1E293B', color: '#FFFFFF' }}>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem', borderRadius: '6px 0 0 6px' }}>#</th>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem' }}>Item & Service</th>
                <th style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.725rem' }}>Qty</th>
                {docData.showItemPrices !== false && <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem' }}>Rate</th>}
                {docData.showItemPrices !== false && <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem', borderRadius: '0 6px 6px 0' }}>Amount</th>}
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem', fontSize: '0.775rem', color: '#64748B' }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '0.65rem', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>{item.productName || 'Item'}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit || 'Pcs'}</td>
                  {docData.showItemPrices !== false && <td style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>}
                  {docData.showItemPrices !== false && <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: '800', fontSize: '0.825rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', minWidth: '240px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '900', color: '#8B5CF6' }}>
                <span>Estimated Total</span><span>&#8377;{(docData.totalAmount || 0).toLocaleString()}</span>
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
            {selectedProgram?.phone && <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.1rem 0 0 0' }}>Ph: {selectedProgram.phone}</p>}
          </div>

          <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '0.75rem 1.25rem', marginTop: '1.25rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#F59E0B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Georgia, serif' }}>
              OFFICIAL QUOTATION
            </h1>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: '800', color: '#FFFFFF' }}>ESTIMATE NO: #{docData.quotationNumber || 'EST-DRAFT'}</span>
            </div>
          </div>

          <div style={{ border: '1px solid #0F172A', padding: '0.85rem', borderRadius: '6px', background: '#FAFAFA', marginTop: '1.25rem' }}>
            <div style={{ background: '#0F172A', color: '#D97706', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', borderRadius: '3px', display: 'inline-block' }}>
              CLIENT DETAILS
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.2rem 0 0 0' }}>{docData.customer?.address || ''}</p>
            {docData.customer?.phone && <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.1rem 0 0 0' }}>Ph: {docData.customer.phone}</p>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem', border: '1px solid #0F172A' }}>
            <thead>
              <tr style={{ background: '#0F172A', color: '#F59E0B' }}>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>SR</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>ITEM DESCRIPTION</th>
                <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.725rem', fontWeight: '800' }}>QTY</th>
                {docData.showItemPrices !== false && <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>RATE</th>}
                {docData.showItemPrices !== false && <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>AMOUNT</th>}
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #CBD5E1' }}>
                  <td style={{ padding: '0.6rem', fontSize: '0.775rem', fontWeight: '700' }}>{idx + 1}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.825rem', fontWeight: '800', color: '#0F172A' }}>{item.productName || 'Item'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit || 'Pcs'}</td>
                  {docData.showItemPrices !== false && <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>}
                  {docData.showItemPrices !== false && <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '900', fontSize: '0.825rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid #0F172A' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A', borderBottom: '2px solid #D97706', paddingBottom: '0.3rem', display: 'inline-block' }}>
              ESTIMATED TOTAL: &#8377;{(docData.totalAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    // CLASSIC STANDARD THEME STRUCTURAL LAYOUT (DEFAULT)
    return (
      <div className={`invoice-container theme-classic`} style={{ '--theme-color': selectedProgram?.themeColor || '#8b5cf6', padding: '2rem', background: '#FFF', color: '#1e293b' }}>
        <div className="invoice-header">
          <div className="company-section">
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" className="company-logo" style={{ maxHeight: '85px', objectFit: 'contain' }} />
            )}
            <div className="company-details">
              <h1 className="company-name" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{selectedProgram?.name}</h1>
              <p className="company-address" style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{selectedProgram?.address}</p>
              {selectedProgram?.phone && <p className="company-phone" style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Ph: {selectedProgram.phone}</p>}
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#8b5cf6', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>QUOTATION / ESTIMATE</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                <b>No:</b> #{docData.quotationNumber || 'EST-DRAFT'} | <b>Date:</b> {new Date(docData.createdAt || docData.date || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>

        <div className="invoice-info" style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Estimate For:</h3>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '250px' }}>{docData.customer?.address || ''}</p>
            {docData.customer?.phone && <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '250px' }}>Ph: {docData.customer.phone}</p>}
          </div>
        </div>

        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Sr.</th>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Item Description</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem' }}>Qty</th>
              {docData.showItemPrices !== false && <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Rate</th>}
              {docData.showItemPrices !== false && <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Total</th>}
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
                {docData.showItemPrices !== false && <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem' }}>&#8377;{(item.price || 0).toLocaleString()}</td>}
                {docData.showItemPrices !== false && <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-section" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem', fontWeight: '800', color: '#8b5cf6', borderTop: '2px solid #8b5cf6', paddingTop: '0.5rem' }}>
            <span>Estimated Total</span>
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
    const fileName = `Quotation-${docData?.quotationNumber || 'DRAFT'}.pdf`;
    
    const opt = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleToggleQuotationStatus = async (q) => {
    const currentUpper = (q.status || 'ISSUED').toUpperCase();
    const newStatus = (currentUpper === 'APPROVED' || currentUpper === 'ACCEPTED') ? 'ISSUED' : 'APPROVED';
    const customerId = typeof q.customer === 'object' ? q.customer?._id : q.customer;

    // Optimistic UI state update
    setQuotations(prev => prev.map(item => item._id === q._id ? { ...item, status: newStatus } : item));

    try {
      await api.put(`/quotations/${q._id}`, {
        ...q,
        customer: customerId || null,
        status: newStatus
      });
      fetchQuotations();
    } catch (err) {
      alert('Failed to update quotation status: ' + (err.response?.data?.message || err.message));
      fetchQuotations();
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
                    background: previewTheme === t ? 'var(--secondary)' : 'transparent',
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
                <Download size={18} /> Download Quotation PDF File
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
            <FileText size={26} style={{ color: 'var(--secondary)' }} />
            Quotations & Estimates
          </h1>
          <p className="page-subtitle">Build, preview, and issue estimations to clients</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search quotation..." 
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
            {showForm ? 'Cancel Editor' : 'Create Quotation'}
          </button>
        </div>
      </div>

      {/* Split Form */}
      {showForm && (
        <div className="grid-12">
          <div className="glass-panel col-span-6" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Edit Quotation' : 'New Quotation Builder'}
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
                  <label className="form-label">Quotation No.</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Auto-generated"
                    value={formData.quotationNumber} 
                    onChange={e => setFormData({...formData, quotationNumber: e.target.value})} 
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

                      <div style={{ display: 'grid', gridTemplateColumns: formData.showItemPrices !== false ? '2fr 1fr 1fr' : '2fr 1fr', gap: '0.65rem' }}>
                        <div>
                          <label className="form-label">Item / Service</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required 
                            value={item.productName} 
                            onChange={e => updateItem(index, 'product', e.target.value)} 
                            list="product-list-quote" 
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
                        {formData.showItemPrices !== false && (
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
                              required={formData.showItemPrices !== false} 
                              value={item.price} 
                              onChange={e => updateItem(index, 'price', e.target.value)} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {formData.showItemPrices === false && (
                  <div className="glass-card" style={{ padding: '0.85rem', marginTop: '0.5rem', background: 'rgba(217, 119, 6, 0.05)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ margin: 0, color: '#D97706', fontWeight: '800' }}>Lump Sum / Total Estimate Amount (&#8377;)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '200px', fontWeight: '800', textAlign: 'right', fontSize: '1.1rem' }}
                        value={formData.lumpsumAmount || ''}
                        onChange={(e) => setFormData({ ...formData, lumpsumAmount: e.target.value })}
                        placeholder="0.00"
                        required={formData.showItemPrices === false}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Design & Tax Settings */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                  <Settings size={16} style={{ color: 'var(--secondary)' }} /> Design & Tax Settings
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
                        checked={formData.showItemPrices !== false}
                        onChange={(e) => setFormData({ ...formData, showItemPrices: e.target.checked })}
                      />
                      Show Price per Item in Table
                    </label>
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
                {editingId ? 'Update Quotation' : 'Save & Issue Quotation'}
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

      {/* Master Table */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Quotation No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Estimated Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map(q => (
              <motion.tr key={q._id} whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                <td style={{ fontWeight: '800', color: 'var(--secondary)' }}>{q.quotationNumber}</td>
                <td>
                  <div style={{ fontWeight: '700' }}>{q.customer?.customerName || 'Unknown'}</div>
                  {(q.customer?.phone || q.customer?.address) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {q.customer?.phone && <span>Ph: {q.customer.phone}</span>}
                      {q.customer?.phone && q.customer?.address && <span> | </span>}
                      {q.customer?.address && <span>{q.customer.address}</span>}
                    </div>
                  )}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: '800' }}>&#8377; {q.totalAmount?.toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleQuotationStatus(q)}
                    className={`badge ${(q.status || 'ISSUED') === 'APPROVED' ? 'badge-success' : 'badge-info'}`}
                    style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.15s ease' }}
                    title="Click to toggle Approved / Issued"
                  >
                    <CheckCircle2 size={11} /> {q.status || 'ISSUED'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button className="btn-icon" onClick={() => { setPreviewData(q); setPreviewTheme(q.theme || 'classic'); }} title="View & Print"><Eye size={15} /></button>
                    <button className="btn-icon" onClick={() => handleEdit(q)} title="Edit Quotation"><Edit2 size={15} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(q._id)} title="Delete Quotation" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredQuotations.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No quotations created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <datalist id="product-list-quote">
        {products.map(p => <option key={p._id} value={p.productName}>{p.price ? `₹${p.price}` : ''}</option>)}
      </datalist>
    </div>
  );
};

export default Quotations;
