import React from 'react';
import LabourBillsTab from '../components/LabourBillsTab';

const LabourBills = ({ category = 'Labour' }) => {
  return <LabourBillsTab initialCategory={category} />;
};

export default LabourBills;
