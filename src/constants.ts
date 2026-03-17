import { Sale, MasterItem, ProductMaster } from './types';

export const MOCK_BRANCH_MANAGERS: MasterItem[] = [
  { id: '1', name: 'Rajesh' },
  { id: '2', name: 'Suresh' },
];

export const MOCK_DEAL_PERSONS: MasterItem[] = [
  { id: '1', name: 'Amit' },
  { id: '2', name: 'Vikram' },
];

export const MOCK_FINANCE_COMPANIES: MasterItem[] = [
  { id: '1', name: 'Tata Finance' },
  { id: '2', name: 'HDFC Bank' },
  { id: '3', name: 'Mahindra Finance' },
];

export const MOCK_CASE_TYPES: MasterItem[] = [
  { id: '1', name: 'Cash' },
  { id: '2', name: 'Subsidy' },
];

export const MOCK_PRODUCTS: ProductMaster[] = [
  { 
    id: 'p4', 
    name: 'Tractor', 
    models: [
      { id: 'm7', name: 'John 5050' },
      { id: 'm8', name: 'Mahindra 575' }
    ] 
  },
  { 
    id: 'p5', 
    name: 'Harvester', 
    models: [
      { id: 'm9', name: 'HK45' },
      { id: 'm10', name: 'HK50' }
    ] 
  },
  { 
    id: 'p1', 
    name: 'Rotavator', 
    models: [
      { id: 'm1', name: 'Model A' },
      { id: 'm2', name: 'Model B' }
    ] 
  },
  { 
    id: 'p2', 
    name: 'Cultivator', 
    models: [
      { id: 'm3', name: 'Type 1' },
      { id: 'm4', name: 'Type 2' }
    ] 
  },
  { 
    id: 'p3', 
    name: 'RTP Machine', 
    models: [
      { id: 'm5', name: 'Standard' },
      { id: 'm6', name: 'Pro' }
    ] 
  },
];

export const MOCK_SALES: Sale[] = [
  {
    id: '1',
    branchManager: 'Rajesh',
    dealPerson: 'Amit',
    customerName: 'Manoj',
    mobile: '6268755735',
    address: 'Patna',
    selectedProducts: [{ productId: 'p3', productName: 'RTP Machine', modelId: 'm5', modelName: 'Standard' }],
    case: '4',
    finance: true,
    financeCompany: 'Tata Finance',
    amount: 450000,
    exchange: false,
    exchangeModel: '',
    exchangeAmount: 0,
    financeAmount: 400000,
    financeReceived: 0,
    receivedAmount: 50000,
    remark: 'First order',
    date: '2024-03-01',
    status: 'Pending'
  },
  {
    id: '2',
    branchManager: 'Suresh',
    dealPerson: 'Vikram',
    customerName: 'Rahul Singh',
    mobile: '9876543210',
    address: 'Gaya',
    selectedProducts: [{ productId: 'p4', productName: 'Tractor', modelId: 'm8', modelName: 'Mahindra 575' }],
    case: '2',
    finance: false,
    financeCompany: '',
    amount: 750000,
    exchange: true,
    exchangeModel: 'Old Mahindra',
    exchangeAmount: 150000,
    financeAmount: 0,
    financeReceived: 0,
    receivedAmount: 600000,
    remark: 'Exchange deal',
    date: '2024-03-05',
    deliveryDate: '2024-03-06',
    status: 'Delivered'
  },
  {
    id: '3',
    branchManager: 'Rajesh',
    dealPerson: 'Amit',
    customerName: 'Deepak Kumar',
    mobile: '8877665544',
    address: 'Muzaffarpur',
    selectedProducts: [{ productId: 'p2', productName: 'Cultivator', modelId: 'm3', modelName: 'Type 1' }],
    case: '1',
    finance: true,
    financeCompany: 'HDFC Bank',
    amount: 120000,
    exchange: false,
    exchangeModel: '',
    exchangeAmount: 0,
    financeAmount: 100000,
    financeReceived: 100000,
    receivedAmount: 20000,
    remark: 'Full payment',
    date: '2024-03-07',
    deliveryDate: '2024-03-08',
    status: 'Paid'
  }
];
