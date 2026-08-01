import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { 
  Edit2, Printer, Trash2, Plus, X, Eye, Truck, Users, DollarSign, 
  FileText, Search, CheckCircle2, ChevronRight, Calculator, HardHat, Navigation, Settings, Download
} from 'lucide-react';

// Indian Number to Words Converter
const toIndianRupeesWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  let n = Math.floor(num);
  if (n === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (val) => {
    let str = '';
    if (val >= 100) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += b[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += a[val] + ' ';
    }
    return str.trim();
  };

  let rupeesStr = '';
  if (n >= 10000000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    rupeesStr += convertLessThanThousand(n);
  }

  let paiseStr = '';
  let paise = Math.round((num - Math.floor(num)) * 100);
  if (paise > 0) {
    paiseStr = ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return `Rupees ${rupeesStr.trim().replace(/\s+/g, ' ')}${paiseStr} Only`;
};

const LabourBillsTab = ({ initialCategory = 'Labour' }) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const { selectedProgram } = useProgram();
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('classic');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Form State
  const initialFormState = {
    billType: 'Labour', // 'Labour' or 'Transport'
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    
    serviceProviderName: selectedProgram?.name || '',
    serviceProviderAddress: selectedProgram?.address || '',
    serviceProviderPhone: selectedProgram?.phone || '',
    serviceProviderGstin: selectedProgram?.gstNumber || '',

    customer: '',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientGstin: '',

    // Transport specific
    vehicleNumber: '',
    lrGrNumber: '',
    origin: '',
    destination: '',
    driverName: '',
    driverPhone: '',

    // Labour specific
    supervisorName: '',
    workLocation: '',

    items: [
      {
        description: 'General Labour Work',
        category: 'Labour',
        unit: 'Days',
        quantity: 1,
        rate: 500,
        amount: 500
      }
    ],

    loadingCharges: 0,
    unloadingCharges: 0,
    handlingCharges: 0,
    overtimeCharges: 0,
    additionalCharges: 0,

    taxPercentage: 0,
    discountAmount: 0,
    advancePaid: 0,

    paymentStatus: 'Unpaid',
    paymentMode: 'Bank Transfer',

    theme: 'classic',
    showGst: true,
    showTax: true,
    showPaymentTerms: true,
    showSignature: true,
    showFooterNote: true,
    showTerms: true,
    termsAndConditions: '1. Payment due within 15 days.\n2. Interest @ 18% p.a. for delayed payments.',
    footerText: 'Thank you for your business.',
    internalNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchBills();
    fetchCustomers();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      billType: activeCategory,
      items: activeCategory === 'Labour' 
        ? [{ description: 'Daily Wage Skilled Labour', category: 'Labour', unit: 'Days', quantity: 1, rate: 600, amount: 600 }]
        : [{ description: 'Material Transport Freight', category: 'Transport', unit: 'Trips', quantity: 1, rate: 2500, amount: 2500 }]
    }));
  }, [activeCategory]);

  const fetchBills = async () => {
    try {
      const { data } = await api.get('/labour-bills');
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerSelect = (customerId) => {
    if (!customerId) {
      setFormData(prev => ({
        ...prev,
        customer: '',
        clientName: '',
        clientAddress: '',
        clientPhone: '',
        clientGstin: ''
      }));
      return;
    }
    const cust = customers.find(c => c._id === customerId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customer: cust._id,
        clientName: cust.customerName || '',
        clientAddress: cust.address || '',
        clientPhone: cust.phone || '',
        clientGstin: cust.gstin || ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = Math.round(qty * rate * 100) / 100;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          description: activeCategory === 'Labour' ? 'Helpers / Labourers' : 'Additional Vehicle Freight', 
          category: activeCategory, 
          unit: activeCategory === 'Labour' ? 'Days' : 'Trips', 
          quantity: 1, 
          rate: 0, 
          amount: 0 
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = (doc = formData) => {
    if (!doc) return { subtotal: 0, extraCharges: 0, taxableAmount: 0, taxAmount: 0, totalAmount: 0, balanceDue: 0 };
    const itemsList = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = itemsList.reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);
    const extraCharges = (parseFloat(doc.loadingCharges) || 0) +
                         (parseFloat(doc.unloadingCharges) || 0) +
                         (parseFloat(doc.handlingCharges) || 0) +
                         (parseFloat(doc.overtimeCharges) || 0) +
                         (parseFloat(doc.additionalCharges) || 0);

    const taxableAmount = subtotal + extraCharges - (parseFloat(doc.discountAmount) || 0);
    const taxAmount = doc.showGst && doc.showTax !== false ? (taxableAmount * (parseFloat(doc.taxPercentage) || 0)) / 100 : 0;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;
    const balanceDue = Math.max(0, totalAmount - (parseFloat(doc.advancePaid) || 0));

    return { subtotal, extraCharges, taxableAmount, taxAmount, totalAmount, balanceDue };
  };

  const resetForm = () => {
    setFormData({ ...initialFormState, billType: activeCategory });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const currentStatus = formData.status || formData.paymentStatus || 'Unpaid';
    const customerId = typeof formData.customer === 'object' ? formData.customer?._id : formData.customer;

    const payload = {
      ...formData,
      customer: customerId || null,
      status: currentStatus,
      paymentStatus: currentStatus
    };

    try {
      if (editingId) {
        await api.put(`/labour-bills/${editingId}`, payload);
      } else {
        await api.post('/labour-bills', payload);
      }
      resetForm();
      fetchBills();
    } catch (err) {
      alert('Failed to save bill: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (bill) => {
    const billStatus = bill.status || bill.paymentStatus || 'Unpaid';
    const customerId = typeof bill.customer === 'object' ? bill.customer?._id : bill.customer;
    setFormData({
      ...initialFormState,
      ...bill,
      customer: customerId || '',
      status: billStatus,
      paymentStatus: billStatus
    });
    setActiveCategory(bill.billType || 'Labour');
    setEditingId(bill._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await api.delete(`/labour-bills/${id}`);
      fetchBills();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTogglePaymentStatus = async (bill) => {
    const currentVal = (bill.status || bill.paymentStatus || 'Unpaid').toUpperCase();
    const newStatus = currentVal === 'PAID' ? 'Unpaid' : 'Paid';
    const customerId = typeof bill.customer === 'object' ? bill.customer?._id : bill.customer;

    setBills(prev => prev.map(b => b._id === bill._id ? { ...b, status: newStatus, paymentStatus: newStatus } : b));

    try {
      await api.put(`/labour-bills/${bill._id}`, {
        ...bill,
        customer: customerId || null,
        status: newStatus,
        paymentStatus: newStatus
      });
      fetchBills();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
      fetchBills();
    }
  };

  const triggerPrint = async () => {
    const images = document.querySelectorAll('.labour-preview-overlay img');
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
    const element = document.querySelector('.labour-preview-overlay .invoice-container') || document.querySelector('.invoice-container');
    if (!element) return;
    const isTransport = (docData?.billType || activeCategory) === 'Transport';
    const fileName = `${isTransport ? 'Transport' : 'Labour'}-Bill-${docData?.billNumber || 'DRAFT'}.pdf`;
    
    const opt = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };



  const totals = calculateTotals(formData);
  
  const categoryFilteredBills = bills.filter(b => {
    const bType = b.billType || (b.vehicleNumber ? 'Transport' : 'Labour');
    return bType === activeCategory;
  });

  const filteredBills = categoryFilteredBills.filter(b => 
    (b.billNumber || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (b.clientName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (b.vehicleNumber || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (b.supervisorName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const renderPreviewDocument = (docData, activeTheme = null) => {
    if (!docData) return null;
    const isTransport = (docData.billType || activeCategory) === 'Transport';
    const docTotals = calculateTotals(docData);
    const itemsList = Array.isArray(docData.items) ? docData.items : [];
    const currentTheme = activeTheme || docData.theme || 'classic';

    // MODERN THEME STRUCTURAL LAYOUT
    if (currentTheme === 'modern') {
      return (
        <div className="invoice-container theme-modern" style={{ padding: '2rem', background: '#F8FAFC', color: '#0F172A', borderRadius: '14px' }}>
          {/* Modern Full-Width Gradient Header */}
          <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', padding: '1.5rem', borderRadius: '12px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {selectedProgram?.showLogo && selectedProgram?.logo && (
                <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '65px', objectFit: 'contain', marginBottom: '0.4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
              )}
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>
                {docData.serviceProviderName || selectedProgram?.name}
              </h2>
              <p style={{ fontSize: '0.775rem', opacity: 0.9, margin: '0.2rem 0 0 0', maxWidth: '320px' }}>
                {docData.serviceProviderAddress || selectedProgram?.address}
              </p>
              {docData.showTax !== false && docData.serviceProviderGstin && (
                <p style={{ fontSize: '0.725rem', fontWeight: '700', margin: '0.2rem 0 0 0', opacity: 0.95 }}>
                  GSTIN: {docData.serviceProviderGstin}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Modern Document Template
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {isTransport ? 'TRANSPORT BILL' : 'LABOUR BILL'}
              </h1>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0.3rem 0 0 0', opacity: 0.95 }}>
                #{docData.billNumber || 'DRAFT'}
              </p>
              <p style={{ fontSize: '0.75rem', margin: '0.15rem 0 0 0', opacity: 0.85 }}>
                Date: {new Date(docData.billDate || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Modern Floating Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Billed To (Client / Consignee)</span>
              <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', margin: '0.2rem 0 0 0' }}>
                {docData.clientName || 'Client Name'}
              </p>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>{docData.clientAddress}</p>
              {docData.showTax !== false && docData.clientGstin && (
                <p style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', margin: '0.15rem 0 0 0' }}>GSTIN: {docData.clientGstin}</p>
              )}
            </div>

            {isTransport ? (
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Logistics Route & Vehicle</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#475569' }}>
                  <div><b>Vehicle:</b> {docData.vehicleNumber || 'N/A'}</div>
                  <div><b>LR/GR:</b> {docData.lrGrNumber || 'N/A'}</div>
                  <div><b>Origin:</b> {docData.origin || 'N/A'}</div>
                  <div><b>Dest:</b> {docData.destination || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #10B981', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Site Supervisor Details</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#475569' }}>
                  <div><b>Supervisor:</b> {docData.supervisorName || 'N/A'}</div>
                  <div><b>Site:</b> {docData.workLocation || 'Worksite'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Modern Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem' }}>
            <thead>
              <tr style={{ background: '#1E293B', color: '#FFFFFF' }}>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem', borderRadius: '6px 0 0 6px' }}>#</th>
                <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.725rem' }}>Description</th>
                <th style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.725rem' }}>Qty/Unit</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem' }}>Rate</th>
                <th style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.725rem', borderRadius: '0 6px 6px 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem', fontSize: '0.775rem', color: '#64748B' }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '0.65rem', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>{item.description}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.rate) || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: '800', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modern Totals Callout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.25rem', paddingTop: '1rem' }}>
            <div style={{ maxWidth: '340px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Amount in Words</span>
              <p style={{ fontSize: '0.775rem', fontWeight: '700', color: '#0F172A', margin: '0.2rem 0 0 0' }}>{toIndianRupeesWords(docTotals.totalAmount)}</p>
              {docData.showTerms !== false && docData.termsAndConditions && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Terms</span>
                  <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '0.2rem 0 0 0', whiteSpace: 'pre-line' }}>{docData.termsAndConditions}</p>
                </div>
              )}
            </div>

            <div style={{ background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', minWidth: '240px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                <span>Subtotal</span><span>&#8377;{docTotals.subtotal.toLocaleString()}</span>
              </div>
              {docTotals.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
                  <span>GST ({docData.taxPercentage}%)</span><span>+ &#8377;{docTotals.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '900', color: '#3B82F6', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #3B82F6' }}>
                <span>Total Due</span><span>&#8377;{docTotals.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // BOLD / EXECUTIVE THEME STRUCTURAL LAYOUT
    if (currentTheme === 'executive') {
      return (
        <div className="invoice-container theme-executive" style={{ padding: '2rem', background: '#FFFFFF', color: '#0F172A', borderRadius: '14px', borderTop: '8px solid #0F172A' }}>
          {/* Executive Charcoal & Gold Header */}
          <div style={{ textAlign: 'center', borderBottom: '3px double #0F172A', paddingBottom: '1.25rem' }}>
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', margin: '0 auto 0.5rem auto', display: 'block' }} />
            )}
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Georgia, serif' }}>
              {docData.serviceProviderName || selectedProgram?.name}
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.2rem 0 0 0' }}>{docData.serviceProviderAddress || selectedProgram?.address}</p>
            {docData.showTax !== false && docData.serviceProviderGstin && (
              <span style={{ display: 'inline-block', background: '#0F172A', color: '#D97706', padding: '0.15rem 0.65rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', marginTop: '0.3rem' }}>
                GSTIN: {docData.serviceProviderGstin}
              </span>
            )}
          </div>

          {/* Executive Document Title Band */}
          <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '0.75rem 1.25rem', marginTop: '1.25rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#F59E0B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Georgia, serif' }}>
              OFFICIAL {isTransport ? 'TRANSPORT BILL' : 'LABOUR BILL'}
            </h1>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: '800', color: '#FFFFFF' }}>BILL NO: #{docData.billNumber || 'DRAFT'}</span> | <span style={{ color: '#CBD5E1' }}>DATE: {new Date(docData.billDate || Date.now()).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Executive Client & Logistics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ border: '1px solid #0F172A', padding: '0.85rem', borderRadius: '6px', background: '#FAFAFA' }}>
              <div style={{ background: '#0F172A', color: '#D97706', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', borderRadius: '3px' }}>
                CONSIGNEE / CLIENT DETAILS
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>{docData.clientName || 'Client Name'}</p>
              <p style={{ fontSize: '0.775rem', color: '#475569', margin: '0.2rem 0 0 0' }}>{docData.clientAddress}</p>
            </div>

            <div style={{ border: '1px solid #0F172A', padding: '0.85rem', borderRadius: '6px', background: '#FAFAFA' }}>
              <div style={{ background: '#0F172A', color: '#D97706', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', borderRadius: '3px' }}>
                {isTransport ? 'VEHICLE & ROUTE FREIGHT' : 'SUPERVISOR & WORKSITE'}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#0F172A', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                {isTransport ? (
                  <>
                    <div><b>Vehicle:</b> {docData.vehicleNumber || 'N/A'}</div>
                    <div><b>LR/GR:</b> {docData.lrGrNumber || 'N/A'}</div>
                    <div><b>Origin:</b> {docData.origin || 'N/A'}</div>
                    <div><b>Dest:</b> {docData.destination || 'N/A'}</div>
                  </>
                ) : (
                  <>
                    <div><b>Supervisor:</b> {docData.supervisorName || 'N/A'}</div>
                    <div><b>Site:</b> {docData.workLocation || 'Site'}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Executive Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem', border: '1px solid #0F172A' }}>
            <thead>
              <tr style={{ background: '#0F172A', color: '#F59E0B' }}>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>SR</th>
                <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800' }}>DESCRIPTION</th>
                <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.725rem', fontWeight: '800' }}>QTY</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>RATE</th>
                <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #CBD5E1' }}>
                  <td style={{ padding: '0.6rem', fontSize: '0.775rem', fontWeight: '700' }}>{idx + 1}</td>
                  <td style={{ padding: '0.6rem', fontSize: '0.825rem', fontWeight: '800', color: '#0F172A' }}>{item.description}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.rate) || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '900', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Executive Seal & Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid #0F172A' }}>
            <div style={{ maxWidth: '320px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase' }}>AMOUNT IN WORDS</span>
              <p style={{ fontSize: '0.775rem', fontWeight: '800', color: '#D97706', margin: '0.2rem 0 0 0' }}>{toIndianRupeesWords(docTotals.totalAmount)}</p>
            </div>

            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F172A', borderBottom: '2px solid #D97706', paddingBottom: '0.3rem' }}>
                TOTAL: &#8377;{docTotals.totalAmount.toLocaleString()}
              </div>

              {docData.showSignature !== false && (
                <div style={{ marginTop: '2rem', display: 'inline-block', textAlign: 'center', border: '2px dashed #D97706', padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#FFFBEB' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>EXECUTIVE AUTHORIZED SEAL</span>
                  <div style={{ fontSize: '0.725rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{docData.serviceProviderName || selectedProgram?.name}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // CLASSIC STANDARD THEME STRUCTURAL LAYOUT (DEFAULT)
    return (
      <div className="invoice-container theme-classic" style={{ padding: '2rem', background: '#FFFFFF', color: '#0F172A', borderRadius: '14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '1.25rem' }}>
          <div>
            {selectedProgram?.showLogo && selectedProgram?.logo && (
              <img src={selectedProgram.logo} alt="Logo" style={{ maxHeight: '75px', objectFit: 'contain', marginBottom: '0.5rem' }} />
            )}
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0F172A' }}>
              {docData.serviceProviderName || selectedProgram?.name}
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.2rem 0 0 0', maxWidth: '300px' }}>
              {docData.serviceProviderAddress || selectedProgram?.address}
            </p>
            {docData.showTax !== false && docData.serviceProviderGstin && (
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', margin: '0.2rem 0 0 0' }}>
                GSTIN: {docData.serviceProviderGstin}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: isTransport ? '#F59E0B' : 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              {isTransport ? 'TRANSPORT BILL' : 'LABOUR BILL'}
            </h1>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', margin: '0.4rem 0 0 0' }}>
              Bill No: #{docData.billNumber || 'DRAFT'}
            </p>
            <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
              Date: {new Date(docData.billDate || Date.now()).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Client & Specific Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Billed To (Client / Consignee)</span>
            <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', margin: '0.2rem 0 0 0' }}>
              {docData.clientName || 'Client Name'}
            </p>
            <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
              {docData.clientAddress}
            </p>
            {docData.showTax !== false && docData.clientGstin && (
              <p style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', margin: '0.15rem 0 0 0' }}>GSTIN: {docData.clientGstin}</p>
            )}
          </div>

          {isTransport ? (
            <div style={{ background: '#FFFBEB', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #FCD34D' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transport & Route Info</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#78350F' }}>
                <div><b>Vehicle No:</b> {docData.vehicleNumber || 'N/A'}</div>
                <div><b>LR/GR No:</b> {docData.lrGrNumber || 'N/A'}</div>
                <div><b>Origin:</b> {docData.origin || 'N/A'}</div>
                <div><b>Destination:</b> {docData.destination || 'N/A'}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#EFF6FF', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #93C5FD' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Labour & Site Supervisor Info</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#1E3A8A' }}>
                <div><b>Supervisor:</b> {docData.supervisorName || 'N/A'}</div>
                <div><b>Work Site:</b> {docData.workLocation || 'Site'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.25rem' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '0.55rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>#</th>
              <th style={{ padding: '0.55rem', textAlign: 'left', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>
                {isTransport ? 'Freight Description' : 'Labour & Work Description'}
              </th>
              <th style={{ padding: '0.55rem', textAlign: 'center', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>
                {isTransport ? 'Trips / Weight' : 'Workers / Days'}
              </th>
              <th style={{ padding: '0.55rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>Rate</th>
              <th style={{ padding: '0.55rem', textAlign: 'right', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.55rem', fontSize: '0.775rem', color: '#94A3B8' }}>{String(idx + 1).padStart(2, '0')}</td>
                <td style={{ padding: '0.55rem', fontSize: '0.825rem', fontWeight: '600', color: '#0F172A' }}>{item.description}</td>
                <td style={{ padding: '0.55rem', textAlign: 'center', fontSize: '0.825rem' }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: '0.55rem', textAlign: 'right', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.rate) || 0).toLocaleString()}</td>
                <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: '700', fontSize: '0.825rem' }}>&#8377;{(parseFloat(item.amount) || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '340px' }}>
            <span style={{ fontSize: '0.675rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Amount in Words</span>
            <p style={{ fontSize: '0.775rem', fontWeight: '700', color: '#0F172A', margin: '0.2rem 0 0 0' }}>
              {toIndianRupeesWords(docTotals.totalAmount)}
            </p>

            {docData.showTerms !== false && docData.termsAndConditions && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Terms & Conditions</span>
                <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '0.2rem 0 0 0', whiteSpace: 'pre-line' }}>
                  {docData.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Subtotal</span>
              <span style={{ fontWeight: '700' }}>&#8377;{docTotals.subtotal.toLocaleString()}</span>
            </div>
            {docTotals.extraCharges > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Extra Charges</span>
                <span style={{ fontWeight: '700' }}>+ &#8377;{docTotals.extraCharges.toLocaleString()}</span>
              </div>
            )}
            {docData.showTax !== false && docTotals.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>GST ({docData.taxPercentage}%)</span>
                <span style={{ fontWeight: '700' }}>+ &#8377;{docTotals.taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: isTransport ? '#F59E0B' : 'var(--primary)', paddingTop: '0.4rem', borderTop: '2px solid var(--primary)' }}>
              <span>Total Amount</span>
              <span>&#8377;{docTotals.totalAmount.toLocaleString()}</span>
            </div>

            {docData.showSignature !== false && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                <span style={{ fontSize: '0.675rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Authorized Signatory</span>
              </div>
            )}
          </div>
        </div>

        {docData.showFooterNote !== false && docData.footerText && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
            {docData.footerText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {activeCategory === 'Transport' ? (
              <>
                <Truck size={26} style={{ color: 'var(--warning)' }} />
                Transport Bills
              </>
            ) : (
              <>
                <HardHat size={26} style={{ color: 'var(--primary)' }} />
                Labour Bills
              </>
            )}
          </h1>
          <p className="page-subtitle">
            {activeCategory === 'Transport'
              ? 'Track vehicle transport, LR/GR numbers, route freight & trip bills'
              : 'Track manpower, wage rates, daily work logs & supervisor bills'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder={`Search ${activeCategory.toLowerCase()} bills...`} 
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
            style={{
              background: activeCategory === 'Transport' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : undefined
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel Editor' : `Create New ${activeCategory} Bill`}
          </button>
        </div>
      </div>

      {/* Split Screen Form & Live Preview */}
      {showForm && (
        <div className="grid-12">
          {/* Left Form Builder */}
          <div className="glass-panel col-span-6" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? `Edit ${activeCategory} Bill` : `New ${activeCategory} Bill Builder`}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Client & Payment Status Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Client / Party</label>
                  <select 
                    className="form-select"
                    value={formData.customer}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.customerName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Bill Number</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Auto-generated"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Status</label>
                  <select 
                    className="form-select"
                    value={formData.paymentStatus || 'Unpaid'}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    style={{
                      fontWeight: '700',
                      color: formData.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--warning)'
                    }}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Category Specific Form Controls */}
              {activeCategory === 'Transport' ? (
                <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <span className="form-label" style={{ color: 'var(--warning)', marginBottom: '0.5rem', display: 'block' }}>Transport & Logistics Info</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Vehicle Number (e.g. MH 12 AB 1234)" 
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="LR / GR Number" 
                      value={formData.lrGrNumber}
                      onChange={(e) => setFormData({ ...formData, lrGrNumber: e.target.value })}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Origin Location" 
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Destination Location" 
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(59, 130, 246, 0.04)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <span className="form-label" style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>Labour & Worksite Info</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Supervisor Name" 
                      value={formData.supervisorName}
                      onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Site / Work Location" 
                      value={formData.workLocation}
                      onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="form-label">{activeCategory === 'Labour' ? 'Labour Line Items' : 'Freight Line Items'}</span>
                  <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: activeCategory === 'Transport' ? 'var(--warning)' : 'var(--primary)', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 30px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Item Description" 
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Qty" 
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Rate" 
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      readOnly 
                      value={item.amount}
                      style={{ fontWeight: '700', color: activeCategory === 'Transport' ? 'var(--warning)' : 'var(--primary)' }}
                    />
                    <button type="button" onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Design & Tax Settings */}
              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                        checked={formData.showFooterNote !== false}
                        onChange={(e) => setFormData({ ...formData, showFooterNote: e.target.checked })}
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
                          checked={formData.showFooterNote !== false}
                          onChange={(e) => setFormData({ ...formData, showFooterNote: e.target.checked })}
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
                    value={formData.internalNotes || ''}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn-gradient" 
                  style={{ 
                    flex: 1,
                    background: activeCategory === 'Transport' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : undefined
                  }}
                >
                  <CheckCircle2 size={16} /> {editingId ? `Update ${activeCategory} Bill` : `Save & Generate ${activeCategory} Bill`}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary-glass">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Document Preview */}
          <div className="glass-panel col-span-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ margin: 0 }}>Live Document Preview</span>
              <span className={`badge ${activeCategory === 'Transport' ? 'badge-warning' : 'badge-primary'}`}>
                {activeCategory} Template
              </span>
            </div>

            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', border: '1px solid var(--glass-border)' }}>
              {renderPreviewDocument(formData)}
            </div>
          </div>
        </div>
      )}

      {/* Modal Print Preview Overlay */}
      {previewData && (
        <div 
          className="labour-preview-overlay"
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
          <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
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
                      background: previewTheme === t ? (activeCategory === 'Transport' ? 'var(--warning)' : 'var(--primary)') : 'transparent',
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
                <button 
                  className="btn-gradient" 
                  onClick={() => handleDownloadPdf(previewData)}
                  style={{
                    background: activeCategory === 'Transport' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : undefined
                  }}
                >
                  <Download size={18} /> Download {previewData.billType || activeCategory} PDF File
                </button>

                <button className="btn-secondary-glass" onClick={triggerPrint} title="Print via Browser">
                  <Printer size={18} /> Print
                </button>
              </div>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {renderPreviewDocument(previewData, previewTheme)}
            </div>
          </div>
        </div>
      )}

      {/* Master Data Table Listing */}
      <div className="table-container">
        <table className="table-glass">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Client / Consignee</th>
              <th>Date</th>
              <th>{activeCategory === 'Transport' ? 'Vehicle & Route' : 'Site / Supervisor'}</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill._id}>
                <td style={{ fontWeight: '800', color: activeCategory === 'Transport' ? 'var(--warning)' : 'var(--primary)' }}>
                  {bill.billNumber || `#${bill._id.slice(-4)}`}
                </td>
                <td>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{bill.clientName || 'General Client'}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{bill.clientPhone || 'No Phone'}</div>
                </td>
                <td>{new Date(bill.billDate || bill.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  {activeCategory === 'Transport' ? (
                    <>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{bill.vehicleNumber || 'No Vehicle'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {bill.origin && bill.destination ? `${bill.origin} ➔ ${bill.destination}` : 'Local Transport'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{bill.supervisorName || 'Supervisor N/A'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bill.workLocation || 'Site Work'}</div>
                    </>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                  &#8377;{(bill.totalAmount || 0).toLocaleString()}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleTogglePaymentStatus(bill)}
                    className={`badge ${bill.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}
                    style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.15s ease' }}
                    title="Click to toggle Paid / Unpaid"
                  >
                    <CheckCircle2 size={11} /> {bill.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button className="btn-icon" onClick={() => setPreviewData(bill)} title="Print Preview">
                      <Eye size={15} />
                    </button>
                    <button className="btn-icon" onClick={() => handleEdit(bill)} title="Edit Bill">
                      <Edit2 size={15} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(bill._id)} title="Delete Bill" style={{ color: 'var(--danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredBills.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No {activeCategory.toLowerCase()} bills recorded yet. Click <b>"Create New {activeCategory} Bill"</b> to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabourBillsTab;
