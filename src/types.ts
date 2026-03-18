export interface MasterItem {
  id: string;
  name: string;
}

export interface ProductMaster extends MasterItem {
  models: MasterItem[];
}

export interface SelectedProduct {
  productId: string;
  productName: string;
  modelId: string;
  modelName: string;
}

export interface Sale {
  id: string;
  branchManager: string;
  dealPerson: string;
  customerName: string;
  mobile: string;
  address: string;
  selectedProducts: SelectedProduct[];
  case: string;
  finance: boolean;
  financeCompany: string;
  amount: number;
  exchange: boolean;
  exchangeModel: string;
  exchangeAmount: number;
  financeAmount: number;
  financeReceived: number;
  receivedAmount: number;
  remark: string;
  date: string;
  deliveryDate?: string;
  dueDate?: string;
  isOldTractorSale?: boolean;
  status: 'Pending' | 'Delivered' | 'Paid';
  followUpDate?: string;
  followUpRemark?: string;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string;
  verifiedBy?: string;
}

export interface Payment {
  id: string;
  saleId: string;
  customerName: string;
  amount: number;
  date: string;
  mode: 'Cash' | 'Bank' | 'Cheque' | 'Other';
  type: 'Customer' | 'Finance';
  remark: string;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string;
  verifiedBy?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'User';
  permissions: {
    canAddSale: boolean;
    canViewPayments: boolean;
    canAddPayments: boolean;
    canViewDebtors: boolean;
    canViewOldTractors: boolean;
    canManageMaster: boolean;
  };
}

export type ViewType = 'Dashboard' | 'Sale Data' | 'Delivered Data' | 'Debtor List' | 'Payment Received' | 'Old Tractor Data' | 'Master' | 'Users' | 'Approvals';
