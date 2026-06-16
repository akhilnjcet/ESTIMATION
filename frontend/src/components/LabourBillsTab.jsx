import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useProgram } from '../context/ProgramContext';
import { Edit2, Printer, Trash2, Plus, X, Eye, Truck, User, DollarSign, FileText } from 'lucide-react';

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
  // Crores
  if (n >= 10000000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  // Lakhs
  if (n >= 100000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  // Thousands
  if (n >= 1000) {
    rupeesStr += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  // Hundreds/Tens/Units
  if (n > 0) {
    rupeesStr += convertLessThanThousand(n);
  }

  // Handle paise
  let paiseStr = '';
  let paise = Math.round((num - Math.floor(num)) * 100);
  if (paise > 0) {
    paiseStr = ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return `Rupees ${rupeesStr.trim().replace(/\s+/g, ' ')}${paiseStr} Only`;
};

const LabourBillsTab = () => {
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
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    
    // Service Provider Details (Pre-filled from program context)
    serviceProviderName: selectedProgram?.name || '',
    serviceProviderAddress: selectedProgram?.address || '',
    serviceProviderPhone: selectedProgram?.phone || '',
    serviceProviderGstin: selectedProgram?.gstNumber || '',

    // Customer Selection & Client details
    customer: '',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientGstin: '',

    // Logistics & Dispatch Details
    vehicleNumber: '',
    lrGrNumber: '',
    origin: '',
    destination: '',
    goodsDescription: '',
    loadingDate: '',
    unloadingDate: '',
    numberOfLabourers: '',

    // Dynamic Labour Work Items Table
    workItems: [{ workDescription: '', labourCount: 1, workingDays: 1, rate: 0, total: 0 }],

    // Extra Charges (Optional)
    loadingCharges: 0,
    unloadingCharges: 0,
    handlingCharges: 0,
    packingCharges: 0,
    overtimeCharges: 0,
    additionalCharges: 0,

    // Tax settings
    taxPercentage: 0,
    taxDetails: 'GST',

    paymentTerms: selectedProgram?.defaultTerms || '',
    remarks: '',
    theme: 'classic',
    status: 'Unpaid',

    // Print config toggles
    showTerms: true,
    showTax: true,
    showSignature: true,
    showPaymentTerms: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const [prevProgramId, setPrevProgramId] = useState(selectedProgram?._id);
  if (selectedProgram?._id !== prevProgramId) {
    setPrevProgramId(selectedProgram?._id);
    if (!editingId) {
      setFormData(prev => ({
        ...prev,
        serviceProviderName: selectedProgram?.name || '',
        serviceProviderAddress: selectedProgram?.address || '',
        serviceProviderPhone: selectedProgram?.phone || '',
        serviceProviderGstin: selectedProgram?.gstNumber || '',
        paymentTerms: selectedProgram?.defaultTerms || ''
      }));
    }
  }

  const fetchBills = async () => {
    try {
      const { data } = await api.get('/labour-bills');
      setBills(data);
    } catch (err) {
      console.error('Failed to fetch labour bills:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  // Load Bills and Customers
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBills();
    fetchCustomers();
  }, [selectedProgram]);

  // Handle customer select change
  const handleCustomerChange = (customerId) => {
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

    const selectedCust = customers.find(c => c._id === customerId);
    if (selectedCust) {
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        clientName: selectedCust.customerName || '',
        clientAddress: selectedCust.address || '',
        clientPhone: selectedCust.phone || '',
        clientGstin: selectedCust.gstNumber || ''
      }));
    }
  };

  // Dynamic Work Items list helpers
  const addWorkItem = () => {
    setFormData(prev => ({
      ...prev,
      workItems: [...(prev.workItems || []), { workDescription: '', labourCount: 1, workingDays: 1, rate: 0, total: 0 }]
    }));
  };

  const updateWorkItem = (index, field, value) => {
    const updatedItems = [...(formData.workItems || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate row total
    if (field === 'labourCount' || field === 'workingDays' || field === 'rate') {
      const count = Number(updatedItems[index].labourCount || 0);
      const days = Number(updatedItems[index].workingDays !== undefined ? updatedItems[index].workingDays : 1);
      const rate = Number(updatedItems[index].rate || 0);
      updatedItems[index].total = count * days * rate;
    }
    
    setFormData(prev => ({
      ...prev,
      workItems: updatedItems
    }));
  };

  const removeWorkItem = (index) => {
    setFormData(prev => ({
      ...prev,
      workItems: (prev.workItems || []).filter((_, i) => i !== index)
    }));
  };

  // Auto-calculated fields
  const calculateTotals = (data) => {
    const workTotal = (data.workItems || []).reduce((sum, item) => sum + Number(item.total || 0), 0);
    const subTotal = 
      workTotal +
      Number(data.loadingCharges || 0) +
      Number(data.unloadingCharges || 0) +
      Number(data.handlingCharges || 0) +
      Number(data.packingCharges || 0) +
      Number(data.overtimeCharges || 0) +
      Number(data.additionalCharges || 0);

    const taxAmount = subTotal * (Number(data.taxPercentage || 0) / 100);
    const totalAmount = subTotal + taxAmount;
    const amountInWords = toIndianRupeesWords(totalAmount);

    return { subTotal, taxAmount, totalAmount, amountInWords };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workItems || formData.workItems.length === 0) {
      alert('Please add at least one labour work item');
      return;
    }

    const calculated = calculateTotals(formData);
    const payload = {
      ...formData,
      ...calculated
    };

    try {
      if (editingId) {
        await api.put(`/labour-bills/${editingId}`, payload);
        alert('Labour Bill updated successfully!');
      } else {
        await api.post('/labour-bills', payload);
        alert('Labour Bill generated successfully!');
      }
      resetForm();
      fetchBills();
    } catch (err) {
      alert('Failed to save Labour Bill: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (bill) => {
    setEditingId(bill._id);
    setFormData({
      billNumber: bill.billNumber || '',
      billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      serviceProviderName: bill.serviceProviderName || '',
      serviceProviderAddress: bill.serviceProviderAddress || '',
      serviceProviderPhone: bill.serviceProviderPhone || '',
      serviceProviderGstin: bill.serviceProviderGstin || '',
      customer: bill.customer?._id || bill.customer || '',
      clientName: bill.clientName || '',
      clientAddress: bill.clientAddress || '',
      clientPhone: bill.clientPhone || '',
      clientGstin: bill.clientGstin || '',
      vehicleNumber: bill.vehicleNumber || '',
      lrGrNumber: bill.lrGrNumber || '',
      origin: bill.origin || '',
      destination: bill.destination || '',
      goodsDescription: bill.goodsDescription || '',
      loadingDate: bill.loadingDate ? new Date(bill.loadingDate).toISOString().split('T')[0] : '',
      unloadingDate: bill.unloadingDate ? new Date(bill.unloadingDate).toISOString().split('T')[0] : '',
      numberOfLabourers: bill.numberOfLabourers || '',
      workItems: bill.workItems && bill.workItems.length > 0 
        ? bill.workItems.map(item => ({
            workDescription: item.workDescription || '',
            labourCount: item.labourCount !== undefined ? item.labourCount : 1,
            workingDays: item.workingDays !== undefined ? item.workingDays : 1,
            rate: item.rate !== undefined ? item.rate : 0,
            total: item.total !== undefined ? item.total : 0
          }))
        : [{ workDescription: '', labourCount: 1, workingDays: 1, rate: 0, total: 0 }],
      loadingCharges: bill.loadingCharges || 0,
      unloadingCharges: bill.unloadingCharges || 0,
      handlingCharges: bill.handlingCharges || 0,
      packingCharges: bill.packingCharges || 0,
      overtimeCharges: bill.overtimeCharges || 0,
      additionalCharges: bill.additionalCharges || 0,
      taxPercentage: bill.taxPercentage || 0,
      taxDetails: bill.taxDetails || 'GST',
      paymentTerms: bill.paymentTerms || '',
      remarks: bill.remarks || '',
      theme: bill.theme || 'classic',
      status: bill.status || 'Unpaid',
      showTerms: bill.showTerms !== undefined ? bill.showTerms : true,
      showTax: bill.showTax !== undefined ? bill.showTax : true,
      showSignature: bill.showSignature !== undefined ? bill.showSignature : true,
      showPaymentTerms: bill.showPaymentTerms !== undefined ? bill.showPaymentTerms : true
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Labour Bill?')) return;
    try {
      await api.delete(`/labour-bills/${id}`);
      fetchBills();
      alert('Labour Bill deleted successfully!');
    } catch (err) {
      console.error('Failed to delete Labour Bill:', err);
      alert('Failed to delete Labour Bill: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const filteredBills = bills.filter(bill => 
    bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.lrGrNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Print Logic with Custom Templates
  const handlePrint = (billData) => {
    const theme = billData.theme || 'classic';
    const computed = calculateTotals(billData);
    const themeColor = selectedProgram?.themeColor || '#4f46e5';
    const printWindow = window.open('', '_blank');

    const otherChargesList = [
      { label: 'Loading Charges', val: billData.loadingCharges },
      { label: 'Unloading Charges', val: billData.unloadingCharges },
      { label: 'Handling Charges', val: billData.handlingCharges },
      { label: 'Packing Charges', val: billData.packingCharges },
      { label: 'Overtime Charges', val: billData.overtimeCharges },
      { label: 'Additional Charges', val: billData.additionalCharges }
    ].filter(item => Number(item.val) > 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Labour Bill - ${billData.billNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .doc-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #cbd5e1; font-size: 14px; line-height: 24px; color: #334155; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${themeColor}; padding-bottom: 20px; margin-bottom: 25px; align-items: flex-end; }
            .business-info h1 { margin: 0; color: ${themeColor}; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
            .business-info p { margin: 3px 0 0 0; font-size: 12px; color: #475569; font-weight: 500; }
            .doc-title { text-align: right; }
            .doc-title h2 { color: ${themeColor}; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
            .doc-title p { font-weight: bold; color: #1e293b; margin: 5px 0 0 0; font-size: 16px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 20px; }
            .details div { width: 48%; }
            .details h3 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; font-weight: bold; letter-spacing: 0.5px; }
            .details p { margin: 0; font-weight: bold; font-size: 14px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; margin-bottom: 25px; }
            table th { padding: 12px 10px; border-top: 1.5px solid #1e293b; border-bottom: 1.5px solid #1e293b; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: bold; letter-spacing: 0.5px; }
            table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: ${themeColor}; border-top: 1.5px solid #1e293b; margin-top: 5px; padding-top: 10px; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="doc-box">
            
            <!-- Header Section -->
            <div class="header">
              <div class="business-info">
                <h1>${billData.serviceProviderName || selectedProgram?.name || 'CONTRACTOR'}</h1>
                <p>${billData.serviceProviderAddress || selectedProgram?.address || ''}</p>
                <p>Phone: ${billData.serviceProviderPhone || selectedProgram?.phone || ''} ${billData.serviceProviderGstin ? `| GSTIN: ${billData.serviceProviderGstin}` : ''}</p>
              </div>
              <div class="doc-title">
                <h2>LABOUR BILL</h2>
                <p>No: ${billData.billNumber}</p>
                <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: normal; color: #64748b;">Date: <strong>${new Date(billData.billDate).toLocaleDateString('en-GB')}</strong></p>
              </div>
            </div>

            <!-- Details Section -->
            <div class="details">
              <div>
                <h3>Consignee / Client:</h3>
                <p style="font-size: 16px;">${billData.clientName || 'Walk-in Client'}</p>
                <p style="font-weight: normal; color: #475569; font-size: 12px; margin-top: 4px; line-height: 1.5;">${billData.clientAddress || ''}</p>
                <p style="font-weight: normal; color: #475569; font-size: 12px; margin-top: 2px;">Phone: ${billData.clientPhone || ''}</p>
                ${billData.clientGstin ? `<p style="font-weight: normal; color: #1e293b; font-size: 12px; margin-top: 2px;">GSTIN: ${billData.clientGstin}</p>` : ''}
              </div>
              <div style="text-align: right">
                <h3>Document Details:</h3>
                <p style="font-weight: normal; margin: 0; font-size: 13px; color: #475569;">Payment Status: <strong style="color: ${billData.status === 'Paid' ? '#16a34a' : '#d97706'}">${billData.status}</strong></p>
                ${billData.showPaymentTerms && billData.paymentTerms ? `<p style="font-weight: normal; margin: 4px 0 0 0; font-size: 13px; color: #475569;">Payment Terms: <strong>${billData.paymentTerms}</strong></p>` : ''}
              </div>
            </div>

            <!-- Logistics / Dispatch Info Grid -->
            ${(billData.vehicleNumber || billData.lrGrNumber || billData.origin || billData.destination || billData.goodsDescription || billData.loadingDate || billData.unloadingDate || billData.numberOfLabourers) ? `
              <div style="margin-bottom: 25px; padding: 15px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; line-height: 1.6;">
                <h4 style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${themeColor}; font-weight: bold;">Logistics & Transport Information</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                  ${billData.vehicleNumber ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Vehicle No.</span><strong style="color: #1e293b;">${billData.vehicleNumber}</strong></div>` : ''}
                  ${billData.lrGrNumber ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">LR / GR No.</span><strong style="color: #1e293b;">${billData.lrGrNumber}</strong></div>` : ''}
                  ${billData.numberOfLabourers ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Labourers</span><strong style="color: #1e293b;">${billData.numberOfLabourers} Persons</strong></div>` : ''}
                  ${billData.goodsDescription ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Goods</span><strong style="color: #1e293b;">${billData.goodsDescription}</strong></div>` : ''}
                  ${billData.origin ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Origin</span><strong style="color: #1e293b;">${billData.origin}</strong></div>` : ''}
                  ${billData.destination ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Destination</span><strong style="color: #1e293b;">${billData.destination}</strong></div>` : ''}
                  ${billData.loadingDate ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Loading Date</span><strong style="color: #1e293b;">${new Date(billData.loadingDate).toLocaleDateString('en-GB')}</strong></div>` : ''}
                  ${billData.unloadingDate ? `<div><span style="color: #64748b; font-size: 9px; text-transform: uppercase; display: block; font-weight: bold;">Unloading Date</span><strong style="color: #1e293b;">${new Date(billData.unloadingDate).toLocaleDateString('en-GB')}</strong></div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Charges Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Sr.</th>
                  <th style="text-align: left;">Work Description / Extra Charge</th>
                  <th style="width: 100px; text-align: center;">Labourers</th>
                  <th style="width: 80px; text-align: center;">Days</th>
                  <th style="width: 120px; text-align: right;">Rate</th>
                  <th style="width: 140px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(billData.workItems || []).map((item, idx) => `
                  <tr>
                    <td style="text-align: center; color: #64748b;">${String(idx + 1).padStart(2, '0')}</td>
                    <td style="text-align: left; font-weight: bold; color: #1e293b;">${item.workDescription || 'Labour Work'}</td>
                    <td style="text-align: center;">${item.labourCount}</td>
                    <td style="text-align: center;">${item.workingDays || 1}</td>
                    <td style="text-align: right;">₹${Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: bold; color: #1e293b;">₹${Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                ${otherChargesList.map((item, idx) => `
                  <tr>
                    <td style="text-align: center; color: #64748b;">${String((billData.workItems || []).length + idx + 1).padStart(2, '0')}</td>
                    <td style="text-align: left; font-weight: bold; color: #1e293b;">${item.label}</td>
                    <td style="text-align: center; color: #94a3b8;">-</td>
                    <td style="text-align: center; color: #94a3b8;">-</td>
                    <td style="text-align: right; color: #94a3b8;">-</td>
                    <td style="text-align: right; font-weight: bold; color: #1e293b;">₹${Number(item.val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summary / Totals block -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px;">
              <div style="max-width: 450px; flex: 1;">
                <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; color: #334155; font-weight: 600;">
                  <span style="display: block; font-size: 9px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: bold;">Amount in Words</span>
                  ${computed.amountInWords}
                </div>
                ${billData.remarks ? `
                  <div style="margin-top: 15px;">
                    <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 2px;">Remarks / Instructions</div>
                    <p style="margin: 0; font-size: 11px; font-style: italic; color: #555;">${billData.remarks}</p>
                  </div>
                ` : ''}
                ${billData.showTerms && billData.paymentTerms ? `
                  <div style="margin-top: 15px;">
                    <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 2px;">Terms & Conditions</div>
                    <p style="margin: 0; font-size: 10px; color: #555; white-space: pre-wrap; line-height: 1.5;">${billData.paymentTerms}</p>
                  </div>
                ` : ''}
              </div>

              <div style="width: 250px; flex-shrink: 0; margin-left: auto;">
                ${billData.showTax ? `
                  <div class="total-row" style="font-size: 13px; color: #555;">
                    <span>Sub Total:</span>
                    <span>₹${computed.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ${Number(billData.taxPercentage) > 0 ? `
                    <div class="total-row" style="font-size: 13px; color: #555;">
                      <span>${billData.taxDetails || 'Tax'} (${billData.taxPercentage}%):</span>
                      <span>₹${computed.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ` : ''}
                ` : ''}
                <div class="total-row grand-total">
                  <span>Grand Total:</span>
                  <span>₹${computed.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Footer section -->
            <div class="footer" style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="text-align: left;">
                <p style="margin: 0;">Generated electronically. Subject to jurisdiction terms.</p>
                <p style="margin: 2px 0 0 0;">Thank you for your business! | Powered by Krishna ERP</p>
              </div>
              ${billData.showSignature ? `
                <div style="text-align: center; min-width: 180px;">
                  ${selectedProgram?.signatureUrl ? `<img src="${selectedProgram.signatureUrl}" alt="Signature" style="max-height: 50px; margin-bottom: 5px; max-width: 150px; object-fit: contain;">` : ''}
                  <div style="border-top: 1.5px solid #334155; margin-top: 40px; font-size: 11px; font-weight: bold; color: #1e293b; padding-top: 4px;">Authorized Signature</div>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">For ${billData.serviceProviderName || selectedProgram?.name}</p>
                </div>
              ` : ''}
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

  // Live Preview layout for form
  const renderPreview = (billData) => {
    const computed = calculateTotals(billData);
    const themeColor = selectedProgram?.themeColor || '#4f46e5';

    const otherChargesList = [
      { label: 'Loading Charges', val: billData.loadingCharges },
      { label: 'Unloading Charges', val: billData.unloadingCharges },
      { label: 'Handling Charges', val: billData.handlingCharges },
      { label: 'Packing Charges', val: billData.packingCharges },
      { label: 'Overtime Charges', val: billData.overtimeCharges },
      { label: 'Additional Charges', val: billData.additionalCharges }
    ].filter(item => Number(item.val) > 0);

    const customer = customers.find(c => c._id === (billData.customer?._id || billData.customer));
    const theme = billData.theme || 'classic';

    return (
      <div className={`invoice-container theme-${theme}`} style={{ '--theme-color': themeColor, background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        
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
              <h2 style={{ margin: 0, color: 'inherit', fontSize: '28px', fontWeight: '900', letterSpacing: '2px' }}>LABOUR BILL</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'inherit' }}>
                <b>No:</b> {billData.billNumber || 'DRAFT'} | <b>Date:</b> {new Date(billData.billDate).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: theme === 'modern' ? '0 40px 40px 40px' : '24px' }}>
          
          <div className="invoice-info">
            <div>
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '10px' }}>Consignee / Client:</h3>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{billData.clientName || 'Walk-in Client'}</p>
              {billData.clientAddress && <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666', maxWidth: '250px' }}>{billData.clientAddress}</p>}
              {billData.clientPhone && <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>Phone: {billData.clientPhone}</p>}
              {billData.clientGstin && <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#111' }}><b>GSTIN:</b> {billData.clientGstin}</p>}
            </div>
            {billData.showPaymentTerms && billData.paymentTerms && (
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '10px' }}>Payment Info:</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#666', maxWidth: '250px', whiteSpace: 'pre-wrap' }}>{billData.paymentTerms}</p>
              </div>
            )}
          </div>

          {/* Logistics Details */}
          {(billData.vehicleNumber || billData.lrGrNumber || billData.origin || billData.destination || billData.goodsDescription || billData.loadingDate || billData.unloadingDate || billData.numberOfLabourers) && (
            <div style={{ 
              marginBottom: '30px', 
              padding: '15px 20px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                color: 'var(--theme-color, #4f46e5)', 
                fontWeight: '700' 
              }}>Logistics & Transport Information</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '15px' 
              }}>
                {billData.vehicleNumber && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Vehicle No.</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.vehicleNumber}</span>
                  </div>
                )}
                {billData.lrGrNumber && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>LR / GR No.</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.lrGrNumber}</span>
                  </div>
                )}
                {billData.numberOfLabourers && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Labour Count</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.numberOfLabourers} Persons</span>
                  </div>
                )}
                {billData.goodsDescription && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Goods Description</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.goodsDescription}</span>
                  </div>
                )}
                {billData.origin && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Origin</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.origin}</span>
                  </div>
                )}
                {billData.destination && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Destination</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{billData.destination}</span>
                  </div>
                )}
                {billData.loadingDate && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Loading Date</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(billData.loadingDate).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
                {billData.unloadingDate && (
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Unloading Date</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(billData.unloadingDate).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charges Grid */}
          <div className="mb-6">
            <h4 style={{ color: themeColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px' }}>Charges & Costing</h4>
            <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ borderTop: '1.5px solid #1e293b', borderBottom: '1.5px solid #1e293b' }}>
                  <th style={{ width: '50px', padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center' }}>Sr.</th>
                  <th style={{ padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'left' }}>Description</th>
                  <th style={{ width: '100px', padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center' }}>Labourers</th>
                  <th style={{ width: '80px', padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center' }}>Days</th>
                  <th style={{ width: '120px', padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '140px', padding: '12px 10px', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(billData.workItems || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ color: '#64748b', padding: '14px 10px', textAlign: 'center', fontSize: '13px' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ fontWeight: '600', color: '#1e293b', padding: '14px 10px', textAlign: 'left', fontSize: '13px' }}>{item.workDescription || 'Labour Work'}</td>
                    <td style={{ textAlign: 'center', padding: '14px 10px', color: '#1e293b', fontSize: '13px' }}>{item.labourCount}</td>
                    <td style={{ textAlign: 'center', padding: '14px 10px', color: '#1e293b', fontSize: '13px' }}>{item.workingDays || 1}</td>
                    <td style={{ textAlign: 'right', padding: '14px 10px', color: '#1e293b', fontSize: '13px' }}>₹{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e293b', padding: '14px 10px', fontSize: '13px' }}>₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {otherChargesList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ color: '#64748b', padding: '14px 10px', textAlign: 'center', fontSize: '13px' }}>{String((billData.workItems || []).length + idx + 1).padStart(2, '0')}</td>
                    <td style={{ fontWeight: '600', color: '#1e293b', padding: '14px 10px', textAlign: 'left', fontSize: '13px' }}>{item.label}</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8', padding: '14px 10px', fontSize: '13px' }}>-</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8', padding: '14px 10px', fontSize: '13px' }}>-</td>
                    <td style={{ textAlign: 'right', color: '#94a3b8', padding: '14px 10px', fontSize: '13px' }}>-</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e293b', padding: '14px 10px', fontSize: '13px' }}>₹{Number(item.val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {(!billData.workItems || billData.workItems.length === 0) && otherChargesList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>No charges entered yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px', marginTop: '30px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                padding: '10px 15px', 
                background: '#f8fafc', 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px', 
                fontSize: '12px', 
                color: '#1e293b', 
                fontWeight: '600' 
              }}>
                <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>Amount in Words</span>
                {computed.amountInWords}
              </div>
              {billData.remarks && (
                <div style={{ marginTop: '15px' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Remarks / Internal Notes</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>{billData.remarks}</p>
                </div>
              )}
              {billData.showTerms && billData.paymentTerms && (
                <div style={{ marginTop: '15px' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Terms & Conditions</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{billData.paymentTerms}</p>
                </div>
              )}
            </div>

            <div className="total-section" style={{ marginTop: 0 }}>
              {billData.showTax ? (
                <>
                  <div className="total-row">
                    <span style={{ color: '#666' }}>Sub Total</span>
                    <span style={{ fontWeight: '600' }}>₹{computed.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(billData.taxPercentage) > 0 && (
                    <div className="total-row">
                      <span style={{ color: '#666' }}>{billData.taxDetails || 'Tax'} ({billData.taxPercentage}%)</span>
                      <span style={{ fontWeight: '600' }}>₹{computed.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </>
              ) : null}
              <div className="total-row grand-total" style={{ color: themeColor, borderTop: '1.5px solid #1e293b', paddingTop: '10px', marginTop: '5px' }}>
                <span>Grand Total</span>
                <span>₹{computed.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div>
              <p style={{ fontSize: '10px', color: '#999', margin: 0 }}>Generated electronically. Subject to jurisdiction terms.</p>
              <p style={{ fontSize: '10px', color: '#999', margin: '2px 0 0 0' }}>Thank you for your business! | Powered by Krishna ERP</p>
            </div>
            {billData.showSignature && (
              <div className="signature-section">
                {selectedProgram?.signatureUrl && (
                  <img src={selectedProgram.signatureUrl} alt="Signature" className="signature-image" />
                )}
                <div className="signature-label">Authorized Signature</div>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#999' }}>For {billData.serviceProviderName || selectedProgram?.name}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Search Header */}
      {!showForm && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:w-80">
            <input 
              type="text" 
              className="form-control pl-10" 
              placeholder="Search by Bill No, Client, Vehicle, or LR No..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
            </div>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus size={18} />
            <span>Create New Labour Bill</span>
          </button>
        </div>
      )}

      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in slide-in-from-top-4 duration-300">
          
          {/* Editor Form Card */}
          <div className="card shadow-2xl border-t-4 border-primary bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                <span>{editingId ? 'Update Labour Bill' : 'New Labour Bill Details'}</span>
              </h2>
              <button className="text-gray-400 hover:text-rose-500" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: General Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span>General Bill Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Bill No. (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Auto-generated if blank"
                      value={formData.billNumber} 
                      onChange={e => setFormData({...formData, billNumber: e.target.value})} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Bill Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required 
                      value={formData.billDate} 
                      onChange={e => setFormData({...formData, billDate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Payment Status</label>
                    <select 
                      className="form-control" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Contractor Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={14} className="text-primary" />
                  <span>Contractor / Service Provider Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Contractor Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.serviceProviderName} 
                      onChange={e => setFormData({...formData, serviceProviderName: e.target.value})} 
                      placeholder="Enter provider business name"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">GSTIN (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.serviceProviderGstin} 
                      onChange={e => setFormData({...formData, serviceProviderGstin: e.target.value})} 
                      placeholder="GSTIN of service provider"
                    />
                  </div>
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label text-xs">Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.serviceProviderAddress} 
                      onChange={e => setFormData({...formData, serviceProviderAddress: e.target.value})} 
                      placeholder="Provider address details"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Contact Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.serviceProviderPhone} 
                      onChange={e => setFormData({...formData, serviceProviderPhone: e.target.value})} 
                      placeholder="Provider contact phone"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Client Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={14} className="text-emerald-500" />
                  <span>Client / Consignee Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label text-xs">Select Saved Customer</label>
                    <select 
                      className="form-control" 
                      value={formData.customer} 
                      onChange={e => handleCustomerChange(e.target.value)}
                    >
                      <option value="">-- Quick Select Customer (Optional) --</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.customerName}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Client Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={formData.clientName} 
                      onChange={e => setFormData({...formData, clientName: e.target.value})} 
                      placeholder="Enter client/consignee name"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Client GSTIN (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.clientGstin} 
                      onChange={e => setFormData({...formData, clientGstin: e.target.value})} 
                      placeholder="Client GSTIN"
                    />
                  </div>
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label text-xs">Client Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.clientAddress} 
                      onChange={e => setFormData({...formData, clientAddress: e.target.value})} 
                      placeholder="Client address"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Client Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.clientPhone} 
                      onChange={e => setFormData({...formData, clientPhone: e.target.value})} 
                      placeholder="Client contact number"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Logistics & Dispatch Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Truck size={14} className="text-indigo-500" />
                  <span>Logistics & Transport details (All Optional)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Vehicle Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.vehicleNumber} 
                      onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} 
                      placeholder="e.g. MH-12-AB-1234"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">LR / GR Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.lrGrNumber} 
                      onChange={e => setFormData({...formData, lrGrNumber: e.target.value})} 
                      placeholder="e.g. LR-4091"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Origin (From)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.origin} 
                      onChange={e => setFormData({...formData, origin: e.target.value})} 
                      placeholder="Loading Point"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Destination (To)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.destination} 
                      onChange={e => setFormData({...formData, destination: e.target.value})} 
                      placeholder="Delivery Point"
                    />
                  </div>
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label text-xs">Goods Description</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.goodsDescription} 
                      onChange={e => setFormData({...formData, goodsDescription: e.target.value})} 
                      placeholder="e.g. Industrial pipes, Machinery, Cotton bales"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Loading Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.loadingDate} 
                      onChange={e => setFormData({...formData, loadingDate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Unloading Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.unloadingDate} 
                      onChange={e => setFormData({...formData, unloadingDate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Number of Labourers</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.numberOfLabourers} 
                      onChange={e => setFormData({...formData, numberOfLabourers: e.target.value})} 
                      placeholder="Number of workers deployed"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Labour Work Items Editor Table */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-amber-500" />
                    <span>Labour Work Breakdown (Work Count Rate Total)</span>
                  </h4>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm flex items-center gap-1 border-dashed py-1.5"
                    onClick={addWorkItem}
                  >
                    <Plus size={14} /> Add Work Row
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(formData.workItems || []).map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-white rounded-lg border border-slate-200 relative group animate-in slide-in-from-top-1">
                      <div className="col-span-12 md:col-span-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Work Description</label>
                        <input 
                          type="text" 
                          className="form-control py-1.5" 
                          required
                          placeholder="e.g. Loading pipes" 
                          value={item.workDescription} 
                          onChange={e => updateWorkItem(index, 'workDescription', e.target.value)} 
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Labourers</label>
                        <input 
                          type="number" 
                          className="form-control py-1.5" 
                          required 
                          min="1"
                          value={item.labourCount} 
                          onChange={e => updateWorkItem(index, 'labourCount', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Days</label>
                        <input 
                          type="number" 
                          className="form-control py-1.5" 
                          required 
                          min="1"
                          value={item.workingDays !== undefined ? item.workingDays : 1} 
                          onChange={e => updateWorkItem(index, 'workingDays', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Rate (₹)</label>
                        <input 
                          type="number" 
                          className="form-control py-1.5" 
                          required 
                          value={item.rate || ''} 
                          placeholder="0.00"
                          onChange={e => updateWorkItem(index, 'rate', parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Total</label>
                        <div className="font-bold text-primary text-sm pt-2">₹{(item.total || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="col-span-1 flex items-end justify-center pb-2">
                        {formData.workItems.length > 1 && (
                          <button 
                            type="button" 
                            className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded"
                            onClick={() => removeWorkItem(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Static Extra Charges */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign size={14} className="text-amber-500" />
                  <span>Other Transport Charges (Optional, in ₹)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Loading Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.loadingCharges || ''} 
                      onChange={e => setFormData({...formData, loadingCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Unloading Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.unloadingCharges || ''} 
                      onChange={e => setFormData({...formData, unloadingCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Handling Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.handlingCharges || ''} 
                      onChange={e => setFormData({...formData, handlingCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Packing Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.packingCharges || ''} 
                      onChange={e => setFormData({...formData, packingCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Overtime Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.overtimeCharges || ''} 
                      onChange={e => setFormData({...formData, overtimeCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Additional Charges</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.additionalCharges || ''} 
                      onChange={e => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Taxation settings & Print Checkboxes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign size={14} className="text-rose-500" />
                  <span>Tax, Print & Theme Configuration</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Tax label</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.taxDetails} 
                      onChange={e => setFormData({...formData, taxDetails: e.target.value})} 
                      placeholder="e.g. GST, CGST+SGST"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Tax Percentage (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.taxPercentage || ''} 
                      onChange={e => setFormData({...formData, taxPercentage: parseFloat(e.target.value) || 0})} 
                      placeholder="e.g. 18"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Bill Theme</label>
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
                  
                  {/* Print Checkboxes */}
                  <div className="md:col-span-3 flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-200 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-primary rounded" 
                        checked={formData.showTax} 
                        onChange={e => setFormData({...formData, showTax: e.target.checked})} 
                      />
                      <span className="text-sm font-bold text-gray-600">Include Tax Breakdown in Print</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-primary rounded" 
                        checked={formData.showTerms} 
                        onChange={e => setFormData({...formData, showTerms: e.target.checked})} 
                      />
                      <span className="text-sm font-bold text-gray-600">Include Terms & Conditions</span>
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
                        checked={formData.showSignature} 
                        onChange={e => setFormData({...formData, showSignature: e.target.checked})} 
                      />
                      <span className="text-sm font-bold text-gray-600">Include Authorized Signature</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Terms and Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs">Payment Terms</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={formData.paymentTerms} 
                    onChange={e => setFormData({...formData, paymentTerms: e.target.value})} 
                    placeholder="Enter bill terms..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs">Remarks (Internal or Bill notes)</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={formData.remarks} 
                    onChange={e => setFormData({...formData, remarks: e.target.value})} 
                    placeholder="Any special remarks..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary w-1/3 py-3" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary w-2/3 py-3 shadow-lg hover:scale-[1.01] transition-transform">
                  {editingId ? 'Update Labour Bill' : 'Generate Labour Bill'}
                </button>
              </div>

            </form>
          </div>

          {/* Interactive Document Preview Column */}
          <div className="hidden lg:block sticky top-8">
            <h3 className="text-xl font-bold mb-6 text-gray-400">Live Document Preview</h3>
            <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
              {renderPreview(formData)}
            </div>
          </div>

        </div>
      )}

      {/* Preview Overlay for existing bills */}
      {previewData && (
        <div className="preview-overlay bg-gray-900/60 backdrop-blur-sm min-h-screen p-2 md:p-8 fixed inset-0 z-[2000] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 z-10 p-2 no-print">
              <button 
                className="btn btn-secondary flex items-center gap-2 bg-white/90 backdrop-blur-md" 
                onClick={() => setPreviewData(null)}
              >
                <X size={18} />
                <span>Close</span>
              </button>
              
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg border shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase px-1">Theme</span>
                <select 
                  className="form-control py-1 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  style={{ width: '180px' }}
                  value={previewTheme}
                  onChange={(e) => {
                    setPreviewTheme(e.target.value);
                    setPreviewData({ ...previewData, theme: e.target.value });
                  }}
                >
                  <option value="classic">Classic / Professional</option>
                  <option value="modern">Modern Banner</option>
                  <option value="minimalist">Clean Minimalist</option>
                </select>
              </div>

              <button 
                className="btn btn-primary flex items-center gap-2 shadow-lg" 
                onClick={() => handlePrint(previewData)}
              >
                <Printer size={18} />
                <span>Print Bill</span>
              </button>
            </div>
            
            <div className="animate-in fade-in zoom-in-95 duration-300">
              {renderPreview(previewData)}
            </div>
          </div>
        </div>
      )}

      {/* Labour Bills List Table */}
      {!showForm && (
        <div className="card shadow-xl border-none bg-white">
          <div className="table-container border-none shadow-none">
            <table className="data-table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-4">Bill No</th>
                  <th className="py-4">Client / Consignee</th>
                  <th className="py-4">Date</th>
                  <th className="py-4">Route</th>
                  <th className="py-4">Total Amount</th>
                  <th className="py-4 text-center">Status</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map(bill => (
                  <tr key={bill._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-primary">{bill.billNumber}</td>
                    <td className="py-4 font-bold text-slate-800">{bill.clientName}</td>
                    <td className="py-4 text-slate-500">{new Date(bill.billDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-4 text-xs text-slate-600">
                      {bill.origin && bill.destination ? (
                        <span>{bill.origin} &rarr; {bill.destination}</span>
                      ) : bill.origin || bill.destination || 'N/A'}
                    </td>
                    <td className="py-4 font-bold text-slate-900">
                      ₹{bill.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        bill.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : bill.status === 'Overdue' 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-amber-50 text-amber-600'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-primary transition-colors bg-white border rounded-lg shadow-sm"
                          onClick={() => { setPreviewData(bill); setPreviewTheme(bill.theme || 'classic'); }}
                          title="View / Print"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-white border rounded-lg shadow-sm"
                          onClick={() => handleEdit(bill)}
                          title="Edit Bill"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-white border rounded-lg shadow-sm"
                          onClick={() => handleDelete(bill._id)}
                          title="Delete Bill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-20 text-center text-gray-400 italic">No Labour Bills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default LabourBillsTab;
