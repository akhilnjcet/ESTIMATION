import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Trash2, Plus, X, Eye, CalendarRange, Search, RefreshCcw, ArrowLeft } from 'lucide-react';

const RentalBills = () => {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const { selectedProgram } = useProgram();
  const [activeView, setActiveView] = useState('list'); // 'list', 'new', 'return'
  const [previewData, setPreviewData] = useState(null); 
  const [previewTheme, setPreviewTheme] = useState('classic');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for new rental
  const [formData, setFormData] = useState({});
  const [items, setItems] = useState([]);

  // State for return workflow
  const [returnCustomer, setReturnCustomer] = useState('');
  const [returnRentalId, setReturnRentalId] = useState('');
  const [returnFormData, setReturnFormData] = useState({});

  const fetchRentals = async () => {
    try {
      const { data } = await api.get('/rentals');
      setRentals(data);
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
        terms: selectedProgram.rentalDefaultTerms || prev.terms,
        showTerms: selectedProgram.showRentalTermsByDefault !== undefined ? selectedProgram.showRentalTermsByDefault : true,
        securityDeposit: selectedProgram.rentalDefaultSecurityDeposit || 0,
        lateCharge: selectedProgram.rentalDefaultLateFee || 0,
        footerText: selectedProgram.footerText || 'This is a computer generated rental bill.\nThank you for your business! | Powered by Krishna ERP'
      }));
    }
  }

  useEffect(() => {
    fetchRentals();
    fetchCustomers();
    fetchProducts();
  }, [selectedProgram]);

  const filteredRentals = rentals.filter(r => 
    r.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rental bill?')) return;
    try {
      await api.delete(`/rentals/${id}`);
      fetchRentals();
      alert('Rental bill deleted successfully!');
    } catch (err) { console.error(err); alert('Failed to delete rental bill'); }
  };

  const resetForm = () => {
    setFormData({ 
      customer: '', 
      notes: '', 
      terms: selectedProgram?.rentalDefaultTerms || '',
      showTerms: selectedProgram?.showRentalTermsByDefault !== undefined ? selectedProgram.showRentalTermsByDefault : true,
      showTax: true,
      showPaymentTerms: true,
      showSignature: true,
      showFooter: true,
      footerText: selectedProgram?.footerText || 'This is a computer generated rental bill.\nThank you for your business! | Powered by Krishna ERP',
      theme: 'classic',
      date: new Date().toISOString().split('T')[0],
      billNumber: '',
      rentalStartDate: new Date().toISOString().slice(0, 16),
      expectedReturnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      actualReturnDate: '',
      securityDeposit: selectedProgram?.rentalDefaultSecurityDeposit || 0,
      advancePaid: 0,
      damageCharge: 0,
      lateCharge: 0,
      otherCharges: 0,
      discount: 0,
      status: 'Active',
      conditionCheckout: 'Good',
      conditionReturn: '',
    });
    setItems([]);
    setEditingId(null);
    setActiveView('list');
    
    // Reset return form too
    setReturnCustomer('');
    setReturnRentalId('');
    setReturnFormData({});
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setFormData({
      ...r,
      customer: r.customer?._id || r.customer,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rentalStartDate: r.rentalStartDate ? new Date(r.rentalStartDate).toISOString().slice(0, 16) : '',
      expectedReturnDate: r.expectedReturnDate ? new Date(r.expectedReturnDate).toISOString().slice(0, 16) : '',
      actualReturnDate: r.actualReturnDate ? new Date(r.actualReturnDate).toISOString().slice(0, 16) : '',
    });
    setItems(r.items.map(item => ({
      ...item,
      product: item.product?._id || item.product
    })));
    setActiveView('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addItem = () => {
    setItems([...items, { 
      product: '', productName: '', description: '', price: 0, quantity: 1, 
      unit: 'Units', rateType: 'Day', rentalDuration: 1, taxPercentage: 0, total: 0,
      lateFeePerDay: selectedProgram?.rentalDefaultLateFee || 0,
      itemNos: '', condition: 'Good'
    }]);
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
    
    newItems[index].total = Number(newItems[index].price) * Number(newItems[index].quantity) * (Number(newItems[index].rentalDuration) || 1);
    setItems(newItems);
  };

  const removeItem = (index) => { setItems(items.filter((_, i) => i !== index)); };

  const getTotals = (currentFormData = formData, currentItems = items) => {
    let subTotal = currentItems.reduce((acc, item) => acc + item.total, 0);
    let taxAmount = currentFormData.showTax
      ? currentItems.reduce((acc, item) => acc + (item.total * Number(item.taxPercentage) / 100), 0)
      : 0;
    
    let totalAmount = subTotal + taxAmount + Number(currentFormData.damageCharge || 0) + Number(currentFormData.lossCharge || 0) + Number(currentFormData.lateCharge || 0) + Number(currentFormData.otherCharges || 0) - Number(currentFormData.discount || 0);
    let balanceAmount = totalAmount - Number(currentFormData.advancePaid || 0);

    return { subTotal, taxAmount, totalAmount, balanceAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert('Please add at least one item');
    
    const { subTotal, taxAmount, totalAmount, balanceAmount } = getTotals();
    const payload = { ...formData, items, subTotal, taxAmount, totalAmount, balanceAmount };
    
    try {
      if (editingId) {
        await api.put(`/rentals/${editingId}`, payload);
      } else {
        await api.post('/rentals', payload);
      }
      resetForm();
      fetchRentals();
    } catch (err) { alert('Failed to save: ' + (err.response?.data?.message || err.message)); }
  };

  // --- RETURN WORKFLOW ---
  
  const handleReturnCustomerChange = (customerId) => {
    setReturnCustomer(customerId);
    setReturnRentalId('');
    setReturnFormData({});
  };

  const handleReturnRentalSelect = (rentalId) => {
    setReturnRentalId(rentalId);
    const r = rentals.find(rent => rent._id === rentalId);
    if (r) {
      if (['Returned', 'Partially Returned', 'Returned Completely'].includes(r.status)) {
        // Load existing return data for editing
        let actualReturnDate = r.actualReturnDate;
        if (actualReturnDate) {
           const d = new Date(actualReturnDate);
           if (!isNaN(d.getTime())) {
               actualReturnDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
           }
        }
        setReturnFormData({ ...r, actualReturnDate });
      } else {
        const now = new Date();
        const expected = new Date(r.expectedReturnDate);
        
        let delayedDays = 0;
        if (now > expected) {
          const diffTime = Math.abs(now - expected);
          delayedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        }
        
        const initializedItems = (r.items || []).map(item => ({
          ...item,
          isReturned: true,
          returnCondition: 'GOOD',
          itemLateCharge: delayedDays * (Number(item.lateFeePerDay) || selectedProgram?.rentalDefaultLateFee || 0)
        }));

        const sumItemLateFees = initializedItems.reduce((sum, item) => sum + (item.isReturned ? Number(item.itemLateCharge) || 0 : 0), 0);

        setReturnFormData({
          ...r,
          items: initializedItems,
          actualReturnDate: new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
          conditionReturn: 'Good',
          damageCharge: r.damageCharge || 0,
          lossCharge: r.lossCharge || 0,
          lateCharge: r.lateCharge || sumItemLateFees,
          delayedDays: delayedDays,
          status: 'Returned Completely'
        });
      }
    } else {
      setReturnFormData({});
    }
  };

  const handleReturnDateChange = (dateString) => {
    const actual = new Date(dateString);
    const expected = new Date(returnFormData.expectedReturnDate);
    
    let delayedDays = 0;
    if (actual > expected) {
      const diffTime = Math.abs(actual - expected);
      delayedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }
    
    const initializedItems = (returnFormData.items || []).map(item => ({
      ...item,
      itemLateCharge: delayedDays * (Number(item.lateFeePerDay) || selectedProgram?.rentalDefaultLateFee || 0)
    }));

    const sumItemLateFees = initializedItems.reduce((sum, item) => sum + (item.isReturned ? Number(item.itemLateCharge) || 0 : 0), 0);

    setReturnFormData(prev => ({
      ...prev,
      items: initializedItems,
      actualReturnDate: dateString,
      delayedDays,
      lateCharge: sumItemLateFees
    }));
  };

  const handleReturnItemChange = (index, field, value) => {
    const updatedItems = [...returnFormData.items];
    if (field === 'isReturned') {
        updatedItems[index].isReturned = value;
    } else {
        updatedItems[index][field] = value;
    }
    
    const allReturned = updatedItems.every(i => i.isReturned);
    const newStatus = allReturned ? 'Returned Completely' : 'Partially Returned';
    const sumItemLateFees = updatedItems.reduce((sum, item) => sum + (item.isReturned ? Number(item.itemLateCharge) || 0 : 0), 0);
    
    setReturnFormData(prev => ({
      ...prev,
      items: updatedItems,
      status: newStatus,
      lateCharge: sumItemLateFees
    }));
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnRentalId) return alert('Please select a rental bill');
    
    try {
      const { subTotal, taxAmount, totalAmount, balanceAmount } = getTotals(returnFormData, returnFormData.items);
      const payload = { 
        ...returnFormData, 
        subTotal, 
        taxAmount, 
        totalAmount, 
        balanceAmount, 
        customer: returnFormData.customer?._id || returnFormData.customer 
      };
      await api.put(`/rentals/${returnRentalId}`, payload);
      resetForm();
      fetchRentals();
      alert('Equipment marked as returned. The Return Bill has been generated.');
    } catch(err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };


  const triggerPrint = async () => {
    setTimeout(() => { window.print(); }, 500);
  };

  const renderPreviewDocument = (docData, activeTheme = null) => {
    const theme = activeTheme || docData.theme || 'classic';
    const itemsList = Array.isArray(docData.items) ? docData.items : [];
    const isReturned = !docData._isOriginalView && ['Returned', 'Partially Returned', 'Returned Completely'].includes(docData.status);

    return (
      <div className={`invoice-container theme-${theme}`} style={{ '--theme-color': selectedProgram?.themeColor || '#3b82f6', padding: '2rem', background: '#FFF', color: '#1e293b' }}>
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
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {isReturned ? 'RETURN BILL' : 'RENTAL BILL'}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                <b>No:</b> #{docData.billNumber || 'DRAFT'} | <b>Date:</b> {new Date(docData.date || Date.now()).toLocaleDateString('en-GB')}
              </p>
              <div style={{ display: 'inline-block', marginTop: '5px', padding: '3px 8px', borderRadius: '4px', background: docData.status === 'Active' ? '#FEF08A' : docData.status === 'Returned' ? '#BBF7D0' : '#E2E8F0', fontSize: '11px', fontWeight: 'bold' }}>
                Status: {docData.status}
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-info" style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Billed To:</h3>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{docData.customer?.customerName || 'Select Customer'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '250px' }}>{docData.customer?.address || ''}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>Ph: {docData.customer?.phone}</p>
          </div>
          
          <div style={{ textAlign: 'right', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>Rental Period:</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#0f172a' }}><b>Start:</b> {docData.rentalStartDate ? new Date(docData.rentalStartDate).toLocaleString('en-GB') : '-'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#0f172a' }}><b>Expected:</b> {docData.expectedReturnDate ? new Date(docData.expectedReturnDate).toLocaleString('en-GB') : '-'}</p>
            {isReturned && (
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#22c55e', fontWeight: 'bold' }}><b>Returned:</b> {docData.actualReturnDate ? new Date(docData.actualReturnDate).toLocaleString('en-GB') : '-'}</p>
            )}
          </div>
        </div>

        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.75rem' }}>Item</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem' }}>Qty</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Rate</th>
              <th style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem' }}>Duration</th>
              <th style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.75rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.productName || 'Item'}</div>
                  {item.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.description}</div>}
                  {(item.itemNos || item.condition) && (
                    <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '2px' }}>
                      {item.itemNos && `SN/No: ${item.itemNos}`}
                      {item.itemNos && item.condition && ' | '}
                      {item.condition && `Cond: ${item.condition}`}
                    </div>
                  )}
                  {isReturned && (
                    <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold', color: item.isReturned === false ? '#EF4444' : '#22C55E' }}>
                      {item.isReturned === false ? 'NOT RETURNED' : `Returned (${item.returnCondition || 'Ok'})`}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.85rem' }}>{item.quantity} {item.unit === 'Kg' ? 'Kg' : 'Pcs'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.85rem' }}>&#8377;{(item.price || 0).toLocaleString()} / {item.rateType}</td>
                <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.85rem' }}>{item.rentalDuration} {item.rateType}(s)</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem' }}>&#8377;{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <div style={{ width: '50%' }}>
            {docData.securityDeposit > 0 && (
              <div style={{ background: '#FFFBEB', padding: '10px', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#D97706' }}>Security Deposit Received:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', float: 'right' }}>&#8377;{(Number(docData.securityDeposit) || 0).toLocaleString()}</span>
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              <p style={{ margin: '0 0 4px 0' }}><b>Condition at Checkout:</b> {docData.conditionCheckout || 'Good'}</p>
              {isReturned && <p style={{ margin: 0 }}><b>Condition on Return:</b> {docData.conditionReturn || '-'}</p>}
            </div>
            {isReturned && docData.delayedDays > 0 && (
              <div style={{ marginTop: '10px', color: '#EF4444', fontSize: '12px', fontWeight: 'bold' }}>
                ⚠️ Equipment was delayed by {docData.delayedDays} day(s).
              </div>
            )}
          </div>

          <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>Rental Sub Total</span>
              <span style={{ fontWeight: '600' }}>&#8377;{(Number(docData.subTotal) || 0).toLocaleString()}</span>
            </div>
            {docData.showTax !== false && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Tax</span>
                <span style={{ fontWeight: '600' }}>&#8377;{(Number(docData.taxAmount) || 0).toLocaleString()}</span>
              </div>
            )}
            {isReturned && Number(docData.damageCharge) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#EF4444' }}>
                <span>Damage Charge</span>
                <span>+ &#8377;{Number(docData.damageCharge).toLocaleString()}</span>
              </div>
            )}
            {isReturned && Number(docData.lossCharge) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#DC2626' }}>
                <span>Loss Charge</span>
                <span>+ &#8377;{Number(docData.lossCharge).toLocaleString()}</span>
              </div>
            )}
            {isReturned && Number(docData.lateCharge) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#F59E0B' }}>
                <span>Late Charge</span>
                <span>+ &#8377;{Number(docData.lateCharge).toLocaleString()}</span>
              </div>
            )}
            {Number(docData.otherCharges) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Other Charges</span>
                <span style={{ fontWeight: '600' }}>+ &#8377;{Number(docData.otherCharges).toLocaleString()}</span>
              </div>
            )}
            {Number(docData.advancePaid) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#10B981' }}>
                <span>Advance Paid</span>
                <span>- &#8377;{Number(docData.advancePaid).toLocaleString()}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', borderTop: '2px solid #3b82f6', paddingTop: '0.5rem' }}>
              <span>Balance Payable</span>
              <span>&#8377;{((Number(docData.subTotal) || 0) + (docData.showTax !== false ? (Number(docData.taxAmount) || 0) : 0) + (isReturned ? (Number(docData.damageCharge) || 0) + (Number(docData.lossCharge) || 0) + (Number(docData.lateCharge) || 0) : 0) + (Number(docData.otherCharges) || 0) - (Number(docData.advancePaid) || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Conditional Terms and Conditions */}
        {(!isReturned || docData.showTermsOnReturn) && docData.showTerms !== false && docData.terms && (
          <div style={{ marginTop: '2rem', fontSize: '10px', color: '#334155', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>ഉപകരണ വാടക നിബന്ധനകളും വ്യവസ്ഥകളും:</h4>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{docData.terms}</div>
          </div>
        )}
        
        {isReturned && !docData.showTermsOnReturn && (
          <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
            THANK YOU, VISIT AGAIN!
          </div>
        )}

        {docData.showSignature !== false && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', fontSize: '11px', fontWeight: 'bold' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>Customer Signature</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>Equipment {isReturned ? 'Returned' : 'Received'} By</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>Authorized Signatory</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (previewData) {
    return (
      <div className="modal-print-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, background: 'rgba(11, 18, 32, 0.88)', padding: '2rem 1rem', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <button className="btn-secondary-glass" onClick={() => setPreviewData(null)}><X size={18} /> Close</button>
            <button className="btn-secondary-glass" onClick={triggerPrint}><Printer size={18} /> Print</button>
          </div>
          <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {renderPreviewDocument(previewData, previewTheme)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title"><CalendarRange size={26} style={{ color: 'var(--primary)' }} /> Rental Billing</h1>
          <p className="page-subtitle">Manage equipment rentals, deposits, and returns</p>
        </div>
        
        {activeView === 'list' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <input 
                type="text" className="form-input" placeholder="Search rental bill..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button className="btn-gradient" onClick={() => { resetForm(); setActiveView('new'); }} style={{ padding: '0.6rem 1rem' }}>
              <Plus size={16} style={{ marginRight: '6px' }} /> New Rental
            </button>
            <button className="btn-secondary-glass" onClick={() => { resetForm(); setActiveView('return'); }} style={{ padding: '0.6rem 1rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              <RefreshCcw size={16} style={{ marginRight: '6px' }} /> Return Equipment
            </button>
          </div>
        ) : (
          <button className="btn-secondary-glass" onClick={resetForm}>
            <ArrowLeft size={18} /> Back to List
          </button>
        )}
      </div>

      {activeView === 'new' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>{editingId ? 'Edit Rental Bill' : 'New Rental Bill'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select className="form-select" required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                  <option value="">Select party...</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rental Start Date/Time</label>
                <input type="datetime-local" className="form-input" required value={formData.rentalStartDate} onChange={e => setFormData({...formData, rentalStartDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Return</label>
                <input type="datetime-local" className="form-input" required value={formData.expectedReturnDate} onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="form-label">Equipment Items</span>
                <button type="button" className="btn-secondary-glass" onClick={addItem}>+ Add Equipment</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {items.map((item, index) => (
                  <div key={index} className="glass-card" style={{ padding: '0.85rem', position: 'relative' }}>
                    <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} /></button>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '0.65rem' }}>
                      <div>
                        <label className="form-label">Equipment</label>
                        <input type="text" className="form-input" required value={item.productName} onChange={e => updateItem(index, 'product', e.target.value)} list="product-list" />
                      </div>
                      <div>
                        <label className="form-label">Qty</label>
                        <input type="number" className="form-input" required value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Rate (&#8377;)</label>
                        <input type="number" className="form-input" required value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Per</label>
                        <select className="form-select" value={item.rateType} onChange={e => updateItem(index, 'rateType', e.target.value)}>
                          <option value="Hour">Hour</option><option value="Day">Day</option><option value="Week">Week</option><option value="Month">Month</option><option value="Fixed">Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Duration</label>
                        <input type="number" className="form-input" required value={item.rentalDuration} onChange={e => updateItem(index, 'rentalDuration', e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Total</label>
                        <div style={{ padding: '0.6rem', background: 'var(--bg-body)', borderRadius: '6px', fontWeight: 'bold' }}>&#8377;{item.total}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginTop: '0.65rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Item No(s)</label>
                        <input type="text" className="form-input" value={item.itemNos || ''} onChange={e => updateItem(index, 'itemNos', e.target.value)} placeholder="e.g. SN-1234" style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Condition</label>
                        <select className="form-select" value={item.condition || ''} onChange={e => updateItem(index, 'condition', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                          <option value="">-- Select --</option>
                          <option value="GOOD">GOOD</option>
                          <option value="BAD">BAD</option>
                          <option value="NOT BAD">NOT BAD</option>
                          <option value="DAMAGED">DAMAGED</option>
                          <option value="LOSS">LOSS</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Late Fee / Day (&#8377;)</label>
                        <input type="number" className="form-input" value={item.lateFeePerDay} onChange={e => updateItem(index, 'lateFeePerDay', e.target.value)} style={{ fontSize: '0.8rem', padding: '0.4rem' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Checkout Condition</label><input type="text" className="form-input" value={formData.conditionCheckout} onChange={e => setFormData({...formData, conditionCheckout: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Advance Paid (&#8377;)</label><input type="number" className="form-input" value={formData.advancePaid} onChange={e => setFormData({...formData, advancePaid: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Security Deposit (&#8377;)</label><input type="number" className="form-input" value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-body)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub Total:</span> <b>&#8377;{getTotals().subTotal}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold' }}><span>Balance Payable:</span> <b>&#8377;{getTotals().balanceAmount}</b></div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn-gradient" style={{ width: '100%' }}>Save Rental Bill</button>
            </div>
          </form>
        </div>
      )}

      {activeView === 'return' && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Form Side */}
          <div className="glass-panel" style={{ padding: '1.75rem', flex: '1' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCcw size={20} /> Create Return Bill
            </h2>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">1. Select Customer</label>
              <select className="form-select" value={returnCustomer} onChange={e => handleReturnCustomerChange(e.target.value)}>
                <option value="">-- Choose Customer --</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
              </select>
            </div>

            {returnCustomer && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">2. Select Rental Bill</label>
                <select className="form-select" value={returnRentalId} onChange={e => handleReturnRentalSelect(e.target.value)}>
                  <option value="">-- Choose Rental Bill --</option>
                  {rentals.filter(r => r.customer?._id === returnCustomer && ['Active', 'Returned', 'Partially Returned', 'Returned Completely'].includes(r.status)).map(r => (
                    <option key={r._id} value={r._id}>
                      Bill #{r.billNumber} ({r.status === 'Active' ? 'Active' : 'Returned'})
                    </option>
                  ))}
                </select>
                {rentals.filter(r => r.customer?._id === returnCustomer && ['Active', 'Returned', 'Partially Returned', 'Returned Completely'].includes(r.status)).length === 0 && (
                  <small style={{ color: 'var(--danger)', display: 'block', marginTop: '4px' }}>No active or returned rentals found for this customer.</small>
                )}
              </div>
            )}

            {returnRentalId && returnFormData && (
              <form onSubmit={handleReturnSubmit} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-muted)' }}>Expected Return Date</label>
                    <input type="text" className="form-input" disabled value={new Date(returnFormData.expectedReturnDate).toLocaleString()} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Actual Return Date/Time</label>
                    <input type="datetime-local" className="form-input" required value={returnFormData.actualReturnDate} onChange={e => handleReturnDateChange(e.target.value)} />
                  </div>
                </div>

                {returnFormData.delayedDays > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: '#EF4444', fontSize: '0.9rem' }}>
                    <b>Delay Detected:</b> Equipment returned {returnFormData.delayedDays} day(s) late. Late fee auto-calculated.
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Item Return Checklist</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(returnFormData.items || []).map((item, index) => (
                      <div key={index} className="glass-card" style={{ padding: '0.85rem', display: 'grid', gridTemplateColumns: 'auto 2fr 2fr 1fr', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <input type="checkbox" checked={item.isReturned !== false} onChange={e => handleReturnItemChange(index, 'isReturned', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                        <div>
                          <b style={{ fontSize: '0.85rem' }}>{item.productName}</b>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} {item.itemNos ? `| SN: ${item.itemNos}` : ''}</div>
                        </div>
                           <label className="form-label" style={{ fontSize: '0.65rem', margin: 0 }}>Return Condition</label>
                           <select className="form-select" value={item.returnCondition || ''} onChange={e => handleReturnItemChange(index, 'returnCondition', e.target.value)} disabled={item.isReturned === false} style={{ padding: '0.35rem', fontSize: '0.8rem' }}>
                              <option value="">-- Select --</option>
                              <option value="GOOD">GOOD</option>
                              <option value="BAD">BAD</option>
                              <option value="NOT BAD">NOT BAD</option>
                              <option value="DAMAGED">DAMAGED</option>
                              <option value="LOSS">LOSS</option>
                           </select>
                        </div>
                        <div>
                           <label className="form-label" style={{ fontSize: '0.65rem', margin: 0, color: '#F59E0B' }}>Late Chg (&#8377;)</label>
                           <input type="number" className="form-input" value={item.itemLateCharge || 0} onChange={e => handleReturnItemChange(index, 'itemLateCharge', e.target.value)} disabled={item.isReturned === false} style={{ padding: '0.35rem', fontSize: '0.8rem' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">General Condition Note</label>
                    <input type="text" className="form-input" value={returnFormData.conditionReturn || ''} onChange={e => setReturnFormData({...returnFormData, conditionReturn: e.target.value})} placeholder="e.g. Good, Minor Scratches" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status (Auto-calculated)</label>
                    <select className="form-select" disabled value={returnFormData.status || 'Returned Completely'} onChange={e => setReturnFormData({...returnFormData, status: e.target.value})}>
                      <option value="Returned Completely">Returned Completely</option>
                      <option value="Partially Returned">Partially Returned</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: '#F59E0B' }}>Late Chg (&#8377;)</label>
                    <input type="number" className="form-input" value={returnFormData.lateCharge || 0} onChange={e => setReturnFormData({...returnFormData, lateCharge: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: '#EF4444' }}>Damage (&#8377;)</label>
                    <input type="number" className="form-input" value={returnFormData.damageCharge || 0} onChange={e => setReturnFormData({...returnFormData, damageCharge: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: '#DC2626' }}>Loss (&#8377;)</label>
                    <input type="number" className="form-input" value={returnFormData.lossCharge || 0} onChange={e => setReturnFormData({...returnFormData, lossCharge: e.target.value})} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <input type="checkbox" id="showTerms" checked={returnFormData.showTermsOnReturn || false} onChange={e => setReturnFormData({...returnFormData, showTermsOnReturn: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                   <label htmlFor="showTerms" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Print Terms & Conditions on Return Bill</label>
                </div>

                <button type="submit" className="btn-gradient" style={{ width: '100%', padding: '0.85rem' }}>Save & Generate Return Bill</button>
              </form>
            )}
          </div>

          {/* Live PDF Preview Side */}
          {returnRentalId && returnFormData && (
            <div style={{ flex: '1', borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', background: '#FFF' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '0.85rem', color: '#475569' }}>Live Return Bill Preview</b>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Terms automatically omitted</span>
              </div>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%', marginBottom: '-15%' }}>
                 {renderPreviewDocument({ ...returnFormData, subTotal: getTotals(returnFormData, returnFormData.items).subTotal, taxAmount: getTotals(returnFormData, returnFormData.items).taxAmount, balanceAmount: getTotals(returnFormData, returnFormData.items).balanceAmount }, previewTheme)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredRentals.map((r) => (
            <div key={r._id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bill #</span><div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{r.billNumber}</div></div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {r.status !== 'Active' ? (
                    <>
                      <button className="btn-icon" title="View Original Rental Bill" onClick={() => setPreviewData({ ...r, _isOriginalView: true })}><Eye size={14} /></button>
                      <button className="btn-icon" title="View Return Bill" onClick={() => setPreviewData(r)}><RefreshCcw size={14} /></button>
                    </>
                  ) : (
                    <button className="btn-icon" title="View Rental Bill" onClick={() => setPreviewData(r)}><Eye size={14} /></button>
                  )}
                  <button className="btn-icon" onClick={() => handleEdit(r)}><Edit2 size={14} /></button>
                  <button className="btn-icon" onClick={() => handleDelete(r._id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ marginBottom: '0.5rem' }}><b style={{ color: 'var(--text-primary)' }}>{r.customer?.customerName}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Expected: {new Date(r.expectedReturnDate).toLocaleDateString()}</span>
                <span>Amt: &#8377;{r.balanceAmount?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: r.status === 'Active' ? 'rgba(234,179,8,0.2)' : r.status === 'Returned' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', color: r.status === 'Active' ? '#EAB308' : r.status === 'Returned' ? '#22C55E' : 'var(--text-muted)' }}>{r.status}</span>
                {r.status === 'Active' && (
                  <button className="btn-secondary-glass" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { 
                    resetForm();
                    setActiveView('return');
                    handleReturnCustomerChange(r.customer?._id || r.customer);
                    handleReturnRentalSelect(r._id);
                  }}>
                    <RefreshCcw size={12} style={{ marginRight: '4px' }} /> Quick Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentalBills;
