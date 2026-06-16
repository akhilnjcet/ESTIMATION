import LabourBillsTab from '../components/LabourBillsTab';

const LabourBills = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Labour Bills</h1>
        <p className="text-gray-500">Manage and track your labour & goods transport billing records</p>
      </div>
      <LabourBillsTab />
    </div>
  );
};

export default LabourBills;
