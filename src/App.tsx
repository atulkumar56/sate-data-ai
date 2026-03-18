import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  Truck, 
  Users, 
  HandCoins, 
  Building2, 
  Wallet,
  Menu,
  X,
  Plus,
  Search,
  ChevronRight,
  Settings,
  Trash2,
  Pencil,
  Download,
  History,
  Calendar,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from 'firebase/firestore';
import { MOCK_SALES, MOCK_BRANCH_MANAGERS, MOCK_DEAL_PERSONS, MOCK_PRODUCTS, MOCK_FINANCE_COMPANIES, MOCK_CASE_TYPES } from './constants';
import { Sale, ViewType, MasterItem, ProductMaster, SelectedProduct, Payment, UserProfile } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [currentView, setCurrentView] = useState<ViewType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Master Data State
  const [branchManagers, setBranchManagers] = useState<MasterItem[]>(MOCK_BRANCH_MANAGERS);
  const [dealPersons, setDealPersons] = useState<MasterItem[]>(MOCK_DEAL_PERSONS);
  const [productsMaster, setProductsMaster] = useState<ProductMaster[]>(MOCK_PRODUCTS);
  const [financeCompanies, setFinanceCompanies] = useState<MasterItem[]>(MOCK_FINANCE_COMPANIES);
  const [caseTypes, setCaseTypes] = useState<MasterItem[]>(MOCK_CASE_TYPES);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  // Modal States
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isOldTractorModalOpen, setIsOldTractorModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User' as 'Admin' | 'User',
    permissions: {
      canAddSale: true,
      canViewPayments: true,
      canAddPayments: true,
      canViewDebtors: true,
      canViewOldTractors: true,
      canManageMaster: false
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Default profile for first user (Admin)
          const defaultProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Admin',
            role: 'Admin',
            permissions: {
              canAddSale: true,
              canViewPayments: true,
              canAddPayments: true,
              canViewDebtors: true,
              canViewOldTractors: true,
              canManageMaster: true
            }
          };
          await setDoc(docRef, defaultProfile);
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile?.role === 'Admin') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
        setAllUsers(usersData);
      });
      return () => unsubscribe();
    }
  }, [userProfile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!signUpName) {
      setAuthError('Please enter your name.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      const firebaseUser = userCredential.user;
      
      const userProfile: UserProfile = {
        id: firebaseUser.uid,
        email: loginEmail,
        name: signUpName,
        role: loginEmail === 'funnyatul3@gmail.com' ? 'Admin' : 'User',
        permissions: {
          canAddSale: true,
          canViewPayments: true,
          canAddPayments: true,
          canViewDebtors: true,
          canViewOldTractors: true,
          canManageMaster: loginEmail === 'funnyatul3@gmail.com'
        }
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      setUserProfile(userProfile);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setAuthError('Please enter your email address first.');
      return;
    }
    setAuthError('');
    setAuthMessage('');
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setAuthMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleAddSale = () => {
    if (!newSale.customerName || !newSale.branchManager) return;

    const dueDate = newSale.dueDate || calculateDueDate(newSale.date || new Date().toISOString().split('T')[0]);
    const saleData: Sale = {
      ...(newSale as Sale),
      id: editingSaleId || Math.random().toString(36).substr(2, 9),
      status: newSale.status || 'Pending',
      date: newSale.date || new Date().toISOString().split('T')[0],
      dueDate,
      verificationStatus: userProfile?.role === 'Admin' ? 'Approved' : 'Pending',
      createdBy: user?.uid || 'system',
      amount: Number(newSale.amount) || 0,
      exchangeAmount: Number(newSale.exchangeAmount) || 0,
      financeAmount: Number(newSale.financeAmount) || 0,
      financeReceived: Number(newSale.financeReceived) || 0,
      receivedAmount: Number(newSale.receivedAmount) || 0,
    };

    if (editingSaleId) {
      setSales(sales.map(s => s.id === editingSaleId ? saleData : s));
    } else {
      setSales([saleData, ...sales]);
      if (userProfile?.role !== 'Admin') {
        setAuthMessage('Sale added and sent for Admin verification.');
        setTimeout(() => setAuthMessage(''), 5000);
      }
    }

    setIsAddSaleModalOpen(false);
    setEditingSaleId(null);
    setNewSale({
      branchManager: '',
      dealPerson: '',
      customerName: '',
      mobile: '',
      address: '',
      selectedProducts: [],
      case: '',
      finance: false,
      financeCompany: '',
      amount: 0,
      exchange: false,
      exchangeModel: '',
      exchangeAmount: 0,
      financeAmount: 0,
      financeReceived: 0,
      receivedAmount: 0,
      remark: '',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: ''
    });
  };

  const handleAddOldTractorSale = () => {
    if (!newOldTractorSale.customerName || !newOldTractorSale.exchangeModel) return;

    const dueDate = newOldTractorSale.dueDate || calculateDueDate(newOldTractorSale.date || new Date().toISOString().split('T')[0]);
    const saleData: Sale = {
      ...(newOldTractorSale as Sale),
      id: Math.random().toString(36).substr(2, 9),
      isOldTractorSale: true,
      status: 'Pending',
      date: newOldTractorSale.date || new Date().toISOString().split('T')[0],
      dueDate,
      verificationStatus: userProfile?.role === 'Admin' ? 'Approved' : 'Pending',
      createdBy: user?.uid || 'system',
      amount: Number(newOldTractorSale.amount) || 0,
      receivedAmount: 0,
      exchange: false,
      selectedProducts: [],
      finance: false,
      financeAmount: 0,
      financeReceived: 0,
      exchangeAmount: 0,
      exchangeModel: newOldTractorSale.exchangeModel || '',
    };

    setSales([saleData, ...sales]);
    if (userProfile?.role !== 'Admin') {
      setAuthMessage('Old tractor data added and sent for Admin verification.');
      setTimeout(() => setAuthMessage(''), 5000);
    }
    setIsOldTractorModalOpen(false);
    setNewOldTractorSale({
      branchManager: '',
      dealPerson: '',
      customerName: '',
      mobile: '',
      address: '',
      exchangeModel: '',
      amount: 0,
      remark: '',
      isOldTractorSale: true,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: ''
    });
  };

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.saleId) return;

    const paymentData: Payment = {
      ...(newPayment as Payment),
      id: Math.random().toString(36).substr(2, 9),
      date: newPayment.date || new Date().toISOString().split('T')[0],
      verificationStatus: userProfile?.role === 'Admin' ? 'Approved' : 'Pending',
      createdBy: user?.uid || 'system',
      amount: Number(newPayment.amount) || 0,
    };

    setPayments([paymentData, ...payments]);
    if (userProfile?.role !== 'Admin') {
      setAuthMessage('Payment added and sent for Admin verification.');
      setTimeout(() => setAuthMessage(''), 5000);
    }
    setIsPaymentModalOpen(false);
    setNewPayment({
      saleId: '',
      customerName: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      mode: 'Cash',
      type: 'Customer',
      remark: ''
    });
  };

  const handleApprove = (type: 'Sale' | 'Payment', id: string) => {
    if (type === 'Sale') {
      setSales(sales.map(s => s.id === id ? { ...s, verificationStatus: 'Approved', verifiedBy: user?.uid } : s));
    } else {
      setPayments(payments.map(p => p.id === id ? { ...p, verificationStatus: 'Approved', verifiedBy: user?.uid } : p));
    }
  };

  const handleReject = (type: 'Sale' | 'Payment', id: string) => {
    if (type === 'Sale') {
      setSales(sales.map(s => s.id === id ? { ...s, verificationStatus: 'Rejected', verifiedBy: user?.uid } : s));
    } else {
      setPayments(payments.map(p => p.id === id ? { ...p, verificationStatus: 'Rejected', verifiedBy: user?.uid } : p));
    }
  };

  const handleAddUser = async () => {
    try {
      // Note: In a real app, you'd use a Cloud Function to create users to avoid logging out the current admin.
      // For this demo, we'll simulate adding to Firestore.
      const tempId = Math.random().toString(36).substr(2, 9);
      const userToCreate: UserProfile = {
        id: tempId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        permissions: newUser.permissions
      };
      await setDoc(doc(db, 'users', tempId), userToCreate);
      setIsAddUserModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'User',
        permissions: {
          canAddSale: true,
          canViewPayments: true,
          canAddPayments: true,
          canViewDebtors: true,
          canViewOldTractors: true,
          canManageMaster: false
        }
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePermission = (userId: string, permission: keyof UserProfile['permissions']) => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser) {
      const updatedPermissions = {
        ...targetUser.permissions,
        [permission]: !targetUser.permissions[permission]
      };
      setDoc(doc(db, 'users', userId), { ...targetUser, permissions: updatedPermissions });
    }
  };
  const [followUpData, setFollowUpData] = useState<{ saleId: string; date: string; remark: string }>({ saleId: '', date: '', remark: '' });
  const [oldTractorSearchTerm, setOldTractorSearchTerm] = useState('');
  const [oldTractorDateFilter, setOldTractorDateFilter] = useState({ start: '', end: '' });
  const [deliveredDateFilter, setDeliveredDateFilter] = useState({ start: '', end: '' });
  const [paymentDateFilter, setPaymentDateFilter] = useState({ start: '', end: '' });
  
  const [isOldTractorFilterOpen, setIsOldTractorFilterOpen] = useState(false);
  const [isDeliveredFilterOpen, setIsDeliveredFilterOpen] = useState(false);
  const [isPaymentFilterOpen, setIsPaymentFilterOpen] = useState(false);

  const [deliverySaleId, setDeliverySaleId] = useState<string | null>(null);
  const [deliveryDateInput, setDeliveryDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [selectedDebtorType, setSelectedDebtorType] = useState<'manager' | 'person' | null>(null);
  const [selectedDebtorName, setSelectedDebtorName] = useState<string | null>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<string | null>(null);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    saleId: '',
    customerName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    mode: 'Cash',
    type: 'Customer',
    remark: ''
  });

  const [newSale, setNewSale] = useState<Partial<Sale>>({
    branchManager: '',
    dealPerson: '',
    customerName: '',
    mobile: '',
    address: '',
    selectedProducts: [],
    case: '',
    finance: false,
    financeCompany: '',
    amount: 0,
    exchange: false,
    exchangeModel: '',
    exchangeAmount: 0,
    financeAmount: 0,
    financeReceived: 0,
    receivedAmount: 0,
    remark: '',
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  const [newOldTractorSale, setNewOldTractorSale] = useState<Partial<Sale>>({
    branchManager: '',
    dealPerson: '',
    customerName: '',
    mobile: '',
    address: '',
    exchangeModel: '',
    amount: 0,
    remark: '',
    isOldTractorSale: true,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  // Master View Input States
  const [newManager, setNewManager] = useState('');
  const [newDealPerson, setNewDealPerson] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newFinanceCompany, setNewFinanceCompany] = useState('');
  const [newCaseType, setNewCaseType] = useState('');
  const [newModel, setNewModel] = useState<{ productId: string; name: string }>({ productId: '', name: '' });

  const menuItems = [
    { name: 'Dashboard' as ViewType, icon: LayoutDashboard, show: true },
    { name: 'Sale Data' as ViewType, icon: TableProperties, show: true },
    { name: 'Delivered Data' as ViewType, icon: Truck, show: true },
    { name: 'Debtor List' as ViewType, icon: Users, show: userProfile?.permissions.canViewDebtors },
    { name: 'Payment Received' as ViewType, icon: HandCoins, show: userProfile?.permissions.canViewPayments },
    { name: 'Old Tractor Data' as ViewType, icon: History, show: userProfile?.permissions.canViewOldTractors },
    { name: 'Approvals' as ViewType, icon: ShieldCheck, show: userProfile?.role === 'Admin', badge: sales.filter(s => s.verificationStatus === 'Pending').length + payments.filter(p => p.verificationStatus === 'Pending').length },
    { name: 'Master' as ViewType, icon: Settings, show: userProfile?.permissions.canManageMaster },
    { name: 'Users' as ViewType, icon: ShieldCheck, show: userProfile?.role === 'Admin' },
  ].filter(item => item.show);

  const filteredSales = sales.filter(sale => 
    sale.verificationStatus === 'Approved' && (
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.mobile.includes(searchTerm) ||
      sale.branchManager.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredPayments = payments.filter(payment => 
    payment.verificationStatus === 'Approved' && (
      payment.customerName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      payment.mode.toLowerCase().includes(paymentSearchTerm.toLowerCase())
    )
  );

  const handleExport = (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSale = (id: string) => {
    setSales(sales.filter(s => s.id !== id));
  };

  const handleDelivery = (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (sale?.verificationStatus !== 'Approved') {
      setAuthError('Only approved sales can be marked as delivered.');
      setTimeout(() => setAuthError(''), 3000);
      return;
    }
    setDeliverySaleId(id);
    setDeliveryDateInput(new Date().toISOString().split('T')[0]);
    setIsDeliveryModalOpen(true);
  };

  const confirmDelivery = () => {
    if (!deliverySaleId) return;
    setSales(sales.map(s => s.id === deliverySaleId ? { ...s, status: 'Delivered', deliveryDate: deliveryDateInput } : s));
    setIsDeliveryModalOpen(false);
    setDeliverySaleId(null);
  };

  const renderMasterView = () => {
    const addManager = () => {
      if (!newManager.trim()) return;
      setBranchManagers([...branchManagers, { id: Date.now().toString(), name: newManager }]);
      setNewManager('');
    };

    const addDealPerson = () => {
      if (!newDealPerson.trim()) return;
      setDealPersons([...dealPersons, { id: Date.now().toString(), name: newDealPerson }]);
      setNewDealPerson('');
    };

    const removeManager = (id: string) => setBranchManagers(branchManagers.filter(m => m.id !== id));
    const removeDealPerson = (id: string) => setDealPersons(dealPersons.filter(d => d.id !== id));

    const addFinanceCompany = () => {
      if (!newFinanceCompany.trim()) return;
      setFinanceCompanies([...financeCompanies, { id: Date.now().toString(), name: newFinanceCompany }]);
      setNewFinanceCompany('');
    };

    const removeFinanceCompany = (id: string) => setFinanceCompanies(financeCompanies.filter(f => f.id !== id));

    const addCaseType = () => {
      if (!newCaseType.trim()) return;
      setCaseTypes([...caseTypes, { id: Date.now().toString(), name: newCaseType }]);
      setNewCaseType('');
    };

    const removeCaseType = (id: string) => setCaseTypes(caseTypes.filter(c => c.id !== id));

    const addProduct = () => {
      if (!newProduct.trim()) return;
      setProductsMaster([...productsMaster, { id: Date.now().toString(), name: newProduct, models: [] }]);
      setNewProduct('');
    };

    const addModel = (productId: string) => {
      if (!newModel.name.trim() || newModel.productId !== productId) return;
      setProductsMaster(productsMaster.map(p => 
        p.id === productId 
          ? { ...p, models: [...p.models, { id: Date.now().toString(), name: newModel.name }] }
          : p
      ));
      setNewModel({ productId: '', name: '' });
    };

    const removeProduct = (id: string) => setProductsMaster(productsMaster.filter(p => p.id !== id));
    const removeModel = (productId: string, modelId: string) => {
      setProductsMaster(productsMaster.map(p => 
        p.id === productId 
          ? { ...p, models: p.models.filter(m => m.id !== modelId) }
          : p
      ));
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Master Data Management</h2>
            <p className="text-slate-500">Configure branch managers, deal persons, products, and more.</p>
          </div>
          <button 
            onClick={() => handleExport(productsMaster, 'Master_Products')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Branch Managers Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Branch Managers</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Manager Name" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newManager}
              onChange={(e) => setNewManager(e.target.value)}
            />
            <button 
              onClick={addManager}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {branchManagers.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <span className="text-slate-700 font-medium">{m.name}</span>
                <button 
                  onClick={() => removeManager(m.id)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Deal Persons Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Deal Persons</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Deal Person Name" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newDealPerson}
              onChange={(e) => setNewDealPerson(e.target.value)}
            />
            <button 
              onClick={addDealPerson}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {dealPersons.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <span className="text-slate-700 font-medium">{d.name}</span>
                <button 
                  onClick={() => removeDealPerson(d.id)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Finance Companies Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Finance Companies</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Finance Company" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newFinanceCompany}
              onChange={(e) => setNewFinanceCompany(e.target.value)}
            />
            <button 
              onClick={addFinanceCompany}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {financeCompanies.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <span className="text-slate-700 font-medium">{f.name}</span>
                <button 
                  onClick={() => removeFinanceCompany(f.id)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Case Types Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Case Types</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Case Type (e.g. Cash, Subsidy)" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newCaseType}
              onChange={(e) => setNewCaseType(e.target.value)}
            />
            <button 
              onClick={addCaseType}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {caseTypes.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <span className="text-slate-700 font-medium">{c.name}</span>
                <button 
                  onClick={() => removeCaseType(c.id)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Products & Models Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Products & Models</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Product Name" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
            />
            <button 
              onClick={addProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Product
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsMaster.map(p => (
              <div key={p.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <button onClick={() => removeProduct(p.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {p.models.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100 group">
                      <span className="text-slate-600">{m.name}</span>
                      <button onClick={() => removeModel(p.id, m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1">
                  <input 
                    type="text" 
                    placeholder="New Model" 
                    className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500/20"
                    value={newModel.productId === p.id ? newModel.name : ''}
                    onChange={(e) => setNewModel({ productId: p.id, name: e.target.value })}
                  />
                  <button 
                    onClick={() => addModel(p.id)}
                    className="bg-slate-200 text-slate-600 p-1 rounded hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const handleSaveFollowUp = () => {
    if (!followUpData.saleId) return;

    setSales(sales.map(s => {
      if (s.id === followUpData.saleId) {
        return {
          ...s,
          followUpDate: followUpData.date,
          followUpRemark: followUpData.remark
        };
      }
      return s;
    }));

    setIsFollowUpModalOpen(false);
    setFollowUpData({ saleId: '', date: '', remark: '' });
  };

  const renderDashboard = () => {
    const approvedSales = sales.filter(s => s.verificationStatus === 'Approved');
    const approvedPayments = payments.filter(p => p.verificationStatus === 'Approved');

    const totalSales = approvedSales.reduce((acc, sale) => acc + sale.amount, 0);
    const totalCollection = approvedPayments.reduce((acc, p) => acc + p.amount, 0);
    const cashCollection = approvedPayments.filter(p => p.mode === 'Cash').reduce((acc, p) => acc + p.amount, 0);
    const bankCollection = approvedPayments.filter(p => p.mode === 'Bank').reduce((acc, p) => acc + p.amount, 0);
    
    const today = new Date();
    const overdueSales = approvedSales.filter(s => {
      const balance = s.amount - (s.receivedAmount || 0) - (s.financeReceived || 0);
      if (balance <= 0) return false;
      if (!s.dueDate) return false;
      return new Date(s.dueDate) < today;
    });

    // Old Tractor Stats
    const exchangedTractors = approvedSales.filter(s => s.exchange);
    const soldOldTractors = approvedSales.filter(s => s.isOldTractorSale);
    const oldTractorReceived = approvedPayments.filter(p => {
      const sale = approvedSales.find(s => s.id === p.saleId);
      return sale?.isOldTractorSale;
    }).reduce((acc, p) => acc + p.amount, 0);
    const oldTractorTotalAmount = soldOldTractors.reduce((acc, s) => acc + s.amount, 0);
    const oldTractorBalance = oldTractorTotalAmount - oldTractorReceived;

    const statusData = [
      { name: 'Pending', value: sales.filter(s => s.status === 'Pending').length },
      { name: 'Delivered', value: sales.filter(s => s.status === 'Delivered').length },
      { name: 'Paid', value: sales.filter(s => s.status === 'Paid').length },
    ];
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-end items-center">
          <button 
            onClick={() => handleExport(sales, 'Dashboard_Summary')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Total Sales Amount</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">₹{totalSales.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Total Collection</p>
            <h3 className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">₹{totalCollection.toLocaleString()}</h3>
            <div className="mt-2 flex gap-4 text-[10px] font-bold uppercase">
              <span className="text-slate-400">Cash: <span className="text-slate-600">₹{cashCollection.toLocaleString()}</span></span>
              <span className="text-slate-400">Bank: <span className="text-slate-600">₹{bankCollection.toLocaleString()}</span></span>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowOverdueOnly(true);
              setCurrentView('Debtor List');
            }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-left hover:border-red-300 transition-all group"
          >
            <p className="text-sm font-medium text-slate-500 group-hover:text-red-500 transition-colors">Overdue Payments</p>
            <h3 className="text-xl md:text-2xl font-bold text-red-600 mt-1">{overdueSales.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Click to view overdue list</p>
          </button>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Pending Deliveries</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {sales.filter(s => s.status === 'Pending').length}
            </h3>
          </div>
        </div>

        {/* Old Tractor Stats */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Old Tractor Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Exchanged</p>
              <p className="text-lg font-bold text-slate-900">{exchangedTractors.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Sold</p>
              <p className="text-lg font-bold text-slate-900">{soldOldTractors.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Amount Received</p>
              <p className="text-lg font-bold text-emerald-600">₹{oldTractorReceived.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Balance Amount</p>
              <p className="text-lg font-bold text-red-600">₹{oldTractorBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-semibold mb-4">Sales by Branch Manager</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="branchManager" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-semibold mb-4">Order Status Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSaleData = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-bottom border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customer, manager or mobile..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => handleExport(filteredSales, 'Sales_Data')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
        <button 
          onClick={() => setIsAddSaleModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Sale
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2000px]">
          <thead>
            <tr className="bg-blue-600 text-white border-y border-blue-700">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Branch Manager Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">DEAL PERSON NAME</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Costomer name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Costomer mobile number</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">CUSTOMER ADDRESS</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">PRODUCTS</th>
              {productsMaster.map(p => (
                <th key={p.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{p.name.toUpperCase()} MODAL</th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">CASE</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">FINANCE</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">FINANCE COMPANY</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Deal Amount</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">EXCHANGE</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Exchange Model</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">EXCHANGE AMT</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">REMARK</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">STATUS</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap sticky right-0 bg-blue-600 z-10 border-l border-blue-700 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">{sale.date}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.branchManager}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.dealPerson}</td>
                <td className="px-4 py-4 text-sm font-medium text-slate-900">{sale.customerName}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.mobile}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.address}</td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {sale.selectedProducts?.map(p => p.productName).join(', ') || '-'}
                </td>
                {productsMaster.map(p => {
                  const selected = sale.selectedProducts?.find(sp => sp.productId === p.id);
                  return (
                    <td key={p.id} className="px-4 py-4 text-sm text-slate-700">
                      {selected ? selected.modelName : '-'}
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-sm text-slate-700">{sale.case}</td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    sale.finance ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                  )}>
                    {sale.finance ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.financeCompany}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">₹{sale.amount.toLocaleString()}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.exchange ? 'Yes' : 'No'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.exchangeModel}</td>
                <td className="px-4 py-4 text-sm text-slate-700">₹{sale.exchangeAmount.toLocaleString()}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sale.remark}</td>
                <td className="px-4 py-4 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    sale.status === 'Pending' && "bg-blue-50 text-blue-700",
                    sale.status === 'Delivered' && "bg-emerald-50 text-emerald-700",
                    sale.status === 'Paid' && "bg-amber-50 text-amber-700"
                  )}>
                    {sale.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-100 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        setNewSale(sale);
                        setEditingSaleId(sale.id);
                        setIsAddSaleModalOpen(true);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelivery(sale.id)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                      title="Delivery"
                    >
                      <Truck className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDeliveredData = () => {
    const deliveredSales = filteredSales.filter(s => {
      const isDelivered = s.status === 'Delivered';
      if (!isDelivered) return false;

      const saleDate = new Date(s.date);
      const start = deliveredDateFilter.start ? new Date(deliveredDateFilter.start) : null;
      const end = deliveredDateFilter.end ? new Date(deliveredDateFilter.end) : null;
      
      const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);
      return matchesDate;
    });
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 border-bottom border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customer, manager or mobile..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDeliveredFilterOpen(!isDeliveredFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all",
                  (deliveredDateFilter.start || deliveredDateFilter.end) 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 font-bold" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
                title="Filter by Date"
              >
                <Calendar className="h-4 w-4" />
                {(deliveredDateFilter.start || deliveredDateFilter.end) ? (
                  <span>
                    {deliveredDateFilter.start || '...'} to {deliveredDateFilter.end || '...'}
                  </span>
                ) : (
                  <span className="hidden md:inline">Filter Date</span>
                )}
              </button>

              {isDeliveredFilterOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[280px] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Filter by Date</h4>
                    <button 
                      onClick={() => {
                        setDeliveredDateFilter({ start: '', end: '' });
                        setIsDeliveredFilterOpen(false);
                      }}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={deliveredDateFilter.start}
                        onChange={(e) => setDeliveredDateFilter({...deliveredDateFilter, start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={deliveredDateFilter.end}
                        onChange={(e) => setDeliveredDateFilter({...deliveredDateFilter, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDeliveredFilterOpen(false)}
                    className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleExport(deliveredSales, 'Delivered_Data')}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1800px]">
            <thead>
              <tr className="bg-emerald-600 text-white border-y border-emerald-700">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Sale Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Delivery Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Due Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Branch Manager</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Deal Person</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Mobile</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Products</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Deal Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Received Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Finance Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Finance Received</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Finance Balance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Total Received</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Balance Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap sticky right-0 bg-emerald-600 z-10 border-l border-emerald-700 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveredSales.map((sale) => {
                const financeBalance = (sale.financeAmount || 0) - (sale.financeReceived || 0);
                const totalReceived = (sale.receivedAmount || 0) + (sale.financeReceived || 0);
                const balance = sale.amount - totalReceived;
                
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">{sale.date}</td>
                    <td className="px-4 py-4 text-sm text-emerald-700 font-bold whitespace-nowrap">{sale.deliveryDate || '-'}</td>
                    <td className={cn(
                      "px-4 py-4 text-sm font-bold whitespace-nowrap",
                      sale.dueDate && new Date(sale.dueDate) < new Date() ? "text-red-600" : "text-slate-700"
                    )}>
                      {sale.dueDate || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{sale.branchManager}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{sale.dealPerson}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{sale.customerName}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{sale.mobile}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {sale.selectedProducts?.map(p => p.productName).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">₹{sale.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-emerald-600 font-medium">₹{(sale.receivedAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-medium">₹{(sale.financeAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-medium">₹{(sale.financeReceived || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-amber-600 font-bold">₹{financeBalance.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-emerald-700 font-bold">₹{totalReceived.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-red-600 font-bold">₹{balance.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-100 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            setNewSale(sale);
                            setEditingSaleId(sale.id);
                            setIsAddSaleModalOpen(true);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setNewPayment({
                              ...newPayment,
                              saleId: sale.id,
                              customerName: sale.customerName
                            });
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Receive Payment"
                        >
                          <HandCoins className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const calculateDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const renderDebtorList = () => {
    const today = new Date();
    const deliveredSales = sales.filter(s => s.status === 'Delivered' || s.status === 'Paid').filter(s => {
      if (showOverdueOnly) {
        const balance = s.amount - (s.receivedAmount || 0) - (s.financeReceived || 0);
        if (balance <= 0) return false;
        if (!s.dueDate) return false;
        return new Date(s.dueDate) < today;
      }
      return true;
    });
    
    // Group by Manager
    const managerData = deliveredSales.reduce((acc, sale) => {
      const manager = sale.branchManager;
      if (!acc[manager]) {
        acc[manager] = {
          name: manager,
          totalDeal: 0,
          totalReceived: 0,
          totalFinance: 0,
          totalFinanceReceived: 0,
          count: 0,
          sales: []
        };
      }
      acc[manager].totalDeal += sale.amount;
      acc[manager].totalReceived += (sale.receivedAmount || 0);
      acc[manager].totalFinance += (sale.financeAmount || 0);
      acc[manager].totalFinanceReceived += (sale.financeReceived || 0);
      acc[manager].count += 1;
      acc[manager].sales.push(sale);
      return acc;
    }, {} as Record<string, any>);

    // Group by Deal Person
    const dealPersonData = deliveredSales.reduce((acc, sale) => {
      const person = sale.dealPerson;
      if (!acc[person]) {
        acc[person] = {
          name: person,
          totalDeal: 0,
          totalReceived: 0,
          totalFinance: 0,
          totalFinanceReceived: 0,
          count: 0,
          sales: []
        };
      }
      acc[person].totalDeal += sale.amount;
      acc[person].totalReceived += (sale.receivedAmount || 0);
      acc[person].totalFinance += (sale.financeAmount || 0);
      acc[person].totalFinanceReceived += (sale.financeReceived || 0);
      acc[person].count += 1;
      acc[person].sales.push(sale);
      return acc;
    }, {} as Record<string, any>);

    if (showOverdueOnly || (selectedDebtorType && selectedDebtorName)) {
      const data = showOverdueOnly ? null : (selectedDebtorType === 'manager' ? managerData[selectedDebtorName] : dealPersonData[selectedDebtorName]);
      const debtorSales = showOverdueOnly ? deliveredSales : data?.sales || [];

      return (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button 
                onClick={() => { 
                  setSelectedDebtorType(null); 
                  setSelectedDebtorName(null); 
                  setShowOverdueOnly(false);
                }}
                className="text-blue-600 font-medium flex items-center gap-1 hover:underline mb-2"
              >
                ← Back to Summary
              </button>
              <h2 className="text-2xl font-bold text-slate-800">
                {showOverdueOnly ? 'Overdue Payments' : `${selectedDebtorType === 'manager' ? 'Manager' : 'Deal Person'}: ${selectedDebtorName}`}
              </h2>
              <p className="text-slate-500">
                {showOverdueOnly ? 'List of all customers with overdue payments.' : `Detailed debtor list for ${selectedDebtorName}.`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleExport(debtorSales, `Debtor_${selectedDebtorName || 'Overdue'}`)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                title="Export to CSV"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {data && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Outstanding</p>
                  <p className="text-xl font-bold text-red-600">
                    ₹{(data.totalDeal - (data.totalReceived + data.totalFinanceReceived)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Mobile</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Products</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Deal Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Received</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Finance Received</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Follow-up</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtorSales.map((sale: Sale) => {
                    const balance = sale.amount - (sale.receivedAmount || 0) - (sale.financeReceived || 0);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">{sale.date}</td>
                        <td className={cn(
                          "px-4 py-4 text-sm font-bold whitespace-nowrap",
                          sale.dueDate && new Date(sale.dueDate) < new Date() ? "text-red-600" : "text-slate-700"
                        )}>
                          {sale.dueDate || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">{sale.customerName}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{sale.mobile}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {sale.selectedProducts?.map(p => p.productName).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">₹{sale.amount.toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm text-emerald-600">₹{(sale.receivedAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm text-blue-600">₹{(sale.financeReceived || 0).toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm text-red-600 font-bold">₹{balance.toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm">
                          {sale.followUpDate ? (
                            <div className="flex flex-col">
                              <span className="text-blue-600 font-bold text-xs">{sale.followUpDate}</span>
                              <span className="text-[10px] text-slate-500 italic truncate max-w-[150px]" title={sale.followUpRemark}>
                                {sale.followUpRemark}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic text-xs">No follow-up</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            sale.status === 'Delivered' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setNewPayment({
                                  ...newPayment,
                                  saleId: sale.id,
                                  customerName: sale.customerName
                                });
                                setIsPaymentModalOpen(true);
                              }}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                              title="Receive Payment"
                            >
                              <HandCoins className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setFollowUpData({
                                  saleId: sale.id,
                                  date: sale.followUpDate || new Date().toISOString().split('T')[0],
                                  remark: sale.followUpRemark || ''
                                });
                                setIsFollowUpModalOpen(true);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              title="Set Follow-up"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    const renderBox = (title: string, data: any[], type: 'manager' | 'person', icon: any) => (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
          {React.createElement(icon, { className: "h-5 w-5 text-blue-600" })}
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.map((item, idx) => {
            const balance = item.totalDeal - (item.totalReceived + item.totalFinanceReceived);
            return (
              <button 
                key={idx}
                onClick={() => { setSelectedDebtorType(type); setSelectedDebtorName(item.name); }}
                className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 group-hover:text-blue-700">{item.name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Sales Count</p>
                    <p className="text-sm font-bold text-slate-700">{item.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</p>
                    <p className="text-sm font-bold text-red-600">₹{balance.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {data.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
              No delivered data available.
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="animate-in fade-in duration-500">
        <div className="mb-6 flex justify-end items-center">
          <button 
            onClick={() => handleExport(deliveredSales, 'Debtor_Summary')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {renderBox("Branch Managers", Object.values(managerData), 'manager', Users)}
          {renderBox("Deal Persons", Object.values(dealPersonData), 'person', LayoutDashboard)}
        </div>
      </div>
    );
  };

  const handleReceivePayment = () => {
    if (!newPayment.saleId || !newPayment.amount) return;

    const payment: Payment = {
      ...newPayment as Payment,
      id: Math.random().toString(36).substr(2, 9),
    };

    setPayments([payment, ...payments]);
    
    // Update Sale balance
    setSales(sales.map(s => {
      if (s.id === newPayment.saleId) {
        if (newPayment.type === 'Customer') {
          return { ...s, receivedAmount: (s.receivedAmount || 0) + (newPayment.amount || 0) };
        } else {
          return { ...s, financeReceived: (s.financeReceived || 0) + (newPayment.amount || 0) };
        }
      }
      return s;
    }));

    setIsPaymentModalOpen(false);
    setNewPayment({
      saleId: '',
      customerName: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      mode: 'Cash',
      type: 'Customer',
      remark: ''
    });
  };

  const renderPaymentReceived = () => {
    if (selectedLedgerCustomer) {
      const customerSales = sales.filter(s => s.customerName === selectedLedgerCustomer && s.verificationStatus === 'Approved');
      const customerPayments = payments.filter(p => p.customerName === selectedLedgerCustomer && p.verificationStatus === 'Approved');
      
      const totalSaleAmount = customerSales.reduce((acc, s) => acc + s.amount, 0);
      const totalPaidAmount = customerPayments.reduce((acc, p) => acc + p.amount, 0);
      const balance = totalSaleAmount - totalPaidAmount;

      // Combine sales and payments into a single timeline
      const ledgerEntries = [
        ...customerSales.map(s => ({
          date: s.date,
          description: `Sale: ${s.selectedProducts.map(p => p.productName).join(', ')}`,
          debit: s.amount,
          credit: 0,
          type: 'Sale'
        })),
        ...customerPayments.map(p => ({
          date: p.date,
          description: `Payment: ${p.mode} (${p.type}) ${p.remark ? `- ${p.remark}` : ''}`,
          debit: 0,
          credit: p.amount,
          type: 'Payment'
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => setSelectedLedgerCustomer(null)}
                className="text-blue-600 font-medium flex items-center gap-1 hover:underline mb-2"
              >
                ← Back to Payments
              </button>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Customer Ledger: {selectedLedgerCustomer}</h2>
              <p className="text-slate-500">Complete transaction history for this customer.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Sale</p>
                <p className="text-lg font-bold text-slate-900">₹{totalSaleAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Paid</p>
                <p className="text-lg font-bold text-emerald-600">₹{totalPaidAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Balance</p>
                <p className="text-lg font-bold text-red-600">₹{balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Debit (Sale)</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Credit (Payment)</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  let runningBal = 0;
                  return ledgerEntries.map((entry, idx) => {
                    runningBal += (entry.debit - entry.credit);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-slate-700">{entry.date}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full mr-2",
                            entry.type === 'Sale' ? "bg-blue-500" : "bg-emerald-500"
                          )}></span>
                          {entry.description}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-slate-900">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-emerald-600 font-medium">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-bold text-slate-900">
                          ₹{runningBal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    const filteredPayments = payments.filter(p => p.verificationStatus === 'Approved').filter(p => {
      const matchesSearch = p.customerName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        (p.remark && p.remark.toLowerCase().includes(paymentSearchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      const paymentDate = new Date(p.date);
      const start = paymentDateFilter.start ? new Date(paymentDateFilter.start) : null;
      const end = paymentDateFilter.end ? new Date(paymentDateFilter.end) : null;
      
      const matchesDate = (!start || paymentDate >= start) && (!end || paymentDate <= end);
      return matchesDate;
    });

    // Get unique customers from sales for the ledger search
    const uniqueCustomers: string[] = Array.from(new Set(sales.filter(s => s.verificationStatus === 'Approved').map(s => s.customerName)));
    const searchResults = paymentSearchTerm.length > 0 
      ? uniqueCustomers.filter((c: string) => c.toLowerCase().includes(paymentSearchTerm.toLowerCase()))
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <button 
                onClick={() => setIsPaymentFilterOpen(!isPaymentFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all",
                  (paymentDateFilter.start || paymentDateFilter.end) 
                    ? "bg-blue-50 border-blue-200 text-blue-600 font-bold" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
                title="Filter by Date"
              >
                <Calendar className="h-4 w-4" />
                {(paymentDateFilter.start || paymentDateFilter.end) ? (
                  <span>
                    {paymentDateFilter.start || '...'} to {paymentDateFilter.end || '...'}
                  </span>
                ) : (
                  <span className="hidden md:inline">Filter Date</span>
                )}
              </button>

              {isPaymentFilterOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[280px] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Filter by Date</h4>
                    <button 
                      onClick={() => {
                        setPaymentDateFilter({ start: '', end: '' });
                        setIsPaymentFilterOpen(false);
                      }}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={paymentDateFilter.start}
                        onChange={(e) => setPaymentDateFilter({...paymentDateFilter, start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={paymentDateFilter.end}
                        onChange={(e) => setPaymentDateFilter({...paymentDateFilter, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPaymentFilterOpen(false)}
                    className="w-full mt-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleExport(payments, 'Payments_Received')}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customer for ledger..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((customer, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedLedgerCustomer(customer);
                        setPaymentSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                    >
                      <span className="font-medium text-slate-700 group-hover:text-blue-700">{customer}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase font-bold">View Ledger</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Receive Payment
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Mode</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Remark</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-700">{payment.date}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900">{payment.customerName}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        payment.type === 'Customer' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      )}>
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{payment.mode}</td>
                    <td className="px-4 py-4 text-sm font-bold text-emerald-600">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 italic">{payment.remark || '-'}</td>
                    <td className="px-4 py-4 text-sm">
                      <button 
                        onClick={() => setSelectedLedgerCustomer(payment.customerName)}
                        className="text-blue-600 hover:underline font-medium text-xs"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOldTractorData = () => {
    const oldTractorSales = sales.filter(s => (s.exchange || s.isOldTractorSale) && s.verificationStatus === 'Approved').filter(sale => {
      const matchesSearch = 
        sale.customerName.toLowerCase().includes(oldTractorSearchTerm.toLowerCase()) ||
        sale.exchangeModel.toLowerCase().includes(oldTractorSearchTerm.toLowerCase()) ||
        sale.branchManager.toLowerCase().includes(oldTractorSearchTerm.toLowerCase());
      
      const saleDate = new Date(sale.date);
      const start = oldTractorDateFilter.start ? new Date(oldTractorDateFilter.start) : null;
      const end = oldTractorDateFilter.end ? new Date(oldTractorDateFilter.end) : null;
      
      const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);
      
      return matchesSearch && matchesDate;
    });

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search old tractor data..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={oldTractorSearchTerm}
                onChange={(e) => setOldTractorSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsOldTractorFilterOpen(!isOldTractorFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all",
                  (oldTractorDateFilter.start || oldTractorDateFilter.end) 
                    ? "bg-blue-50 border-blue-200 text-blue-600 font-bold" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
                title="Filter by Date"
              >
                <Calendar className="h-4 w-4" />
                {(oldTractorDateFilter.start || oldTractorDateFilter.end) ? (
                  <span>
                    {oldTractorDateFilter.start || '...'} to {oldTractorDateFilter.end || '...'}
                  </span>
                ) : (
                  <span className="hidden md:inline">Filter Date</span>
                )}
              </button>

              {isOldTractorFilterOpen && (
                <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[280px] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Filter by Date</h4>
                    <button 
                      onClick={() => {
                        setOldTractorDateFilter({ start: '', end: '' });
                        setIsOldTractorFilterOpen(false);
                      }}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={oldTractorDateFilter.start}
                        onChange={(e) => setOldTractorDateFilter({...oldTractorDateFilter, start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                      <input 
                        type="date" 
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={oldTractorDateFilter.end}
                        onChange={(e) => setOldTractorDateFilter({...oldTractorDateFilter, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsOldTractorFilterOpen(false)}
                    className="w-full mt-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsOldTractorModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" />
              Add Old Tractor
            </button>
            <button 
              onClick={() => handleExport(oldTractorSales, 'Old_Tractor_Data')}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Manager Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Deal Person Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Old Model</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount Received</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Balance Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Remark</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky right-0 bg-slate-800 z-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {oldTractorSales.map((sale) => {
                  const saleAmount = sale.isOldTractorSale ? sale.amount : sale.exchangeAmount;
                  const received = payments
                    .filter(p => p.saleId === sale.id)
                    .reduce((sum, p) => sum + p.amount, 0);
                  const balance = saleAmount - received;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-700">{sale.date}</td>
                      <td className={cn(
                        "px-4 py-4 text-sm font-bold whitespace-nowrap",
                        sale.dueDate && new Date(sale.dueDate) < new Date() ? "text-red-600" : "text-slate-700"
                      )}>
                        {sale.dueDate || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{sale.branchManager}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{sale.dealPerson}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">{sale.customerName}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 font-medium">{sale.exchangeModel}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">₹{saleAmount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-bold text-emerald-600">₹{received.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-bold text-red-600">₹{balance.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-slate-500 italic">{sale.remark || '-'}</td>
                      <td className="px-4 py-4 text-sm sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-100 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                        <button 
                          onClick={() => {
                            setNewPayment({
                              ...newPayment,
                              saleId: sale.id,
                              customerName: sale.customerName,
                              amount: balance,
                              type: 'Customer'
                            });
                            setIsPaymentModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold"
                        >
                          <HandCoins className="h-3.5 w-3.5" />
                          Collect
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {oldTractorSales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400 italic">No old tractor data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersView = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">User Management</h3>
          <button 
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsers.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{u.name}</h4>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <div className={cn(
                  "ml-auto px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                  u.role === 'Admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                )}>
                  {u.role}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permissions</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(u.permissions).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => togglePermission(u.id, key as keyof UserProfile['permissions'])}
                      disabled={u.role === 'Admin'}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-medium transition-all border",
                        value 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-slate-50 border-slate-100 text-slate-400"
                      )}
                    >
                      {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        value ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderApprovalsView = () => {
    const pendingSales = sales.filter(s => s.verificationStatus === 'Pending');
    const pendingPayments = payments.filter(p => p.verificationStatus === 'Pending');

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-blue-600" />
            Pending Sales ({pendingSales.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {pendingSales.map(sale => (
              <div key={sale.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{sale.isOldTractorSale ? 'Old Tractor' : 'New Sale'}</span>
                    <span className="text-xs text-slate-400">{sale.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{sale.customerName}</h4>
                  <p className="text-xs text-slate-500">{sale.branchManager} • ₹{sale.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      if (sale.isOldTractorSale) {
                        setNewOldTractorSale(sale);
                        setIsOldTractorModalOpen(true);
                      } else {
                        setNewSale(sale);
                        setEditingSaleId(sale.id);
                        setIsAddSaleModalOpen(true);
                      }
                    }}
                    className="flex-1 md:flex-none px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleReject('Sale', sale.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove('Sale', sale.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {pendingSales.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No pending sales to verify.</p>}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-emerald-600" />
            Pending Payments ({pendingPayments.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {pendingPayments.map(payment => (
              <div key={payment.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">{payment.mode}</span>
                    <span className="text-xs text-slate-400">{payment.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{payment.customerName}</h4>
                  <p className="text-xs text-slate-500">Amount: ₹{payment.amount.toLocaleString()} • {payment.type}</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleReject('Payment', payment.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove('Payment', payment.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">No pending payments to verify.</p>}
          </div>
        </section>
      </div>
    );
  };

  const renderLandingPage = () => {
    return (
      <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-blue-600 selection:text-white">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter">SALES MS</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-500">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
            </div>
            <button 
              onClick={() => setShowLogin(true)}
              className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-all shadow-xl shadow-black/10"
            >
              GET STARTED
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3" />
                Trusted by 500+ Dealers
              </div>
              <h1 className="text-7xl md:text-8xl font-black leading-[0.88] tracking-tighter">
                MANAGE SALES <br />
                <span className="text-blue-600">WITH PRECISION.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                The ultimate management system for agricultural equipment dealers. Track sales, verify payments, and manage inventory with ease.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 group"
                >
                  START FREE TRIAL
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      className="h-12 w-12 rounded-full border-4 border-[#f5f5f4] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                  <div className="h-12 w-12 rounded-full border-4 border-[#f5f5f4] bg-slate-200 flex items-center justify-center text-xs font-bold">
                    +2k
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-700" />
              <div className="relative bg-white p-4 rounded-[2.5rem] shadow-2xl border border-black/5 rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <HandCoins className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Collection</p>
                      <p className="text-2xl font-black">₹45,80,000</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
                          <div>
                            <div className="h-2 w-20 bg-slate-200 rounded" />
                            <div className="h-1.5 w-12 bg-slate-100 rounded mt-1" />
                          </div>
                        </div>
                        <div className="h-2 w-10 bg-emerald-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black tracking-tighter">POWERFUL FEATURES.</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Everything you need to run your dealership efficiently in one place.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: LayoutDashboard, title: "Real-time Dashboard", desc: "Get a bird's eye view of your entire sales operation instantly." },
                { icon: ShieldCheck, title: "Admin Verification", desc: "Ensure data accuracy with a robust multi-level approval system." },
                { icon: Wallet, title: "Payment Tracking", desc: "Monitor collections, pending dues, and finance payouts effortlessly." }
              ].map((f, i) => (
                <div key={i} className="p-10 bg-slate-50 rounded-[2rem] space-y-6 hover:bg-blue-600 hover:text-white transition-all group cursor-default">
                  <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-white/20">
                    <f.icon className="h-8 w-8 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">{f.title}</h3>
                  <p className="text-slate-500 group-hover:text-blue-100 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-6 border-t border-black/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter">SALES MS</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">© 2024 Sales Management System. All rights reserved.</p>
            <div className="flex gap-6 text-sm font-bold text-slate-500">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard': return renderDashboard();
      case 'Sale Data': return renderSaleData();
      case 'Delivered Data': return renderDeliveredData();
      case 'Debtor List': return renderDebtorList();
      case 'Payment Received': return renderPaymentReceived();
      case 'Old Tractor Data': return renderOldTractorData();
      case 'Master': return renderMasterView();
      case 'Users': return renderUsersView();
      case 'Approvals': return renderApprovalsView();
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading Sales MS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showLogin) {
      return renderLandingPage();
    }
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10">
          <button 
            onClick={() => setShowLogin(false)}
            className="absolute top-4 right-4 h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
          <div className="p-8 bg-blue-600 text-white text-center space-y-2">
            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Sales MS</h1>
            <p className="text-blue-100 text-sm">Agricultural Equipment Management System</p>
          </div>
          
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="p-8 space-y-6">
            <div className="flex border-b border-slate-100 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setAuthError(''); setAuthMessage(''); }}
                className={cn(
                  "flex-1 py-3 text-sm font-bold transition-all",
                  !isSignUp ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setAuthError(''); setAuthMessage(''); }}
                className={cn(
                  "flex-1 py-3 text-sm font-bold transition-all",
                  isSignUp ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Sign Up
              </button>
            </div>

            {(authError || authMessage) && (
              <div className={cn(
                "p-3 border text-xs rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2",
                authError ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
              )}>
                {authError ? <X className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {authError || authMessage}
              </div>
            )}
            
            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <UserIcon className="h-3 w-3" />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Password
                  </label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-center text-xs text-slate-400">
              Contact administrator for account access.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#1e293b] text-white transition-all duration-300 flex flex-col z-40",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold tracking-tight">Sales MS</h1>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-700 rounded-md transition-colors"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setCurrentView(item.name);
                setSelectedDebtorType(null);
                setSelectedDebtorName(null);
                setSelectedLedgerCustomer(null);
                setPaymentSearchTerm('');
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group",
                currentView === item.name 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                currentView === item.name ? "text-white" : "group-hover:text-white"
              )} />
              {isSidebarOpen && <span className="text-xs md:text-sm font-medium flex-1">{item.name}</span>}
              {isSidebarOpen && item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
              {userProfile?.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">{userProfile?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>Home</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">{currentView}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{currentView}</h2>
              <p className="text-slate-500 text-sm mt-1">Manage and monitor your agricultural equipment sales.</p>
            </div>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddUser}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      {isAddSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">{editingSaleId ? 'Edit Sale' : 'Add New Sale'}</h3>
              <button onClick={() => { setIsAddSaleModalOpen(false); setEditingSaleId(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setNewSale({
                          ...newSale, 
                          date: newDate,
                          dueDate: calculateDueDate(newDate)
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.dueDate || calculateDueDate(newSale.date || new Date().toISOString().split('T')[0])}
                      onChange={(e) => setNewSale({...newSale, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Branch Manager</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.branchManager}
                      onChange={(e) => setNewSale({...newSale, branchManager: e.target.value})}
                    >
                      <option value="">Select Manager</option>
                      {branchManagers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Deal Person</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.dealPerson}
                      onChange={(e) => setNewSale({...newSale, dealPerson: e.target.value})}
                    >
                      <option value="">Select Deal Person</option>
                      {dealPersons.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.customerName}
                      onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.mobile}
                      onChange={(e) => setNewSale({...newSale, mobile: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.address}
                      onChange={(e) => setNewSale({...newSale, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Product & Equipment</h4>
                
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase">Select Products & Models</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productsMaster.map(p => {
                      const isSelected = newSale.selectedProducts?.some(sp => sp.productId === p.id);
                      const selectedModelId = newSale.selectedProducts?.find(sp => sp.productId === p.id)?.modelId || '';
                      
                      return (
                        <div key={p.id} className={cn(
                          "p-3 rounded-xl border transition-all",
                          isSelected ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <input 
                              type="checkbox" 
                              id={`prod-${p.id}`}
                              className="h-4 w-4 rounded text-blue-600"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewSale({
                                    ...newSale,
                                    selectedProducts: [
                                      ...(newSale.selectedProducts || []),
                                      { productId: p.id, productName: p.name, modelId: '', modelName: '' }
                                    ]
                                  });
                                } else {
                                  setNewSale({
                                    ...newSale,
                                    selectedProducts: (newSale.selectedProducts || []).filter(sp => sp.productId !== p.id)
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`prod-${p.id}`} className="text-sm font-bold text-slate-700">{p.name}</label>
                          </div>
                          
                          {isSelected && (
                            <select 
                              className="w-full text-xs px-2 py-1.5 border border-blue-200 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={selectedModelId}
                              onChange={(e) => {
                                const model = p.models.find(m => m.id === e.target.value);
                                setNewSale({
                                  ...newSale,
                                  selectedProducts: (newSale.selectedProducts || []).map(sp => 
                                    sp.productId === p.id 
                                      ? { ...sp, modelId: e.target.value, modelName: model?.name || '' }
                                      : sp
                                  )
                                });
                              }}
                            >
                              <option value="">Select Model</option>
                              {p.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Case</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.case}
                      onChange={(e) => setNewSale({...newSale, case: e.target.value})}
                    >
                      <option value="">Select Case Type</option>
                      {caseTypes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Deal Amount (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={newSale.amount}
                      onChange={(e) => setNewSale({...newSale, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              {/* Finance & Deal Info */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Finance & Deal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="finance" className="h-4 w-4 rounded text-blue-600" checked={newSale.finance} onChange={(e) => setNewSale({...newSale, finance: e.target.checked})} />
                      <label htmlFor="finance" className="text-xs font-bold text-slate-600 uppercase">Finance</label>
                    </div>
                    {newSale.finance && (
                      <div className="space-y-4 animate-in slide-in-from-left-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Finance Company</label>
                          <select 
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newSale.financeCompany}
                            onChange={(e) => setNewSale({...newSale, financeCompany: e.target.value})}
                          >
                            <option value="">Select Finance Company</option>
                            {financeCompanies.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Finance Amount (₹)</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newSale.financeAmount}
                            onChange={(e) => setNewSale({...newSale, financeAmount: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Finance Amount Received (₹)</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newSale.financeReceived}
                            onChange={(e) => setNewSale({...newSale, financeReceived: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {editingSaleId && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Received Amount (₹)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={newSale.receivedAmount}
                        onChange={(e) => setNewSale({...newSale, receivedAmount: Number(e.target.value)})}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Exchange Info */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Exchange Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="exchange" className="h-4 w-4 rounded text-blue-600" checked={newSale.exchange} onChange={(e) => setNewSale({...newSale, exchange: e.target.checked})} />
                    <label htmlFor="exchange" className="text-xs font-bold text-slate-600 uppercase">Exchange</label>
                  </div>
                  {newSale.exchange && (
                    <>
                      <div className="space-y-1 animate-in slide-in-from-left-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Exchange Model</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                          value={newSale.exchangeModel}
                          onChange={(e) => setNewSale({...newSale, exchangeModel: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1 animate-in slide-in-from-left-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Exchange Amount (₹)</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                          value={newSale.exchangeAmount}
                          onChange={(e) => setNewSale({...newSale, exchangeAmount: Number(e.target.value)})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Remark</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[100px]"
                  value={newSale.remark}
                  onChange={(e) => setNewSale({...newSale, remark: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button 
                onClick={() => { setIsAddSaleModalOpen(false); setEditingSaleId(null); }}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSale}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                {editingSaleId ? 'Update Sale' : 'Save Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-blue-600" />
                Receive Payment
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Sale / Customer</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newPayment.saleId}
                  onChange={(e) => {
                    const sale = sales.find(s => s.id === e.target.value);
                    setNewPayment({
                      ...newPayment,
                      saleId: e.target.value,
                      customerName: sale?.customerName || ''
                    });
                  }}
                >
                  <option value="">Select Sale</option>
                  {sales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.customerName} - {s.branchManager} (₹{(s.amount - (s.receivedAmount || 0) - (s.financeReceived || 0)).toLocaleString()} Bal)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment Type</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value as any})}
                  >
                    <option value="Customer">Customer Payment</option>
                    <option value="Finance">Finance Payment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment Mode</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newPayment.mode}
                    onChange={(e) => setNewPayment({...newPayment, mode: e.target.value as any})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="UPI">UPI / PhonePe</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Remark</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[80px]"
                  value={newPayment.remark}
                  onChange={(e) => setNewPayment({...newPayment, remark: e.target.value})}
                  placeholder="Reference number, bank details, etc."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReceivePayment}
                disabled={!newPayment.saleId || !newPayment.amount}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Confirm Delivery</h3>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <p className="text-center text-slate-600">Please select the delivery date for this product.</p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Delivery Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={deliveryDateInput}
                  onChange={(e) => setDeliveryDateInput(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setIsDeliveryModalOpen(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelivery}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Old Tractor Modal */}
      {isOldTractorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">Add Old Tractor Sale</h3>
              <button onClick={() => setIsOldTractorModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setNewOldTractorSale({
                      ...newOldTractorSale, 
                      date: newDate,
                      dueDate: calculateDueDate(newDate)
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.dueDate || calculateDueDate(newOldTractorSale.date || new Date().toISOString().split('T')[0])}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, dueDate: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Branch Manager</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.branchManager}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, branchManager: e.target.value})}
                >
                  <option value="">Select Manager</option>
                  {branchManagers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Deal Person</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.dealPerson}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, dealPerson: e.target.value})}
                >
                  <option value="">Select Deal Person</option>
                  {dealPersons.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.customerName}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, customerName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.mobile}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, mobile: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.address}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, address: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Old Tractor Model</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.exchangeModel}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, exchangeModel: e.target.value})}
                  placeholder="e.g. Mahindra 575 (2018)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Sale Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={newOldTractorSale.amount}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, amount: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Remark</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[80px]"
                  value={newOldTractorSale.remark}
                  onChange={(e) => setNewOldTractorSale({...newOldTractorSale, remark: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button 
                onClick={() => setIsOldTractorModalOpen(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOldTractorSale}
                disabled={!newOldTractorSale.customerName || !newOldTractorSale.amount || !newOldTractorSale.exchangeModel}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Old Tractor Sale
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Follow-up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-800">Set Payment Follow-up</h3>
              </div>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Follow-up Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={followUpData.date}
                  onChange={(e) => setFollowUpData({...followUpData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Follow-up Remark</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[100px]"
                  value={followUpData.remark}
                  onChange={(e) => setFollowUpData({...followUpData, remark: e.target.value})}
                  placeholder="e.g. Promised to pay by next Monday via Bank Transfer"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFollowUp}
                disabled={!followUpData.date}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                Save Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
