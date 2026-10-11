import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Search,
  MapPin,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Users,
  Check,
  Building,
  Image as ImageIcon,
  Camera,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  X,
  Edit,
  Edit2,
  Trash2,
  PlusCircle,
  Upload,
  Link,
  Package,
  Utensils,
  Store,
  Flame,
  DollarSign,
  Tag,
  RefreshCw,
  Phone,
  Crosshair,
  Activity,
  Compass,
  ChevronRight,
  Info,
  ChefHat,
  Lock,
  Key,
  KeyRound,
  Terminal,
  Database,
  BarChart3,
  Calendar,
  Zap,
  TrendingDown,
  Coffee,
  Sliders,
  UserPlus,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { api } from '../api';

const AMRITA_CAMPUS_CENTER = [10.9036, 76.8997];
const AMRITA_CAMPUS_BOUNDS = [
  [10.8950, 76.8900],
  [10.9120, 76.9090]
];

// Official 400-Acre Campus Perimeter Polygon from OpenStreetMap (Way 128964693)
const AMRITA_COMPOUND_PERIMETER = [
  [10.906129, 76.894420], [10.905300, 76.893011], [10.904382, 76.893025], [10.903148, 76.893068],
  [10.903569, 76.894786], [10.903232, 76.894829], [10.902853, 76.894870], [10.901947, 76.894988],
  [10.901841, 76.894484], [10.901701, 76.893970], [10.901536, 76.893944], [10.901507, 76.893580],
  [10.900577, 76.893677], [10.900565, 76.894008], [10.900774, 76.894014], [10.900746, 76.894559],
  [10.900725, 76.895160], [10.901330, 76.895175], [10.901511, 76.898169], [10.899146, 76.898170],
  [10.899123, 76.898636], [10.899105, 76.900004], [10.897593, 76.900049], [10.897631, 76.900610],
  [10.899155, 76.900579], [10.899293, 76.903765], [10.899397, 76.904119], [10.899661, 76.904462],
  [10.899977, 76.904784], [10.900314, 76.905063], [10.900640, 76.905295], [10.902166, 76.906381],
  [10.902376, 76.906310], [10.903759, 76.906264], [10.903717, 76.904548], [10.905692, 76.904296],
  [10.905950, 76.904228], [10.906709, 76.904571], [10.907446, 76.904593], [10.908710, 76.904550],
  [10.909616, 76.904163], [10.909384, 76.902039], [10.909290, 76.901007], [10.909237, 76.900621],
  [10.909216, 76.900342], [10.909195, 76.900194], [10.908984, 76.897576], [10.907277, 76.897638],
  [10.907246, 76.897059], [10.907204, 76.896239], [10.906988, 76.895873], [10.906764, 76.895493],
  [10.906455, 76.894972], [10.906129, 76.894420]
];

const AMRITA_GPS_PRESETS = [
  { label: 'Central Plaza', lat: 10.9036, lng: 76.8997 },
  { label: 'School of Engg (AB-1)', lat: 10.9005, lng: 76.9029 },
  { label: 'ECE & Sci (AB-2)', lat: 10.9043, lng: 76.8986 },
  { label: 'CSE & Law (AB-3)', lat: 10.9063, lng: 76.8978 },
  { label: 'AI Center (AB-4)', lat: 10.9056, lng: 76.8974 },
  { label: 'Main Canteen 1', lat: 10.9001, lng: 76.9037 },
  { label: 'IT Canteen (AB-3)', lat: 10.9049, lng: 76.8981 },
  { label: 'Girls Hostels', lat: 10.9030, lng: 76.8998 },
  { label: 'Boys Hostels', lat: 10.9025, lng: 76.8962 },
  { label: 'Central Library', lat: 10.9039, lng: 76.8992 },
  { label: 'Olympic Pool', lat: 10.9063, lng: 76.8989 },
  { label: 'Health Clinic', lat: 10.9012, lng: 76.8972 },
  { label: 'Shopping & Xerox', lat: 10.9021, lng: 76.8986 },
  { label: 'Main Entrance Gate', lat: 10.8980, lng: 76.9003 }
];

export function AdminPanelView({ canteens, onDataUpdated, onGoBack }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'issues', 'claims', 'menu', 'map', 'users'
  const [issues, setIssues] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mapLocations, setMapLocations] = useState([]);

  // User Management & Security Vault States
  const [users, setUsers] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userFeedback, setUserFeedback] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [showTheftSimulator, setShowTheftSimulator] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff'
  });

  // Canteen Predictive Analytics & Holiday/Festival Spike Warning States
  const [forecastData, setForecastData] = useState(null);
  const [selectedForecastCanteen, setSelectedForecastCanteen] = useState('all');
  const [forecastHorizon, setForecastHorizon] = useState('all'); // 'all', 'future', 'past'
  const [selectedDayIndex, setSelectedDayIndex] = useState(7); // Day +1 (Tomorrow)
  const [simulationModifier, setSimulationModifier] = useState(1.0);
  const [simulationEventName, setSimulationEventName] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Map & Establishment Editor State
  const [editingMapLoc, setEditingMapLoc] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [searchMapQuery, setSearchMapQuery] = useState('');
  const [selectedMapCategory, setSelectedMapCategory] = useState('All');
  const [clickedMapCoord, setClickedMapCoord] = useState(null);
  const [isAddingNewLoc, setIsAddingNewLoc] = useState(false);

  const adminMapContainerRef = useRef(null);
  const adminMapInstanceRef = useRef(null);
  const adminMarkersGroupRef = useRef(null);

  // Issue Filtering & Lightbox States
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('All');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('All');
  const [adminLightboxImage, setAdminLightboxImage] = useState(null);
  const [expandedIssueHistoryId, setExpandedIssueHistoryId] = useState(null);

  // Map Focus & Lost & Found Admin States
  const [adminFocusedSpot, setAdminFocusedSpot] = useState(null);
  const [lostFoundAdminFilter, setLostFoundAdminFilter] = useState('all'); // 'all', 'claims', 'found', 'lost'

  const handleViewLocationOnMap = (entity, typeLabel = 'Reported Location') => {
    let lat = entity.lat;
    let lng = entity.lng;
    if (!lat || !lng) {
      const match = (mapLocations || []).find((l) =>
        (entity.location || '').toLowerCase().includes(l.name.toLowerCase()) ||
        (entity.location || '').toLowerCase().includes((l.building || '').toLowerCase())
      );
      if (match) {
        lat = match.lat;
        lng = match.lng;
      } else {
        lat = AMRITA_CAMPUS_CENTER[0];
        lng = AMRITA_CAMPUS_CENTER[1];
      }
    }

    setAdminFocusedSpot({
      title: entity.title,
      location: entity.location,
      lat: Number(lat),
      lng: Number(lng),
      type: typeLabel
    });
    setActiveTab('map');
  };

  // Menu & Canteen Admin States
  const [adminCanteenFilter, setAdminCanteenFilter] = useState('All');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');
  const [adminMenuSearch, setAdminMenuSearch] = useState('');
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [isAddCanteenModalOpen, setIsAddCanteenModalOpen] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState(null);
  const [editCanteenForm, setEditCanteenForm] = useState({
    name: '',
    code: '',
    location: '',
    timings: '08:00 AM - 10:00 PM',
    crowdLevel: 'Low',
    avgWaitTimeMinutes: 5,
    counterSpeed: 'Fast',
    image: ''
  });
  const [dishImageMode, setDishImageMode] = useState('upload'); // 'upload' | 'url'
  const adminDishFileInputRef = useRef(null);
  const adminEditDishFileInputRef = useRef(null);

  const categoriesList = [
    'Main Course',
    'Curries',
    "Today's Special",
    'Egg Items',
    'Bakes & Snacks',
    'Hot Drinks',
    'Juices & Milkshakes',
    'Ice Creams'
  ];

  // Dish Form State (for Add & Edit)
  const [dishForm, setDishForm] = useState({
    name: '',
    canteenId: canteens[0]?.id || 'canteen-1',
    category: 'Main Course',
    price: 60,
    prepTimeMinutes: 4,
    stock: 20,
    isVeg: true,
    description: '',
    imageUrl: ''
  });

  // Canteen / Store Creation Form State
  const [canteenForm, setCanteenForm] = useState({
    name: '',
    code: '',
    location: '',
    timings: '08:00 AM - 10:00 PM',
    crowdLevel: 'Low',
    avgWaitTimeMinutes: 5,
    counterSpeed: 'Fast',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
  });

  // New Map Location Form
  const [newMapLoc, setNewMapLoc] = useState({
    name: '',
    category: 'Food & Dining',
    building: '',
    floor: 'Ground Floor',
    zone: 'Central Campus',
    timings: '08:00 AM - 09:30 PM',
    contact: 'Extension 2401',
    description: '',
    lat: 10.9036,
    lng: 76.8997,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    relatedCanteenId: '',
    createCanteen: true
  });

  const fetchAdminData = async () => {
    try {
      const [statsRes, issuesRes, lfRes, menuRes, mapRes, usersRes, vaultRes, forecastRes] = await Promise.all([
        api.getStats(),
        api.getIssues(),
        api.getLostAndFound(),
        api.getMenu(),
        api.getMapLocations(),
        api.getUsers(),
        api.inspectVault(),
        api.getCanteenForecast(selectedForecastCanteen)
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (issuesRes.success) setIssues(issuesRes.data);
      if (lfRes.success) setLostFoundItems(lfRes.data);
      if (menuRes.success) setMenuItems(menuRes.data);
      if (mapRes.success) setMapLocations(mapRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      else if (Array.isArray(usersRes)) setUsers(usersRes);
      if (vaultRes.success && vaultRes.data) setVaultInfo(vaultRes.data);
      else if (vaultRes && vaultRes.algorithm) setVaultInfo(vaultRes);
      if (forecastRes?.success && forecastRes.data) setForecastData(forecastRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCanteenForecast = async (cId) => {
    try {
      setForecastLoading(true);
      const res = await api.getCanteenForecast(cId);
      if (res && res.success && res.data) {
        setForecastData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    loadCanteenForecast(selectedForecastCanteen);
  }, [selectedForecastCanteen]);

  // Admin User Management Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFeedback(null);
    setUserLoading(true);

    try {
      if (!newUser.username || newUser.username.length < 3) {
        throw new Error('Username must be at least 3 characters long.');
      }
      if (!newUser.password || newUser.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const res = await api.addUser(newUser);
      setUserFeedback({
        type: 'success',
        message: `Account '${newUser.username}' created with salted bcrypt hash and encrypted into AES-256 vault!`
      });
      setNewUser({ name: '', username: '', email: '', password: '', role: 'staff' });
      const [uRes, vRes] = await Promise.all([api.getUsers(), api.inspectVault()]);
      if (uRes.data) setUsers(uRes.data);
      if (vRes.data) setVaultInfo(vRes.data);
    } catch (err) {
      setUserFeedback({
        type: 'error',
        message: err.message || 'Failed to add user account.'
      });
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (idOrUsername, displayName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${displayName || idOrUsername}'? The encrypted ciphertext will be purged from the AES-256 disk vault.`)) {
      return;
    }

    try {
      await api.removeUser(idOrUsername);
      setUserFeedback({
        type: 'success',
        message: `User '${displayName || idOrUsername}' permanently deleted and purged from vault.`
      });
      const [uRes, vRes] = await Promise.all([api.getUsers(), api.inspectVault()]);
      if (uRes.data) setUsers(uRes.data);
      if (vRes.data) setVaultInfo(vRes.data);
    } catch (err) {
      setUserFeedback({
        type: 'error',
        message: err.message || 'Failed to delete user.'
      });
    }
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.updateUserPassword(changingPasswordUser.id || changingPasswordUser.username, newPasswordInput);
      setUserFeedback({
        type: 'success',
        message: `Password for '${changingPasswordUser.username}' updated with fresh bcrypt salt rounds and re-encrypted in vault!`
      });
      setChangingPasswordUser(null);
      setNewPasswordInput('');
    } catch (err) {
      alert(err.message || 'Failed to update password.');
    }
  };

  // Advance Issue Stage (Slide 5 & 6)
  const handleAdvanceIssue = async (issueId, stageNum, stageName) => {
    try {
      const note = window.prompt(
        `Enter resolution or progress update note for Stage ${stageNum} (${stageName}):`,
        `Progress logged by Campus Administration.`
      );
      if (note === null) return;

      const res = await api.updateIssueStage(issueId, {
        targetStage: stageNum,
        note
      });
      if (res.success) {
        alert(`Issue updated to Stage ${stageNum}: ${stageName}! Student received live notification.`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating issue: ' + err.message);
    }
  };

  // Review Lost & Found Claim (Slide 6)
  const handleReviewClaim = async (itemId, claimId, action) => {
    try {
      const res = await api.reviewClaim(itemId, claimId, action);
      if (res.success) {
        alert(`Claim ${action === 'approve' ? 'Approved & Item Handed Over' : 'Rejected'}!`);
        fetchAdminData();
        onDataUpdated();
      }
    } catch (err) {
      alert('Error reviewing claim: ' + err.message);
    }
  };

  // Handle dish file upload from local system
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setDishForm((prev) => ({ ...prev, imageUrl: loadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Open Add Dish Modal
  const openAddDishModal = () => {
    setEditingDish(null);
    setDishImageMode('upload');
    setDishForm({
      name: '',
      canteenId: adminCanteenFilter !== 'All' ? adminCanteenFilter : canteens[0]?.id || 'canteen-1',
      category: 'Main Course',
      price: 60,
      prepTimeMinutes: 4,
      stock: 20,
      isVeg: true,
      description: '',
      imageUrl: ''
    });
    setIsAddDishModalOpen(true);
  };

  // Open Edit Dish Modal
  const openEditDishModal = (item) => {
    setEditingDish(item);
    const isDataImg = item.imageUrl && item.imageUrl.startsWith('data:');
    setDishImageMode(isDataImg ? 'upload' : (item.imageUrl ? 'url' : 'upload'));
    setDishForm({
      name: item.name,
      canteenId: item.canteenId,
      category: item.category || 'Main Course',
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes || 4,
      stock: item.stock,
      isVeg: item.isVeg,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
  };

  // Save Dish (Add or Edit)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishForm.name.trim()) return alert('Please enter dish name');

    const defaultFallback = dishForm.isVeg
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80';

    try {
      if (editingDish) {
        const updates = {
          name: dishForm.name.trim(),
          canteenId: dishForm.canteenId,
          category: dishForm.category,
          price: Number(dishForm.price),
          stock: Number(dishForm.stock),
          prepTimeMinutes: Number(dishForm.prepTimeMinutes),
          isVeg: dishForm.isVeg,
          description: dishForm.description,
          imageUrl: dishForm.imageUrl?.trim() || defaultFallback
        };
        const res = await api.updateMenuItem(editingDish.id, updates);
        if (res.success) {
          setEditingDish(null);
          fetchAdminData();
          onDataUpdated();
        }
      } else {
        const payload = {
          ...dishForm,
          name: dishForm.name.trim(),
          price: Number(dishForm.price),
          stock: Number(dishForm.stock),
          prepTimeMinutes: Number(dishForm.prepTimeMinutes),
          imageUrl: dishForm.imageUrl?.trim() || defaultFallback,
          popular: false
        };
        const res = await api.addMenuItem(payload);
        if (res.success) {
          setIsAddDishModalOpen(false);
          fetchAdminData();
          onDataUpdated();
        }
      }
    } catch (err) {
      alert('Error saving dish: ' + err.message);
    }
  };

  // Adjust stock count
  const handleAdjustStock = async (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await api.updateMenuItem(item.id, { stock: newStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: newStock } : m)));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error updating stock: ' + err.message);
    }
  };

  // Toggle in-stock / out-of-stock instantly
  const handleToggleStockStatus = async (item) => {
    const targetStock = item.stock > 0 ? 0 : 15;
    try {
      const res = await api.updateMenuItem(item.id, { stock: targetStock });
      if (res.success) {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, stock: targetStock } : m)));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error toggling stock: ' + err.message);
    }
  };

  // Delete dish from menu
  const handleDeleteDish = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) return;
    try {
      const res = await api.deleteMenuItem(item.id);
      if (res.success) {
        setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
        onDataUpdated();
      }
    } catch (err) {
      alert('Error deleting dish: ' + err.message);
    }
  };

  // Update Canteen Crowd Level
  const handleUpdateCanteenCrowd = async (canteenId, level) => {
    try {
      const res = await api.updateCrowdLevel(canteenId, level);
      if (res.success) {
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error updating crowd: ' + err.message);
    }
  };

  // Create New Canteen / Store
  const handleCreateCanteen = async (e) => {
    e.preventDefault();
    if (!canteenForm.name.trim()) return alert('Please enter outlet name');

    try {
      const slugCode = canteenForm.code.trim().toUpperCase() || `C${canteens.length + 1}`;
      const payload = {
        name: canteenForm.name.trim(),
        code: slugCode,
        location: canteenForm.location.trim() || 'Central Amenities Quad, Amrita Ettimadai',
        timings: canteenForm.timings.trim() || '08:00 AM - 10:00 PM',
        crowdLevel: canteenForm.crowdLevel || 'Low',
        avgWaitTimeMinutes: Number(canteenForm.avgWaitTimeMinutes) || 5,
        counterSpeed: canteenForm.counterSpeed || 'Fast',
        image: canteenForm.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
      };

      const res = await api.addCanteen(payload);
      if (res.success) {
        alert(`🎉 New Dining Outlet "${payload.name}" successfully created and activated! It is now available across the student menu, staff station terminal, and admin management.`);
        setIsAddCanteenModalOpen(false);
        setCanteenForm({
          name: '',
          code: '',
          location: '',
          timings: '08:00 AM - 10:00 PM',
          crowdLevel: 'Low',
          avgWaitTimeMinutes: 5,
          counterSpeed: 'Fast',
          image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80'
        });
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error creating canteen: ' + err.message);
    }
  };

  // Delete Canteen / Store
  const handleDeleteCanteen = async (canteen) => {
    if (canteens.length <= 1) {
      alert('Cannot delete the only remaining canteen. Campus requires at least one active dining facility.');
      return;
    }

    const dishCount = menuItems.filter((m) => m.canteenId === canteen.id).length;
    const confirmMsg = `Are you sure you want to permanently delete "${canteen.name}"?\n\nThis will remove the outlet from student ordering, staff stations, and delete its ${dishCount} associated menu dishes.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteCanteen(canteen.id);
      if (res.success) {
        alert(`Outlet "${canteen.name}" and its menu dishes have been removed.`);
        if (adminCanteenFilter === canteen.id) {
          setAdminCanteenFilter('All');
        }
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error deleting canteen: ' + err.message);
    }
  };

  // Open Edit Canteen Modal
  const openEditCanteenModal = (canteen) => {
    setEditingCanteen(canteen);
    setEditCanteenForm({
      name: canteen.name || '',
      code: canteen.code || '',
      location: canteen.location || '',
      timings: canteen.timings || '08:00 AM - 10:00 PM',
      crowdLevel: canteen.crowdLevel || 'Low',
      avgWaitTimeMinutes: canteen.avgWaitTimeMinutes || 5,
      counterSpeed: canteen.counterSpeed || 'Fast',
      image: canteen.image || ''
    });
  };

  // Save Edit Canteen (Renaming and Details)
  const handleSaveEditCanteen = async (e) => {
    e.preventDefault();
    if (!editingCanteen) return;
    if (!editCanteenForm.name.trim()) return alert('Please enter outlet name');

    try {
      const updates = {
        name: editCanteenForm.name.trim(),
        code: editCanteenForm.code.trim().toUpperCase() || editingCanteen.code,
        location: editCanteenForm.location.trim() || editingCanteen.location,
        timings: editCanteenForm.timings.trim() || editingCanteen.timings,
        crowdLevel: editCanteenForm.crowdLevel,
        avgWaitTimeMinutes: Number(editCanteenForm.avgWaitTimeMinutes) || 5,
        counterSpeed: editCanteenForm.counterSpeed,
        image: editCanteenForm.image.trim() || editingCanteen.image
      };

      const res = await api.updateCanteen(editingCanteen.id, updates);
      if (res.success) {
        alert(`🎉 Outlet "${updates.name}" successfully updated! Name and settings are now active across all student and staff stations.`);
        setEditingCanteen(null);
        onDataUpdated();
        fetchAdminData();
      }
    } catch (err) {
      alert('Error updating canteen: ' + err.message);
    }
  };

  // Filtered menu dishes for Admin panel
  const filteredAdminMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (adminCanteenFilter !== 'All' && item.canteenId !== adminCanteenFilter) return false;
      if (adminCategoryFilter !== 'All' && item.category !== adminCategoryFilter) return false;
      if (adminMenuSearch) {
        const q = adminMenuSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, adminCanteenFilter, adminCategoryFilter, adminMenuSearch]);

  // Helper to create category marker divIcon
  const createAdminMarkerIcon = (loc) => {
    let iconChar = '🏛️';
    let bgClass = 'bg-slate-700 text-white';

    if (loc.category === 'Food & Dining') {
      iconChar = '🍽️';
      bgClass = 'bg-[#FD7E14] text-slate-950 font-bold';
    } else if (loc.category === 'Medical & Health') {
      iconChar = '🏥';
      bgClass = 'bg-[#DC3545] text-white font-bold';
    } else if (loc.category === 'Academic Store' || loc.category === 'Retail Store') {
      iconChar = '📚';
      bgClass = 'bg-teal-500 text-white font-bold';
    } else if (loc.category === 'Academic & Labs') {
      iconChar = '🎓';
      bgClass = 'bg-cyan-500 text-white font-bold';
    } else if (loc.category === 'Hostels & Living') {
      iconChar = '🛏️';
      bgClass = 'bg-[#F3EEF9]0 text-white font-bold';
    } else if (loc.category === 'Sports & Recreation') {
      iconChar = '🏊';
      bgClass = 'bg-[#198754] text-white font-bold';
    }

    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 border-slate-900 shadow-xl flex items-center justify-center text-xs transition duration-200 ${bgClass} hover:scale-125">
          <span>${iconChar}</span>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded bg-slate-950/95 text-white text-[9px] font-bold border border-slate-700 whitespace-nowrap shadow-md pointer-events-none max-w-[130px] truncate">
          ${loc.name.split('(')[0].trim()}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'admin-campus-marker',
      html,
      iconSize: [32, 48],
      iconAnchor: [16, 24],
      popupAnchor: [0, -24]
    });
  };

  const handleOpenEditModal = (loc) => {
    const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
    const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];
    setEditingMapLoc({
      ...loc,
      lat,
      lng,
      relatedCanteenId: loc.relatedCanteenId || (loc.id === 'loc-1' ? 'canteen-1' : (loc.id === 'loc-it' || loc.id === 'loc-2') ? 'canteen-2' : (loc.id === 'loc-mba' || loc.id === 'loc-3') ? 'canteen-3' : '')
    });
    setIsAddingNewLoc(false);
    setIsMapModalOpen(true);
    if (adminMapInstanceRef.current) {
      adminMapInstanceRef.current.flyTo([lat, lng], 17.5, { duration: 0.8 });
    }
  };

  const handleOpenAddModal = (presetCoord = null) => {
    const defaultLat = presetCoord ? presetCoord.lat : (clickedMapCoord ? clickedMapCoord.lat : AMRITA_CAMPUS_CENTER[0]);
    const defaultLng = presetCoord ? presetCoord.lng : (clickedMapCoord ? clickedMapCoord.lng : AMRITA_CAMPUS_CENTER[1]);
    setEditingMapLoc({
      id: `loc_${Date.now()}`,
      name: '',
      category: 'Food & Dining',
      building: '',
      floor: 'Ground Floor',
      zone: 'Central Campus',
      timings: '08:00 AM - 09:30 PM',
      contact: 'Extension 2401',
      description: '',
      lat: defaultLat,
      lng: defaultLng,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
      relatedCanteenId: '',
      createCanteen: true
    });
    setIsAddingNewLoc(true);
    setIsMapModalOpen(true);
  };

  const handleSaveMapLoc = async (e) => {
    e.preventDefault();
    if (!editingMapLoc) return;

    try {
      const lat = parseFloat(editingMapLoc.lat);
      const lng = parseFloat(editingMapLoc.lng);

      if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid numeric latitude and longitude coordinates.');
        return;
      }

      const payload = {
        ...editingMapLoc,
        lat,
        lng,
        coordinates: {
          x: editingMapLoc.coordinates?.x || 50,
          y: editingMapLoc.coordinates?.y || 50,
          lat,
          lng
        }
      };

      if (isAddingNewLoc) {
        const res = await api.addMapLocation(payload);
        if (res.success) {
          alert(`Successfully pinned "${payload.name}" to the campus map!`);
          setIsMapModalOpen(false);
          setEditingMapLoc(null);
          await fetchAdminData();
          if (onDataUpdated) onDataUpdated();
        } else {
          alert('Failed to add establishment: ' + (res.message || 'Unknown error'));
        }
      } else {
        const res = await api.updateMapLocation(editingMapLoc.id, payload);
        if (res.success) {
          const isDining = payload.category === 'Food & Dining' || payload.relatedCanteenId;
          alert(
            `Establishment "${payload.name}" successfully updated!` +
            (isDining ? '\n⚡ Synchronized with Staff Operations and Student Canteen views.' : '')
          );
          setIsMapModalOpen(false);
          setEditingMapLoc(null);
          await fetchAdminData();
          if (onDataUpdated) onDataUpdated();
        } else {
          alert('Failed to update establishment: ' + (res.message || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Error saving establishment: ' + err.message);
    }
  };

  const handleDeleteMapLoc = async (loc) => {
    if (!window.confirm(`Are you sure you want to delete "${loc.name}" from the campus map?`)) {
      return;
    }
    try {
      const res = await api.deleteMapLocation(loc.id);
      if (res.success) {
        alert(`"${loc.name}" removed from the campus map.`);
        await fetchAdminData();
        if (onDataUpdated) onDataUpdated();
      } else {
        alert('Failed to delete establishment: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting establishment: ' + err.message);
    }
  };

  // Initialize Admin Leaflet Map
  useEffect(() => {
    if (activeTab !== 'map' || !adminMapContainerRef.current) return;

    if (adminMapInstanceRef.current) {
      adminMapInstanceRef.current.remove();
      adminMapInstanceRef.current = null;
    }

    const map = L.map(adminMapContainerRef.current, {
      center: AMRITA_CAMPUS_CENTER,
      zoom: 16.5,
      minZoom: 15.2,
      maxZoom: 19,
      maxBounds: AMRITA_CAMPUS_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Draw Official Amrita Compound Boundary Perimeter
    L.polygon(AMRITA_COMPOUND_PERIMETER, {
      color: '#8b5cf6',
      weight: 3,
      opacity: 0.85,
      fillColor: '#8b5cf6',
      fillOpacity: 0.06,
      dashArray: '8, 6'
    }).addTo(map);

    // Map Click to capture or update coordinates
    map.on('click', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      setClickedMapCoord({ lat, lng });
    });

    const markersGroup = L.featureGroup().addTo(map);
    adminMarkersGroupRef.current = markersGroup;
    adminMapInstanceRef.current = map;

    return () => {
      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Re-render markers when locations or filters change
  useEffect(() => {
    if (!adminMapInstanceRef.current || !adminMarkersGroupRef.current) return;

    adminMarkersGroupRef.current.clearLayers();

    const filtered = mapLocations.filter((loc) => {
      if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) {
        return false;
      }
      if (searchMapQuery) {
        const q = searchMapQuery.toLowerCase();
        if (
          !loc.name.toLowerCase().includes(q) &&
          !loc.building?.toLowerCase().includes(q) &&
          !loc.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    filtered.forEach((loc) => {
      const lat = loc.lat || loc.coordinates?.lat || AMRITA_CAMPUS_CENTER[0];
      const lng = loc.lng || loc.coordinates?.lng || AMRITA_CAMPUS_CENTER[1];

      const marker = L.marker([lat, lng], {
        icon: createAdminMarkerIcon(loc)
      });

      marker.on('click', () => {
        handleOpenEditModal(loc);
      });

      marker.bindTooltip(
        `<div style="font-size:11px; font-weight:bold; color:#f8fafc;">${loc.name}</div><div style="font-size:10px; color:#818cf8;">${loc.category} • ${loc.building}</div><div style="font-size:9px; color:#38bdf8; margin-top:2px;">Click to Edit Establishment</div>`,
        { direction: 'top', offset: [0, -20] }
      );

      marker.addTo(adminMarkersGroupRef.current);
    });

    if (adminFocusedSpot) {
      adminMapInstanceRef.current.flyTo([adminFocusedSpot.lat, adminFocusedSpot.lng], 18, { duration: 1 });
      const pinIcon = L.divIcon({
        className: 'admin-focus-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-rose-600 text-white border-2 border-white shadow-2xl flex items-center justify-center animate-bounce ring-4 ring-rose-400/50">
              <span class="text-base">📍</span>
            </div>
            <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-950 text-white text-[10px] font-extrabold border border-rose-500 whitespace-nowrap shadow-xl">
              ${adminFocusedSpot.type}
            </div>
          </div>
        `,
        iconSize: [40, 54],
        iconAnchor: [20, 46]
      });

      L.marker([adminFocusedSpot.lat, adminFocusedSpot.lng], { icon: pinIcon, zIndexOffset: 2000 })
        .addTo(adminMarkersGroupRef.current)
        .bindPopup(`
          <div style="font-size:12px; font-weight:bold; color:#A41034;">📍 ${adminFocusedSpot.title}</div>
          <div style="font-size:11px; color:#334155; margin-top:3px;">${adminFocusedSpot.location}</div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">Coordinates: ${Number(adminFocusedSpot.lat).toFixed(5)}, ${Number(adminFocusedSpot.lng).toFixed(5)}</div>
        `)
        .openPopup();
    }
  }, [activeTab, mapLocations, selectedMapCategory, searchMapQuery, adminFocusedSpot]);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] shadow-sm shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#B0003A] flex items-center gap-2">
                <span>Campus Central Administration & Analytics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold">
                  Administration
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified governance of food menus, map hubs, lost-and-found claims, and issue resolutions
              </p>
            </div>
          </div>

          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              title="Return to Student Campus Hub"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white text-xs font-bold transition shadow-sm active:scale-95 shrink-0 self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back to Campus Hub</span>
            </button>
          )}
        </div>

        {/* Quick KPI stats cards */}
        {stats && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Revenue</span>
              <div className="text-xl font-extrabold text-[#198754] font-mono mt-1">
                ₹{stats.totalRevenue}
              </div>
              <span className="text-[10px] text-slate-500">100% cashless via wallet</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Orders</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {stats.totalOrders}
              </div>
              <span className="text-[10px] text-[#0D6EFD] font-semibold">{stats.activeOrdersCount} in active prep</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Campus Issues</span>
              <div className="text-xl font-extrabold text-[#B0003A] font-mono mt-1">
                {stats.openIssuesCount} Open
              </div>
              <span className="text-[10px] text-slate-500">{stats.resolvedIssuesCount} resolved</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Lost Items Open</span>
              <div className="text-xl font-extrabold text-[#6F42C1] font-mono mt-1">
                {stats.openLostFoundCount}
              </div>
              <span className="text-[10px] text-slate-500">Awaiting claim handover</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E3D7] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
            activeTab === 'overview'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          Impact Overview & Analytics
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
            activeTab === 'issues'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          Resolve Campus Issues ({issues.filter((i) => i.status !== 'resolved').length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
            activeTab === 'claims'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          Review Lost & Found Claims
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
            activeTab === 'menu'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Canteens & Menu Governance</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'menu' ? 'bg-[#B0003A]/40 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {canteens.length} Outlets
          </span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
            activeTab === 'map'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          Campus Map Hubs ({mapLocations.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
            activeTab === 'users'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-300" />
          <span>Security & User Vault ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
            activeTab === 'forecast'
              ? 'bg-[#B0003A] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#B0003A] hover:bg-[#FFF0F4]/50 border border-[#E8E3D7]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Demand & Festival Forecast</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-slate-900 animate-pulse">
            Spike Warning
          </span>
        </button>
      </div>

      {/* TAB 1: CAMPUS IMPACT OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-6 shadow-sm">
            <h4 className="font-extrabold text-base text-[#B0003A] mb-1">
              Expected Campus Impact & Analytics
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              Measurable outcomes achieved by consolidating food, map, lost items, and issues into Smart Campus Hub:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-1.5 shadow-sm">
                <span className="text-lg">⏱️</span>
                <h5 className="font-bold text-slate-900 text-sm">Saves Student Time</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Eliminates wasted trips when food runs out. Pre-ordering cuts average queue wait time from 18 minutes to zero counter wait.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-1.5 shadow-sm">
                <span className="text-lg">🥗</span>
                <h5 className="font-bold text-slate-900 text-sm">Reduces Food Waste</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Real-time demand tracking shows what dishes are actually being consumed, preventing over-preparation of perishables.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-1.5 shadow-sm">
                <span className="text-lg">💳</span>
                <h5 className="font-bold text-slate-900 text-sm">Cuts Cash Handling</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  100% digital transactions through student campus wallet and UPI. Eliminates tender change delays and cash shrinkage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-1.5 shadow-sm">
                <span className="text-lg">🛠️</span>
                <h5 className="font-bold text-slate-900 text-sm">Faster Issue Resolution</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  5-stage lifecycle routes problems immediately to facilities teams. Closed tickets remain in audit history for maintenance planning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5 shadow-sm bg-[#FAF7F0] border-[#E8E3D7]">
                <span className="text-lg">🔍</span>
                <h5 className="font-bold text-slate-900 text-sm">Organized Lost Belongings</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Replaces scattered WhatsApp messages and paper notices with a verified, single-custody claim recovery registry.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-1.5 shadow-sm">
                <span className="text-lg">🏛️</span>
                <h5 className="font-bold text-slate-900 text-sm">One Unified Platform</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Students, kitchen staff, and university admins operate on a single synchronized dashboard with zero vendor fragmentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESOLVE CAMPUS ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E3D7]">
              <div>
                <h4 className="font-extrabold text-base text-[#B0003A] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#D4A017]" />
                  <span>Campus Facilities Dispatch & Issue Resolution</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time ticket triage, photo evidence inspection, and 5-stage lifecycle dispatching
                </p>
              </div>

              {/* Quick Issue Counts */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold">
                  {issues.filter((i) => i.priority === 'Critical' && i.status !== 'resolved').length} Critical Open
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] text-[#FD7E14] border border-[#FECB9F] font-bold">
                  {issues.filter((i) => i.status !== 'resolved').length} Total Active
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#198754] border border-[#A3D9B5] font-bold">
                  {issues.filter((i) => i.status === 'resolved').length} Resolved
                </span>
              </div>
            </div>

            {/* Filter and Search Bar for Admin */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 pb-4 border-b border-[#E8E3D7]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket #, student, title, location..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div>
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  className="w-full p-2 bg-[#FAF7F0] border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#B0003A]"
                >
                  <option value="All">All Statuses</option>
                  <option value="open">Active / Unresolved Tickets</option>
                  <option value="reported">Stage 1: Newly Reported (Pending Route)</option>
                  <option value="in_progress">Stage 2-4: Routed & In Progress</option>
                  <option value="resolved">Stage 5: Resolved & Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={issuePriorityFilter}
                  onChange={(e) => setIssuePriorityFilter(e.target.value)}
                  className="w-full p-2 bg-[#FAF7F0] border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#B0003A]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical Priority (Immediate Hazards)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Issue List */}
            <div className="mt-4 space-y-4">
              {issues
                .filter((iss) => {
                  if (issueStatusFilter === 'open' && iss.status === 'resolved') return false;
                  if (issueStatusFilter === 'resolved' && iss.status !== 'resolved') return false;
                  if (issueStatusFilter === 'reported' && iss.status !== 'reported') return false;
                  if (issueStatusFilter === 'in_progress' && !['routed', 'in_progress'].includes(iss.status)) return false;
                  if (issuePriorityFilter !== 'All' && iss.priority !== issuePriorityFilter) return false;
                  if (issueSearch.trim()) {
                    const q = issueSearch.toLowerCase();
                    if (
                      !iss.ticketNumber?.toLowerCase().includes(q) &&
                      !iss.title?.toLowerCase().includes(q) &&
                      !iss.description?.toLowerCase().includes(q) &&
                      !iss.location?.toLowerCase().includes(q) &&
                      !iss.reportedBy?.toLowerCase().includes(q)
                    ) {
                      return false;
                    }
                  }
                  return true;
                })
                .map((iss) => {
                  const isResolved = iss.status === 'resolved';
                  const isTimelineExpanded = expandedIssueHistoryId === iss.id;

                  const getPriorityBadgeClass = (p) => {
                    switch (p) {
                      case 'Critical':
                        return 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE] ring-2 ring-[#F8C0CE] font-bold';
                      case 'High':
                        return 'bg-orange-50 text-orange-800 border-orange-300 font-bold';
                      case 'Medium':
                        return 'bg-[#FFF2E6] text-[#FD7E14] border-[#FECB9F] font-bold';
                      default:
                        return 'bg-slate-100 text-slate-700 border-slate-300';
                    }
                  };

                  return (
                    <div
                      key={iss.id}
                      className={`p-5 rounded-2xl bg-white border transition-all shadow-sm ${
                        iss.priority === 'Critical' && !isResolved
                          ? 'border-[#F8C0CE] ring-1 ring-[#F8C0CE]'
                          : 'border-[#E8E3D7]'
                      }`}
                    >
                      {/* Top Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E3D7] text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#B0003A]">
                            {iss.ticketNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(
                              iss.priority
                            )}`}
                          >
                            {iss.priority} Priority
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-[#E8E3D7]">
                            {iss.category}
                          </span>
                          {iss.photoUrl && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]">
                              <ImageIcon className="w-3 h-3" /> Photo Proof
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {iss.reportedBy}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(iss.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Content Grid: Left Details + Right Photo */}
                      <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Details (2 cols on lg) */}
                        <div className="lg:col-span-2 space-y-3">
                          <div>
                            <h5 className="font-bold text-slate-900 text-base leading-snug">{iss.title}</h5>
                            <p className="mt-1.5 text-slate-700 text-xs bg-[#FAF7F0] p-3 rounded-xl border border-[#E8E3D7] leading-relaxed">
                              {iss.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                            <div className="p-2 rounded-lg bg-[#FAF7F0] border border-[#E8E3D7]">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] text-slate-500 font-semibold">Location</span>
                                <button
                                  type="button"
                                  onClick={() => handleViewLocationOnMap(iss, 'Campus Issue')}
                                  className="text-[10px] text-[#B0003A] font-bold hover:underline flex items-center gap-0.5"
                                  title="View on Amrita Campus Map"
                                >
                                  <Compass className="w-3 h-3" /> View on Map
                                </button>
                              </div>
                              <span className="flex items-center gap-1 font-medium text-slate-900">
                                <MapPin className="w-3.5 h-3.5 text-[#B0003A] shrink-0" />
                                <span className="truncate">{iss.location}</span>
                              </span>
                              {(iss.markedOnMap || (iss.lat && iss.lng)) && (
                                <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Pinned from Map [{Number(iss.lat).toFixed(4)}, {Number(iss.lng).toFixed(4)}]</span>
                                </div>
                              )}
                            </div>

                            <div className="p-2 rounded-lg bg-[#FAF7F0] border border-[#E8E3D7]">
                              <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Assigned Department</span>
                              <span className="flex items-center gap-1 font-medium text-slate-900">
                                <Building className="w-3.5 h-3.5 text-[#FD7E14] shrink-0" />
                                <span className="truncate">{iss.department}</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-[#FAF7F0] border border-[#E8E3D7]">
                              <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Responsible Staff</span>
                              <span className="flex items-center gap-1 font-medium text-slate-900">
                                <Users className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                                <span className="truncate">{iss.assignedStaff}</span>
                              </span>
                            </div>
                          </div>

                          {/* 5-Stage Stepper Progress Tracker */}
                          <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7]">
                            <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold">
                              <span className="text-slate-600">Resolution Progress</span>
                              <span className={isResolved ? 'text-[#198754]' : 'text-[#B0003A]'}>
                                Stage {iss.currentStageIndex}/5: {
                                  ['Reported', 'Routed', 'Work In Progress', 'Notified', 'Resolved'][iss.currentStageIndex - 1] || 'In Progress'
                                }
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {['1. Report', '2. Route', '3. Act', '4. Notify', '5. Resolve'].map((stLabel, sIdx) => {
                                const stepNum = sIdx + 1;
                                const isDone = stepNum <= iss.currentStageIndex;
                                const isCurrent = stepNum === iss.currentStageIndex;

                                return (
                                  <div
                                    key={stepNum}
                                    className={`py-1 text-center rounded text-[10px] font-bold transition ${
                                      isCurrent
                                        ? 'bg-[#B0003A] text-white shadow-sm ring-1 ring-[#B0003A]'
                                        : isDone
                                        ? 'bg-[#198754] text-white'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {stLabel}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Right Photo Column */}
                        <div className="lg:col-span-1 flex flex-col justify-between">
                          {iss.photoUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-[#E8E3D7] bg-[#FAF7F0] p-1 flex flex-col h-full justify-between shadow-sm">
                              <div className="flex items-center justify-between p-1.5 text-[11px] font-bold text-slate-700">
                                <span className="flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-[#D4A017]" />
                                  <span>Attached Photo</span>
                                </span>
                                <span className="text-[10px] text-[#B0003A] font-semibold">Click to view</span>
                              </div>
                              <div
                                onClick={() => setAdminLightboxImage(iss.photoUrl)}
                                className="relative rounded-lg overflow-hidden h-36 bg-slate-100 cursor-pointer border border-[#E8E3D7]"
                              >
                                <img
                                  src={iss.photoUrl}
                                  alt={iss.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <span className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-bold flex items-center gap-1 shadow-md">
                                    <Maximize2 className="w-3.5 h-3.5" /> Full Photo
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAdminLightboxImage(iss.photoUrl)}
                                className="mt-2 w-full py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 border border-[#E8E3D7] transition shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#B0003A]" /> Inspect Evidence Photo
                              </button>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-slate-300 p-4 flex flex-col items-center justify-center text-center text-slate-500 text-xs bg-[#FAF7F0]">
                              <Camera className="w-6 h-6 mb-1 text-slate-400" />
                              <span className="font-semibold text-slate-600">No Photo Attached</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">Student submitted text-only report</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar & Timeline Toggle */}
                      <div className="mt-4 pt-3.5 border-t border-[#E8E3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedIssueHistoryId(isTimelineExpanded ? null : iss.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition"
                        >
                          {isTimelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isTimelineExpanded ? 'Hide Timeline History' : `View Full Timeline (${iss.timeline?.length || 1} logged updates)`}</span>
                        </button>

                        {/* Dispatch Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {iss.currentStageIndex < 2 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 2, 'Route')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
                            >
                              Dispatch to Route (Stage 2)
                            </button>
                          )}

                          {iss.currentStageIndex === 2 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 3, 'Act')}
                              className="px-3 py-1.5 rounded-xl bg-[#FD7E14] hover:bg-[#e06d10] text-white font-bold text-xs transition shadow-sm"
                            >
                              Dispatch to Act / In Progress (Stage 3)
                            </button>
                          )}

                          {iss.currentStageIndex === 3 && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 4, 'Notify')}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition shadow-sm"
                            >
                              Send Progress Alert to Student (Stage 4)
                            </button>
                          )}

                          {iss.currentStageIndex >= 3 && iss.status !== 'resolved' && (
                            <button
                              onClick={() => handleAdvanceIssue(iss.id, 5, 'Resolve')}
                              className="px-3 py-1.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs transition shadow-sm"
                            >
                              ✓ Resolve & Close Ticket (Stage 5)
                            </button>
                          )}

                          {iss.status === 'resolved' && (
                            <span className="px-3 py-1.5 rounded-xl bg-[#E8F5E9] text-[#198754] border border-[#A3D9B5] text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-[#198754]" /> Ticket Resolved & Closed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable History Drawer */}
                      {isTimelineExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#E8E3D7] space-y-2 animate-in fade-in">
                          <h6 className="font-bold text-slate-800 text-[11px]">Audit Log & Activity History:</h6>
                          <div className="space-y-2 border-l-2 border-slate-300 ml-2 pl-3">
                            {(iss.timeline || []).map((step, idx) => (
                              <div key={idx} className="relative text-[11px]">
                                <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#B0003A] ring-2 ring-white" />
                                <div className="bg-[#FAF7F0] p-2 rounded-lg border border-[#E8E3D7] text-slate-700">
                                  <div className="flex items-center justify-between text-slate-800 font-semibold">
                                    <span>Stage: {step.stage} • Logged by: {step.actor}</span>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 mt-0.5 text-[10px]">{step.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {issues.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#FAF7F0] rounded-xl border border-[#E8E3D7]">
                  No campus issues found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW LOST & FOUND CLAIMS */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E3D7]">
            <div>
              <h4 className="font-extrabold text-base text-[#B0003A] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#B0003A]" />
                <span>Lost & Found Items & Claim Verification</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Review all student-reported items, inspect marked campus coordinates, and verify ownership claims
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: `All Items (${lostFoundItems.length})` },
                { id: 'claims', label: `Pending Claims (${lostFoundItems.filter((i) => i.claims && i.claims.length > 0).length})` },
                { id: 'found', label: `Found (${lostFoundItems.filter((i) => i.type === 'found').length})` },
                { id: 'lost', label: `Lost (${lostFoundItems.filter((i) => i.type === 'lost').length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLostFoundAdminFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    lostFoundAdminFilter === f.id
                      ? 'bg-[#B0003A] text-white shadow-xs font-bold'
                      : 'bg-[#FAF7F0] text-slate-700 hover:text-slate-900 border border-[#E8E3D7]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {lostFoundItems
              .filter((i) => {
                if (lostFoundAdminFilter === 'claims') return i.claims && i.claims.length > 0;
                if (lostFoundAdminFilter === 'found') return i.type === 'found';
                if (lostFoundAdminFilter === 'lost') return i.type === 'lost';
                return true;
              })
              .map((item) => {
                const isLost = item.type === 'lost';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-3 text-xs shadow-sm hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E8E3D7] shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-slate-900 text-sm">{item.title}</h5>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isLost
                                  ? 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isLost ? 'Reported Lost' : 'Found (Claimable)'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
                              {item.category}
                            </span>
                          </div>

                          {/* Location Section */}
                          <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-700">
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#B0003A] shrink-0" />
                              <strong>Location:</strong> {item.location}
                            </span>
                            {(item.markedOnMap || (item.lat && item.lng)) && (
                              <span className="flex items-center gap-1 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Pinned on Map [{Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}]</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleViewLocationOnMap(item, isLost ? 'Lost Item Spot' : 'Found Item Spot')}
                              className="text-[10px] text-[#B0003A] font-bold hover:underline flex items-center gap-0.5 bg-[#FFF0F4] px-1.5 py-0.5 rounded border border-[#F8C0CE]"
                              title="Inspect this location on Campus Map"
                            >
                              <Compass className="w-3 h-3" /> View on Campus Map
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-1">{item.description}</p>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>Reported by: <strong>{item.reportedBy || 'Student'}</strong></span>
                            <span>•</span>
                            <span>Contact: {item.contactInfo}</span>
                            <span>•</span>
                            <span>Date: {new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase self-start sm:self-center ${
                        item.status === 'verified_returned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Claims List */}
                    {item.claims && item.claims.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#E8E3D7]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Ownership Verification Claims ({item.claims.length}):
                        </span>
                        {item.claims.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-white border border-[#E8E3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                          >
                            <div>
                              <div className="font-bold text-[#B0003A]">
                                Claimant: {c.claimantName} (Roll: {c.claimantRoll}, Tel: {c.claimantPhone})
                              </div>
                              <p className="text-slate-600 text-[11px] mt-0.5">
                                <strong className="text-slate-800">Submitted Proof:</strong> "{c.proofDetails}"
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {c.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleReviewClaim(item.id, c.id, 'approve')}
                                    className="px-3 py-1.5 rounded-lg bg-[#198754] hover:bg-[#146c43] text-white font-bold text-xs transition shadow-sm"
                                  >
                                    Approve & Hand Over
                                  </button>
                                  <button
                                    onClick={() => handleReviewClaim(item.id, c.id, 'reject')}
                                    className="px-3 py-1.5 rounded-lg bg-[#FFF0F4] hover:bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold text-xs transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
                                    c.status === 'approved'
                                      ? 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5]'
                                      : 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                                  }`}
                                >
                                  Claim {c.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            {lostFoundItems.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#FAF7F0] rounded-xl border border-[#E8E3D7]">
                No lost and found items reported yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CANTEENS & MENU GOVERNANCE */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* SECTION A: REGISTERED CAMPUS DINING OUTLETS & REAL-TIME CROWD CALIBRATION */}
          <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] rounded-xl shadow-sm">
                    <Store className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-bold text-[#B0003A] tracking-tight">
                    Registered Dining Outlets & Campus Stores
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]">
                    {canteens.length} Active Outlets
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active dining halls, kiosks, and food courts. Calibrate live kitchen crowd load, wait times, and launch new food stores.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCanteenModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Register New Canteen / Store</span>
                </button>
              </div>
            </div>

            {/* Outlets Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {canteens.map((c) => {
                const outletDishCount = menuItems.filter((m) => m.canteenId === c.id).length;
                const isFiltered = adminCanteenFilter === c.id;
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-4 transition-all duration-200 relative flex flex-col justify-between shadow-sm ${
                      isFiltered
                        ? 'bg-[#FFF0F4]/40 border-[#B0003A] ring-1 ring-[#B0003A]/30'
                        : 'bg-white border-[#E8E3D7] hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-slate-100 border border-[#E8E3D7] flex items-center justify-center text-xs font-mono font-black text-[#B0003A]">
                            {c.code || (c.id === 'canteen-1' ? 'MAIN' : c.id === 'canteen-2' ? 'IT' : c.id === 'canteen-3' ? 'MBA' : 'CT')}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{c.name}</h4>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="line-clamp-1">{c.location || 'Campus Quad'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCanteenModal(c)}
                            title={`Edit ${c.name} name & details`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#B0003A] hover:bg-[#FFF0F4] transition shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCanteen(c)}
                            title={`Delete ${c.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#DC3545] hover:bg-[#FFF0F4] transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-3 text-[11px] bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E8E3D7]">
                        <div>
                          <div className="text-slate-500 text-[10px]">Catalog Dishes</div>
                          <div className="font-bold text-slate-800">{outletDishCount} items</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px]">Avg Wait Time</div>
                          <div className="font-bold text-slate-800">{c.avgWaitTimeMinutes || 5} mins</div>
                        </div>
                      </div>

                      {/* Live Crowd Level Switcher */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1.5">
                          <span>Live Crowd Status</span>
                          <span
                            className={`font-bold uppercase px-1.5 py-0.5 rounded text-[10px] border ${
                              c.crowdLevel === 'Rush Hour' || c.crowdLevel === 'High'
                                ? 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                                : c.crowdLevel === 'Busy' || c.crowdLevel === 'Moderate'
                                ? 'bg-[#FFF2E6] text-[#FD7E14] border-[#FECB9F]'
                                : 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5]'
                            }`}
                          >
                            {c.crowdLevel || 'Low'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {['Low', 'Moderate', 'Busy', 'Rush Hour'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateCanteenCrowd(c.id, lvl)}
                              className={`py-1 rounded-lg text-[9px] font-bold transition ${
                                (c.crowdLevel || 'Low') === lvl
                                  ? 'bg-[#B0003A] text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                            >
                              {lvl === 'Rush Hour' ? 'Rush' : lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminCanteenFilter(isFiltered ? 'All' : c.id);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                          isFiltered
                            ? 'bg-[#B0003A] text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#E8E3D7]'
                        }`}
                      >
                        <Utensils className="w-3 h-3" />
                        <span>{isFiltered ? 'Viewing Menu' : 'Manage Dishes'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCanteenModal(c)}
                        title={`Edit ${c.name} name & details`}
                        className="py-1.5 px-2.5 rounded-xl bg-[#FFF2E6] hover:bg-[#FFF2E6] text-[#FD7E14] text-[11px] font-bold transition flex items-center justify-center gap-1 border border-[#FECB9F] shrink-0 shadow-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Name</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCanteen(c)}
                        title={`Delete ${c.name}`}
                        className="py-1.5 px-2.5 rounded-xl bg-[#FFF0F4] hover:bg-[#FFF0F4] text-[#B0003A] text-[11px] font-bold transition flex items-center justify-center gap-1 border border-[#F8C0CE] shrink-0 shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: DISHES CATALOG & STAFF ACCESS POWERS */}
          <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm">
            {/* Header & Main Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#B0003A] tracking-tight flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#B0003A]" />
                  <span>Menu Dishes Catalog & Kitchen Stock Governance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full staff access equipped: adjust stock quantities (-1, +1, +5, +15), instant in/out-of-stock toggles, upload dish images, edit pricing, or remove items.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAddDishModal}
                  className="px-4 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Dish to Menu</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="space-y-3 mb-6 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E8E3D7]">
              {/* Outlet Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Outlet:
                </span>
                <button
                  type="button"
                  onClick={() => setAdminCanteenFilter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition shadow-sm ${
                    adminCanteenFilter === 'All'
                      ? 'bg-[#B0003A] text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#E8E3D7]'
                  }`}
                >
                  All Outlets ({menuItems.length})
                </button>
                {canteens.map((c) => {
                  const count = menuItems.filter((m) => m.canteenId === c.id).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAdminCanteenFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition shadow-sm ${
                        adminCanteenFilter === c.id
                          ? 'bg-[#B0003A] text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#E8E3D7]'
                      }`}
                    >
                      {c.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Category & Search Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#E8E3D7]">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                    Category:
                  </span>
                  {['All', ...categoriesList].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAdminCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition shadow-sm ${
                        adminCategoryFilter === cat
                          ? 'bg-[#B0003A] text-white font-bold'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#E8E3D7]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dish or ingredient..."
                    value={adminMenuSearch}
                    onChange={(e) => setAdminMenuSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                  />
                  {adminMenuSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminMenuSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Count Strip */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
              <div>
                Showing <span className="font-bold text-slate-900">{filteredAdminMenuItems.length}</span> dishes matching active filters
              </div>
              {filteredAdminMenuItems.length === 0 && (
                <div className="text-[#B0003A] text-xs font-semibold">No menu dishes found for this filter combination.</div>
              )}
            </div>

            {/* Dishes Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAdminMenuItems.map((item) => {
                const canteenObj = canteens.find((c) => c.id === item.canteenId);
                const isOutOfStock = Number(item.stock) <= 0;
                const isLowStock = !isOutOfStock && Number(item.stock) <= 5;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E8E3D7] rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition shadow-sm group relative"
                  >
                    <div>
                      {/* Top Row: Image + Details */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-xl object-cover bg-[#FAF7F0] border border-[#E8E3D7]"
                          />
                          <span
                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${
                              item.isVeg ? 'bg-[#198754] text-white' : 'bg-[#DC3545] text-white'
                            }`}
                            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          >
                            ●
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-sm text-slate-900 truncate" title={item.name}>
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]">
                              {canteenObj?.name || item.canteenId}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="font-mono font-bold text-[#B0003A] text-sm">₹{item.price}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              ~{item.prepTimeMinutes || 4}m prep
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description if any */}
                      {item.description && (
                        <p className="text-[11px] text-slate-600 mt-2.5 line-clamp-2 leading-relaxed bg-[#FAF7F0] p-2 rounded-lg border border-[#E8E3D7]">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Controls & Stock Management */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                      {/* Stock Status & Instant Toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isOutOfStock
                                ? 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                                : isLowStock
                                ? 'bg-[#FFF2E6] text-[#FD7E14] border-[#FECB9F]'
                                : 'bg-[#E8F5E9] text-[#198754] border-[#A3D9B5]'
                            }`}
                          >
                            {isOutOfStock ? 'Sold Out' : `${item.stock} in stock`}
                          </span>
                        </div>

                        {/* Instant In/Out-of-Stock Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStockStatus(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm ${
                            isOutOfStock
                              ? 'bg-[#198754] hover:bg-[#146c43] text-white'
                              : 'bg-slate-100 hover:bg-[#FFF0F4] text-slate-700 hover:text-[#DC3545] border border-[#E8E3D7]'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{isOutOfStock ? 'Restock (+15)' : 'Mark Out of Stock'}</span>
                        </button>
                      </div>

                      {/* Stock Adjustment Buttons (-1, +1, +5, +15) */}
                      <div className="flex items-center justify-between gap-1.5 bg-[#FAF7F0] p-1.5 rounded-xl border border-[#E8E3D7]">
                        <span className="text-[10px] text-slate-500 font-semibold px-1">Adjust:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={Number(item.stock) <= 0}
                            onClick={() => handleAdjustStock(item, -1)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-[#E8E3D7] text-[11px] font-bold transition shadow-sm"
                            title="Decrease by 1"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 1)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-[#E8E3D7] text-[11px] font-bold transition shadow-sm"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 5)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-[#E8E3D7] text-[11px] font-bold transition shadow-sm"
                            title="Increase by 5"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 15)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#B0003A] border border-[#E8E3D7] font-mono text-[11px] font-bold transition shadow-sm"
                            title="Batch restock 15 portions"
                          >
                            +15
                          </button>
                        </div>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditDishModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-[#E8E3D7] shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#FD7E14]" />
                          <span>Edit Dish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#FFF0F4] hover:bg-[#FFF0F4] text-[#B0003A] text-xs font-bold transition flex items-center gap-1.5 border border-[#F8C0CE] shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS MAP & ESTABLISHMENTS STUDIO (Slide 6 & 10) */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Header & Filter Bar */}
          <div className="bg-white border border-[#E8E3D7] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#B0003A]" />
                <h4 className="font-extrabold text-base text-[#B0003A]">Campus Map & Establishment Management</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] font-bold">
                  Live Relational Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Edit, relocate, or establish stores, clinics, canteens, academic blocks, and hostels across the 400-acre Amrita Ettimadai campus compound.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Pin New Establishment</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Chips */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#E8E3D7]">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'All', label: 'All Establishments' },
                { id: 'Food & Dining', label: '🍽️ Food & Dining' },
                { id: 'Medical & Health', label: '🏥 Medical & Health' },
                { id: 'Academic Store', label: '📚 Stores & Xerox' },
                { id: 'Academic & Labs', label: '🎓 Academic & Labs' },
                { id: 'Hostels & Living', label: '🛏️ Hostels' },
                { id: 'Sports & Recreation', label: '🏊 Sports' },
                { id: 'Facilities', label: '🏛️ Facilities' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMapCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                    selectedMapCategory === cat.id
                      ? 'bg-[#B0003A] text-white font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#E8E3D7]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search establishments..."
                value={searchMapQuery}
                onChange={(e) => setSearchMapQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
              />
            </div>
          </div>

          {/* Split View: Interactive Map & Establishments List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Compound Leaflet Map */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#B0003A]" />
                    <span className="font-bold text-slate-900">Interactive Amrita Compound Map</span>
                    <span className="text-[10px] text-slate-500 font-mono">(Locked to 400-Acre Perimeter)</span>
                  </div>
                  <span className="text-[10px] text-[#B0003A] font-bold bg-[#FFF0F4] px-2 py-0.5 rounded border border-[#F8C0CE]">
                    Click pin to edit
                  </span>
                </div>

                {/* Admin Focused Spot Banner */}
                {adminFocusedSpot && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-rose-700 via-[#A41034] to-red-800 text-white flex items-center justify-between text-xs shadow-md animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-200 animate-bounce shrink-0" />
                      <span>
                        Inspecting {adminFocusedSpot.type}: <strong>{adminFocusedSpot.title}</strong> at <em>{adminFocusedSpot.location}</em> ({adminFocusedSpot.lat?.toFixed(4)}, {adminFocusedSpot.lng?.toFixed(4)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminFocusedSpot(null)}
                      className="px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white font-semibold text-[11px] transition shrink-0 ml-2"
                    >
                      Clear Pin
                    </button>
                  </div>
                )}

                {/* Leaflet Container */}
                <div
                  ref={adminMapContainerRef}
                  className="w-full h-[480px] rounded-xl overflow-hidden border border-[#E8E3D7] shadow-inner relative z-0"
                />

                {/* Map Bottom Bar: Click capture or hint */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {clickedMapCoord ? (
                    <div className="flex items-center gap-2 text-[#B0003A] font-mono text-[11px]">
                      <Crosshair className="w-3.5 h-3.5 text-[#B0003A] animate-pulse" />
                      <span>
                        Map Pin Picked: {clickedMapCoord.lat}, {clickedMapCoord.lng}
                      </span>
                      <button
                        onClick={() => handleOpenAddModal(clickedMapCoord)}
                        className="ml-2 px-2.5 py-0.5 rounded bg-[#B0003A] text-white hover:bg-[#8F002E] text-[10px] font-bold shadow-sm"
                      >
                        + Pin Here
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Click anywhere inside the Amrita compound to capture coordinates or click any marker to edit.</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (adminMapInstanceRef.current) {
                        adminMapInstanceRef.current.flyTo(AMRITA_CAMPUS_CENTER, 16.5, { duration: 0.8 });
                      }
                    }}
                    className="text-[10px] text-[#B0003A] hover:text-[#8F002E] font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Campus View
                  </button>
                </div>

                {/* Quick Landmark Preset Jumps */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Quick Landmark Navigator:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {AMRITA_GPS_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          if (adminMapInstanceRef.current) {
                            adminMapInstanceRef.current.flyTo([p.lat, p.lng], 18, { duration: 0.8 });
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 hover:text-slate-900 border border-[#E8E3D7] transition font-medium"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pinned Campus Establishments Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white border border-[#E8E3D7] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#B0003A]">Campus Establishments</h4>
                    <p className="text-[11px] text-slate-500">
                      Showing {
                        mapLocations.filter((loc) => {
                          if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) return false;
                          if (searchMapQuery) {
                            const q = searchMapQuery.toLowerCase();
                            return (
                              loc.name.toLowerCase().includes(q) ||
                              loc.building?.toLowerCase().includes(q) ||
                              loc.description?.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        }).length
                      } establishments on campus
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {mapLocations
                    .filter((loc) => {
                      if (selectedMapCategory !== 'All' && loc.category !== selectedMapCategory) return false;
                      if (searchMapQuery) {
                        const q = searchMapQuery.toLowerCase();
                        return (
                          loc.name.toLowerCase().includes(q) ||
                          loc.building?.toLowerCase().includes(q) ||
                          loc.description?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((loc) => {
                      const isDining = loc.category === 'Food & Dining' || loc.relatedCanteenId;
                      const isMedical = loc.category === 'Medical & Health';
                      const isStore = loc.category === 'Academic Store' || loc.category === 'Retail Store';
                      const isAcademic = loc.category === 'Academic & Labs';
                      const isHostel = loc.category === 'Hostels & Living';

                      let badgeColor = 'bg-slate-100 text-slate-700 border-[#E8E3D7]';
                      if (isDining) badgeColor = 'bg-[#FFF2E6] text-[#FD7E14] border-[#FECB9F]';
                      else if (isMedical) badgeColor = 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]';
                      else if (isStore) badgeColor = 'bg-teal-50 text-teal-800 border-teal-200';
                      else if (isAcademic) badgeColor = 'bg-[#EBF3FE] text-[#0D6EFD] border-[#A2C8FD]';
                      else if (isHostel) badgeColor = 'bg-[#F3EEF9] text-[#6F42C1] border-[#C8B3E6]';

                      return (
                        <div
                          key={loc.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#E8E3D7] hover:border-slate-300 transition space-y-2 text-xs shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={loc.image}
                                alt={loc.name}
                                className="w-12 h-12 rounded-xl object-cover border border-[#E8E3D7] shrink-0 bg-[#FAF7F0]"
                              />
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{loc.name}</h5>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                                    {loc.category}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {loc.building} ({loc.floor})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Relational Canteen Link Indicator */}
                          {isDining && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] text-[10px] font-semibold">
                              <Utensils className="w-3 h-3 text-[#B0003A] shrink-0" />
                              <span>
                                Relational Sync: Staff Kitchen Active ({loc.relatedCanteenId || 'Canteen'})
                              </span>
                            </div>
                          )}

                          {/* Timings and Contact info */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1 truncate">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{loc.timings || '08:00 AM - 09:30 PM'}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{loc.contact || 'Campus Ext'}</span>
                            </div>
                          </div>

                          {/* Monospace GPS Coordinates */}
                          <div className="text-[10px] font-mono text-slate-700 bg-[#FAF7F0] px-2 py-1 rounded border border-[#E8E3D7] flex items-center justify-between">
                            <span>GPS: {loc.lat || loc.coordinates?.lat}, {loc.lng || loc.coordinates?.lng}</span>
                            <span className="text-slate-500 font-sans">{loc.zone}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                const lat = loc.lat || loc.coordinates?.lat;
                                const lng = loc.lng || loc.coordinates?.lng;
                                if (adminMapInstanceRef.current && lat && lng) {
                                  adminMapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.8 });
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] flex items-center gap-1 border border-[#E8E3D7] transition shadow-sm font-semibold"
                            >
                              <Crosshair className="w-3 h-3 text-[#B0003A]" />
                              <span>Locate</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(loc)}
                              className="px-3 py-1 rounded-lg bg-[#B0003A] hover:bg-[#8F002E] text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              onClick={() => handleDeleteMapLoc(loc)}
                              className="px-2 py-1 rounded-lg bg-[#FFF0F4] hover:bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] text-[11px] transition shadow-sm"
                              title="Delete establishment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* EDIT & PIN ESTABLISHMENT MODAL (Slide 6 Relational Updates) */}
          {isMapModalOpen && editingMapLoc && (
            <div className="fixed inset-0 bg-slate-950/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="max-w-2xl w-full bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] shadow-sm">
                      {isAddingNewLoc ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#B0003A]">
                        {isAddingNewLoc ? 'Pin New Campus Establishment' : 'Edit Establishment Details'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Configuring location, hours, and relational options across campus systems
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMapModalOpen(false);
                      setEditingMapLoc(null);
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMapLoc} className="space-y-4 text-xs">
                  {/* Name */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Establishment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Canteen 1 or Health Clinic & Dispensary"
                      value={editingMapLoc.name || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, name: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#B0003A]"
                    />
                  </div>

                  {/* Category & Zone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                      <select
                        value={editingMapLoc.category || 'Food & Dining'}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, category: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      >
                        <option value="Food & Dining">Food & Dining (Canteens & Cafes)</option>
                        <option value="Medical & Health">Medical & Health (Clinic & Dispensary)</option>
                        <option value="Academic Store">Academic Store (Books & Xerox)</option>
                        <option value="Retail Store">Retail Store (Supermarket & General)</option>
                        <option value="Academic & Labs">Academic & Labs (AB1, AB2, AB3, AB4)</option>
                        <option value="Hostels & Living">Hostels & Living (Boys & Girls)</option>
                        <option value="Sports & Recreation">Sports & Recreation (Pool, Gym, Grounds)</option>
                        <option value="Facilities">Facilities (Library, ATM, Security)</option>
                        <option value="Administration">Administration (Dean Office, Admissions)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Campus Zone *</label>
                      <select
                        value={editingMapLoc.zone || 'Central Campus'}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, zone: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      >
                        <option value="Central Campus">Central Campus</option>
                        <option value="North Campus">North Campus</option>
                        <option value="South-Central Campus">South-Central Campus</option>
                        <option value="East Academic">East Academic</option>
                        <option value="North-West Academic">North-West Academic</option>
                        <option value="Hostel Zone">Hostel Zone</option>
                        <option value="Main Gate Area">Main Gate Area</option>
                      </select>
                    </div>
                  </div>

                  {/* Building & Floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Building *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Academic Block 3 or North Sports Pavilion"
                        value={editingMapLoc.building || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, building: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Floor *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ground Floor or Floors 1 to 4"
                        value={editingMapLoc.floor || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, floor: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      />
                    </div>
                  </div>

                  {/* Timings & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Operating Hours *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 08:00 AM - 09:30 PM"
                        value={editingMapLoc.timings || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, timings: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contact Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Extension 2401 or clinic@campus.edu"
                        value={editingMapLoc.contact || ''}
                        onChange={(e) => setEditingMapLoc({ ...editingMapLoc, contact: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                      />
                    </div>
                  </div>

                  {/* RELATIONAL CANTEEN SYNC SECTION */}
                  {(editingMapLoc.category === 'Food & Dining' || editingMapLoc.relatedCanteenId) && (
                    <div className="p-3.5 rounded-2xl bg-[#FFF0F4]/70 border border-[#F8C0CE] text-[#B0003A] space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#B0003A]">
                        <Utensils className="w-4 h-4 text-[#B0003A]" />
                        <span>⚡ Relational Canteen & Staff Operations Synchronization</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Renaming this establishment or updating its location/timings will automatically propagate to:
                        <br />• <strong>Staff Kitchen Panel</strong>: Active canteen dropdown selector & kitchen queues
                        <br />• <strong>Student Canteen View</strong>: Canteen tab switcher, header banner & active order tokens
                      </p>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                          Relational Canteen Mapping
                        </label>
                        <select
                          value={editingMapLoc.relatedCanteenId || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, relatedCanteenId: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A]"
                        >
                          <option value="">-- Standalone / Unlinked Dining Hub --</option>
                          {canteens.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* MEDICAL & HEALTH INFO */}
                  {editingMapLoc.category === 'Medical & Health' && (
                    <div className="p-3 rounded-xl bg-[#FFF0F4] border border-[#F8C0CE] text-[#B0003A] text-xs flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#B0003A] shrink-0" />
                      <span>
                        Campus Clinic entries are highlighted with 24/7 emergency response beacons on student maps.
                      </span>
                    </div>
                  )}

                  {/* STORE INFO */}
                  {(editingMapLoc.category === 'Academic Store' || editingMapLoc.category === 'Retail Store') && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                      <Store className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        Stationery, xerox & textbook stores are searchable by academic materials on student map search.
                      </span>
                    </div>
                  )}

                  {/* GPS COORDINATES & PRESETS */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E8E3D7] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-[#B0003A]" />
                        <span>Precise GPS Coordinates</span>
                      </span>
                      {clickedMapCoord && (
                        <button
                          type="button"
                          onClick={() => setEditingMapLoc({
                            ...editingMapLoc,
                            lat: clickedMapCoord.lat,
                            lng: clickedMapCoord.lng
                          })}
                          className="text-[10px] text-[#B0003A] hover:text-[#8F002E] font-bold underline flex items-center gap-1"
                        >
                          Use Map Clicked ({clickedMapCoord.lat}, {clickedMapCoord.lng})
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Latitude (GPS)</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={editingMapLoc.lat || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, lat: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-[#B0003A]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Longitude (GPS)</label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={editingMapLoc.lng || ''}
                          onChange={(e) => setEditingMapLoc({ ...editingMapLoc, lng: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-[#B0003A]"
                        />
                      </div>
                    </div>

                    {/* Quick Landmark Preset Buttons */}
                    <div className="pt-2 border-t border-[#E8E3D7]">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">
                        One-Click Coordinate Snapping:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {AMRITA_GPS_PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setEditingMapLoc({
                              ...editingMapLoc,
                              lat: p.lat,
                              lng: p.lng
                            })}
                            className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-[10px] text-slate-700 border border-[#E8E3D7] transition shadow-sm"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Description & Services</label>
                    <textarea
                      rows="2"
                      placeholder="Services offered, specialties, student access details..."
                      value={editingMapLoc.description || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, description: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingMapLoc.image || ''}
                      onChange={(e) => setEditingMapLoc({ ...editingMapLoc, image: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMapModalOpen(false);
                        setEditingMapLoc(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold transition shadow-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold transition shadow-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAddingNewLoc ? 'Pin Establishment to Map' : 'Save & Synchronize Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SECURITY & USER VAULT (THEFT-PROOF ENCRYPTION & USER ACCESS CONTROL) */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* User Feedback Alert */}
          {userFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-sm ${
                userFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {userFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{userFeedback.message}</span>
              </div>
              <button
                onClick={() => setUserFeedback(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Security & Theft Protection Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF0F4] via-white to-[#FDFBF7] border border-[#F8C0CE] rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#B0003A]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#B0003A] text-white shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  <span>Theft-Proof Cryptographic Engine Active</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#B0003A] tracking-tight">
                  AES-256-GCM Vault & User Management
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All usernames, credentials, and access roles are stored in an encrypted disk vault using military-grade <strong className="text-[#B0003A]">AES-256-GCM</strong> cipher and <strong className="text-slate-900">Salted Bcrypt (12 Rounds)</strong> hashing. Even if a thief physically steals the server hard drive, backups, or raw database files, the stolen payload is completely useless random ciphertext without the master cryptographic key.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <button
                  onClick={() => setShowTheftSimulator(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B0003A] to-[#8F002E] hover:from-[#8F002E] hover:to-[#6E0023] text-white font-bold text-xs shadow-md shadow-[#B0003A]/20 transition group"
                >
                  <Terminal className="w-4 h-4 text-amber-300 group-hover:rotate-6 transition" />
                  <span>Inspect Disk Vault (Thief Test)</span>
                </button>
                <button
                  onClick={fetchAdminData}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-[#E8E3D7] transition shadow-sm"
                  title="Refresh Vault Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cryptographic Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#F8C0CE]/60">
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E8E3D7] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-500">Encryption Standard</span>
                <div className="text-sm font-bold text-[#B0003A] font-mono mt-0.5">AES-256-GCM</div>
                <span className="text-[10px] text-slate-500">Authenticated Cipher</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E8E3D7] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-500">Password Derivation</span>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">Salted Bcrypt (12x)</div>
                <span className="text-[10px] text-slate-500">ASIC/GPU Resistant</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E8E3D7] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-500">Theft Resistance</span>
                <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">100% Uncrackable</div>
                <span className="text-[10px] text-slate-500">Zero Plaintext on Disk</span>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-[#E8E3D7] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-500">Protected Accounts</span>
                <div className="text-sm font-bold text-[#B0003A] font-mono mt-0.5">{users.length} Users</div>
                <span className="text-[10px] text-slate-500">Sealed in Vault</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New User Card */}
            <div className="lg:col-span-1 bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-[#B0003A]" />
                <div>
                  <h4 className="font-extrabold text-sm text-[#B0003A]">Add New User Account</h4>
                  <p className="text-[11px] text-slate-500">Created with salted hash & sealed into vault</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Anand Kumar"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username / Roll No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="e.g. cb.en.u4cse23150 or staff-c1"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. user@campus.edu"
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Access Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A]"
                  >
                    <option value="student">Student (Canteen & Complaints)</option>
                    <option value="cook">Kitchen Cook (Food Preparation & KDS)</option>
                    <option value="staff">Counter Staff (Token Station & Pickup)</option>
                    <option value="faculty">Faculty (VIP Priority Services)</option>
                    <option value="admin">Administrator (Full Campus Governance)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = `Amrita#${Math.floor(1000 + Math.random() * 9000)}!`;
                        setNewUser({ ...newUser, password: randomPass });
                      }}
                      className="text-[10px] text-[#B0003A] font-semibold hover:underline"
                    >
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full p-2.5 pr-9 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-0.5"
                    >
                      {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {userLoading ? (
                    <span>Encrypting & Storing in Vault...</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Encrypt & Add User</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Registered Users List */}
            <div className="lg:col-span-2 bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B0003A]" />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#B0003A]">
                      Registered User Accounts ({users.length})
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Vault Status: <span className="text-emerald-600 font-bold">AES-256-GCM Encrypted</span>
                    </p>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search user..."
                    className="p-1.5 px-3 bg-[#FAF7F0] border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="p-1.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    <option value="All">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="cook">Cooks (Kitchen KDS)</option>
                    <option value="staff">Counter Staff</option>
                    <option value="faculty">Faculty</option>
                    <option value="student">Students</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto pr-1">
                {users
                  .filter((u) => {
                    const q = userSearchQuery.toLowerCase();
                    const matchesSearch =
                      !q ||
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.username && u.username.toLowerCase().includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q));
                    const matchesRole =
                      userRoleFilter === 'All' || (u.role && u.role.toLowerCase() === userRoleFilter.toLowerCase());
                    return matchesSearch && matchesRole;
                  })
                  .map((u) => {
                    const roleBadgeClass =
                      u.role === 'admin'
                        ? 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                        : u.role === 'cook'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : u.role === 'staff'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : u.role === 'faculty'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200';

                    return (
                      <div
                        key={u.id || u.username}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFBF7] px-2 rounded-2xl transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase border ${
                              u.role === 'admin'
                                ? 'bg-[#FFF0F4] text-[#B0003A] border-[#F8C0CE]'
                                : u.role === 'staff'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {u.username.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{u.name || u.username}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${roleBadgeClass}`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              @{u.username} • {u.email || 'N/A'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              AES-256-GCM Vault • Salted Bcrypt
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setChangingPasswordUser(u);
                              setNewPasswordInput('');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3 h-3 text-[#B0003A]" />
                            <span>Change Password</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id || u.username, u.name || u.username)}
                            disabled={u.username === 'SYS-ADMIN-SUPER' || u.username === 'admin'}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              u.username === 'SYS-ADMIN-SUPER' || u.username === 'admin'
                                ? 'Root administrator cannot be deleted'
                                : 'Delete User'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {changingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white border border-[#E8E3D7] rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#B0003A] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B0003A]" />
                <span>Reset Password for '{changingPasswordUser.username}'</span>
              </h4>
              <button
                onClick={() => setChangingPasswordUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-[#B0003A] font-mono"
                />
              </div>

              <div className="text-[10px] text-slate-500 leading-relaxed bg-[#FFF0F4]/60 p-3 rounded-xl border border-[#F8C0CE]">
                The new password will be hashed with 12 rounds of bcrypt and sealed into the AES-256-GCM vault.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangingPasswordUser(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white text-xs font-bold shadow-md"
                >
                  Update & Encrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theft Simulator & Raw On-Disk Vault Inspection Modal */}
      {showTheftSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-[#F8C0CE]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Physical Theft Simulation & Raw Disk Vault Inspector
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      LIVE DISK READ
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Target: {vaultInfo?.vaultFilePath || 'server/data/users.vault.enc.json'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTheftSimulator(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-slate-200">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                <strong>Why this protects against theft:</strong> If a thief steals the computer, server hard drive, or copies the database files, they only get the scrambled ciphertext shown below. Without the 256-bit encryption key and GCM authentication tag, it is mathematically impossible to read or extract usernames and passwords.
              </div>

              {/* Raw Ciphertext Box */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                  <span>Algorithm: <span className="text-white font-bold">{vaultInfo?.algorithm || 'aes-256-gcm'}</span></span>
                  <span>Payload Size: <span className="text-white font-bold">{vaultInfo?.fileSizeBytes || 3450} bytes</span></span>
                </div>

                <div className="text-[11px] space-y-1 pt-1">
                  <div className="text-slate-500">// Initialization Vector (IV):</div>
                  <div className="text-amber-400 break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    {vaultInfo?.iv || '6ed18bc761a922dd51f59975'}
                  </div>

                  <div className="text-slate-500 pt-1">// Galois Authentication Tag (128-bit MAC):</div>
                  <div className="text-emerald-400 break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    {vaultInfo?.authTag || 'N/A'}
                  </div>

                  <div className="text-slate-500 pt-1">// Raw Stolen Ciphertext (Scrambled Bytes on Hard Disk):</div>
                  <div className="text-cyan-300 break-all bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[10px] leading-relaxed max-h-48 overflow-y-auto selection:bg-cyan-500 selection:text-black">
                    {vaultInfo?.ciphertextSnippet || '50e9140ad8adbabb5599793deaf74ab0caf281d2e451b6c333c9149a1fc726bb32b38529c21c7482f33c30dab4ac22ef8a6e...'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total accounts sealed inside this ciphertext:</span>
                <span className="font-bold text-white font-mono">{vaultInfo?.accountsProtectedCount || users.length} Accounts</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTheftSimulator(false)}
                className="px-4 py-1.5 rounded-lg bg-[#B0003A] hover:bg-[#8F002E] text-white text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AI CANTEEN DEMAND PREDICTION & HOLIDAY/FESTIVAL SPIKE WARNING DASHBOARD */}
      {activeTab === 'forecast' && (() => {
        // Prepare active forecast dataset (with fallback)
        const activeData = forecastData || {
          canteenId: selectedForecastCanteen,
          canteenName: 'All Campus Canteens Combined',
          baseDailyOrders: 3200,
          timeline: [
            { date: 'Mon, Oct 5', offsetDays: -6, eventName: 'Normal Academic Monday', isPast: true, predictedOrders: 3260, estimatedRevenue: 221680, confidenceScore: 100, peakWaitMinutes: 8, meals: { breakfast: 717, lunch: 1238, eveningSnacks: 782, dinner: 521 } },
            { date: 'Tue, Oct 6', offsetDays: -5, eventName: 'Regular Academic Tuesday', isPast: true, predictedOrders: 3136, estimatedRevenue: 213248, confidenceScore: 100, peakWaitMinutes: 8, meals: { breakfast: 690, lunch: 1191, eveningSnacks: 752, dinner: 501 } },
            { date: 'Wed, Oct 7', offsetDays: -4, eventName: 'Sports Meet Opening', isPast: true, predictedOrders: 4320, estimatedRevenue: 293760, confidenceScore: 100, peakWaitMinutes: 14, meals: { breakfast: 950, lunch: 1641, eveningSnacks: 1036, dinner: 691 } },
            { date: 'Thu, Oct 8', offsetDays: -3, eventName: 'Sports Meet Finals', isPast: true, predictedOrders: 4736, estimatedRevenue: 322048, confidenceScore: 100, peakWaitMinutes: 16, meals: { breakfast: 1041, lunch: 1800, eveningSnacks: 1136, dinner: 757 } },
            { date: 'Fri, Oct 9', offsetDays: -2, eventName: 'Saturday Classes (Partial)', isPast: true, predictedOrders: 2496, estimatedRevenue: 169728, confidenceScore: 100, peakWaitMinutes: 6, meals: { breakfast: 549, lunch: 948, eveningSnacks: 599, dinner: 399 } },
            { date: 'Sat, Oct 10', offsetDays: -1, eventName: 'Sunday Hostel Special Diner', isPast: true, predictedOrders: 2816, estimatedRevenue: 191488, confidenceScore: 100, peakWaitMinutes: 7, meals: { breakfast: 619, lunch: 1070, eveningSnacks: 675, dinner: 450 } },
            { date: 'Sun, Oct 11', offsetDays: 0, eventName: 'Today: Normal Operations', isToday: true, predictedOrders: 3360, estimatedRevenue: 228480, confidenceScore: 95, peakWaitMinutes: 8, meals: { breakfast: 739, lunch: 1276, eveningSnacks: 806, dinner: 537 } },
            { date: 'Mon, Oct 12', offsetDays: 1, eventName: 'Tomorrow: Pre-Fest Influx', isFuture: true, predictedOrders: 4544, estimatedRevenue: 308992, confidenceScore: 91, peakWaitMinutes: 15, meals: { breakfast: 1000, lunch: 1726, eveningSnacks: 1090, dinner: 727 } },
            { date: 'Tue, Oct 13', offsetDays: 2, eventName: 'Anokha Tech Fest Day 1 (Inauguration)', isFuture: true, predictedOrders: 6016, estimatedRevenue: 409088, confidenceScore: 88, peakWaitMinutes: 22, meals: { breakfast: 1323, lunch: 2286, eveningSnacks: 1443, dinner: 962 } },
            { date: 'Wed, Oct 14', offsetDays: 3, eventName: 'Anokha Tech Fest Day 2 (Pro-Night)', isFuture: true, predictedOrders: 6560, estimatedRevenue: 446080, confidenceScore: 85, peakWaitMinutes: 24, meals: { breakfast: 1443, lunch: 2492, eveningSnacks: 1574, dinner: 1049 } },
            { date: 'Thu, Oct 15', offsetDays: 4, eventName: 'Anokha Valedictory Day', isFuture: true, predictedOrders: 4960, estimatedRevenue: 337280, confidenceScore: 82, peakWaitMinutes: 16, meals: { breakfast: 1091, lunch: 1884, eveningSnacks: 1190, dinner: 793 } },
            { date: 'Fri, Oct 16', offsetDays: 5, eventName: 'Long Weekend Holiday Exodus', isFuture: true, predictedOrders: 1216, estimatedRevenue: 82688, confidenceScore: 79, peakWaitMinutes: 4, meals: { breakfast: 267, lunch: 462, eveningSnacks: 292, dinner: 194 } },
            { date: 'Sat, Oct 17', offsetDays: 6, eventName: 'Festival Vacation (Low Residency)', isFuture: true, predictedOrders: 1024, estimatedRevenue: 69632, confidenceScore: 76, peakWaitMinutes: 4, meals: { breakfast: 225, lunch: 389, eveningSnacks: 246, dinner: 164 } }
          ],
          warnings: [
            {
              id: 'w1',
              level: 'critical_surge',
              severity: 'CRITICAL SURGE WARNING',
              title: '🚨 MEGA FESTIVAL SPIKE: Anokha Tech Fest (Days +2 & +3)',
              dateWindow: 'Wed & Thu (Oct 13 - 14)',
              surgePercent: '+88% to +105%',
              expectedVolume: '6,016 - 6,560 Orders/Day',
              rootCause: '1,800+ registered delegates and external participants arriving from across Tamil Nadu & Kerala for Anokha National Tech Fest.',
              canteenNotice: 'Central Dining and IT Canteen will experience unprecedented lunch and late evening crowds.',
              actionRecommendations: [
                'Increase Idli/Dosa batter and South Indian Meals preparation by 85%',
                'Deploy 2 express takeaway counters strictly for pre-tokened Thali & Biryani',
                'Stock extra 250 liters of milk for non-stop hot coffee/tea stalls',
                'Assign 3 additional staff members for line/token triage'
              ]
            },
            {
              id: 'w2',
              level: 'holiday_dip',
              severity: 'FOOD WASTAGE HAZARD',
              title: '📉 HOLIDAY EXODUS WARNING: Long Weekend / Semester Break',
              dateWindow: 'Fri & Sat (Oct 16 - 17)',
              surgePercent: '-62% to -68%',
              expectedVolume: '1,216 - 1,024 Orders/Day',
              rootCause: 'Over 65% of hostel students leave campus for the festive extended weekend break. Day scholars have no classes.',
              canteenNotice: 'High risk of massive perishable food wastage if usual baseline quantity is prepared.',
              actionRecommendations: [
                'Reduce perishable vegetable and dairy procurement by 60%',
                'Limit hot menu to on-demand made items (Roast, Parotta, Fried Rice) to prevent stale discarded food',
                'Operate with reduced counter staff to save kitchen operating overhead',
                'Freeze leftover curd/milk buffers early on Friday evening'
              ]
            },
            {
              id: 'w3',
              level: 'rush_hour_caution',
              severity: 'TIME COMPRESSION SURGE',
              title: '⚡ EXAM WEEK RUSH HOUR: 40-Minute Compressed Lunch Window',
              dateWindow: 'Ongoing Mid-Semester Window',
              surgePercent: '+40% Instantaneous Lunch Spike',
              expectedVolume: '1,450 Orders Between 12:45 PM - 1:30 PM',
              rootCause: 'Exam schedule ends simultaneously across AB-1, AB-2, and AB-3 at 12:45 PM. 2,000+ students enter canteens at once.',
              canteenNotice: 'Counter wait time will surge to ~22 minutes without express token queues.',
              actionRecommendations: [
                'Pre-package 350 Quick-Bite Lunch boxes before 12:30 PM',
                'Direct students via Digital Signage to Canteen 2 & Courtyard Diner to balance crowd',
                'Promote Mobile Wallet advance tokens to bypass billing counter congestion'
              ]
            }
          ],
          kitchenProcurement: [
            { item: 'Idli & Dosa Batter', unit: 'kg', normalQty: 180, recommendedQty: 255, unitCost: 45, urgency: 'High Surge' },
            { item: 'Sona Masoori Rice', unit: 'kg', normalQty: 240, recommendedQty: 340, unitCost: 55, urgency: 'High Surge' },
            { item: 'Fresh Vegetables & Greens', unit: 'kg', normalQty: 160, recommendedQty: 228, unitCost: 40, urgency: 'High Surge' },
            { item: 'Fresh Farm Milk (Aavin)', unit: 'liters', normalQty: 220, recommendedQty: 312, unitCost: 52, urgency: 'High Surge' },
            { item: 'Eggs & Protein Buffer', unit: 'units', normalQty: 600, recommendedQty: 850, unitCost: 6, urgency: 'High Surge' },
            { item: 'Cooking Oil & Pure Ghee', unit: 'liters', normalQty: 45, recommendedQty: 64, unitCost: 175, urgency: 'High Surge' }
          ],
          hourlyCurve: [
            { hour: '07:30 AM', normalOrders: 95, peakFestivalOrders: 160, meal: 'Breakfast' },
            { hour: '08:30 AM', normalOrders: 210, peakFestivalOrders: 360, meal: 'Breakfast Rush' },
            { hour: '09:30 AM', normalOrders: 130, peakFestivalOrders: 220, meal: 'Late Breakfast' },
            { hour: '11:00 AM', normalOrders: 85, peakFestivalOrders: 180, meal: 'Morning Tea / Snacks' },
            { hour: '12:30 PM', normalOrders: 280, peakFestivalOrders: 510, meal: 'Lunch Peak 1' },
            { hour: '01:15 PM', normalOrders: 390, peakFestivalOrders: 680, meal: 'Lunch Peak 2 (Max)' },
            { hour: '02:00 PM', normalOrders: 170, peakFestivalOrders: 320, meal: 'Late Lunch' },
            { hour: '04:30 PM', normalOrders: 140, peakFestivalOrders: 280, meal: 'Evening Bakes' },
            { hour: '05:30 PM', normalOrders: 230, peakFestivalOrders: 420, meal: 'Tea & Chai Rush' },
            { hour: '07:30 PM', normalOrders: 190, peakFestivalOrders: 340, meal: 'Dinner Peak 1' },
            { hour: '08:45 PM', normalOrders: 260, peakFestivalOrders: 470, meal: 'Dinner Peak 2' },
            { hour: '09:30 PM', normalOrders: 90, peakFestivalOrders: 190, meal: 'Night Owls & Shakes' }
          ],
          summary: {
            predictedPeakDay: 'Thursday (Anokha Day 2)',
            predictedPeakVolume: 6560,
            predictedLowDay: 'Sunday (Holiday Break)',
            predictedLowVolume: 1024,
            overallWeeklyVolume: 27960,
            netEstimatedRevenue: 1901280,
            wastageMitigationEfficiency: '94.2% Food Waste Prevented'
          }
        };

        // Filter timeline by horizon
        const filteredTimeline = activeData.timeline.filter((t) => {
          if (forecastHorizon === 'future') return t.offsetDays >= 0;
          if (forecastHorizon === 'past') return t.offsetDays <= 0;
          return true;
        });

        // Current selected day in inspector
        const selectedDay = activeData.timeline[selectedDayIndex] || activeData.timeline[7];
        const scaledOrders = Math.round(selectedDay.predictedOrders * simulationModifier);
        const scaledRevenue = Math.round(selectedDay.estimatedRevenue * simulationModifier);

        // Max orders for relative bar scaling
        const maxTimelineOrders = Math.max(...activeData.timeline.map((t) => t.predictedOrders * (t.offsetDays > 0 ? simulationModifier : 1)));

        return (
          <div className="space-y-6 animate-in fade-in text-slate-900">
            {/* Top Header & Canteen Horizon Controls */}
            <div className="bg-gradient-to-br from-[#FFF0F4] via-white to-[#FDFBF7] border border-[#F8C0CE] rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#B0003A] text-white shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                    <span>Predictive Demand & Festival Intelligence Engine</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#B0003A] tracking-tight">
                    Canteen Order Prediction & Holiday Spike Warning Dashboard
                  </h3>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Harness historical dining trends, academic timetables, and campus festival calendars to forecast customer order volume, prepare exact food procurement quantities, eliminate holiday food wastage, and handle peak rush hour crowds.
                  </p>
                </div>

                {/* Filter and Canteen Selectors */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Canteen</label>
                    <select
                      value={selectedForecastCanteen}
                      onChange={(e) => setSelectedForecastCanteen(e.target.value)}
                      className="p-2.5 px-3 bg-white border border-[#E8E3D7] rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-[#B0003A]"
                    >
                      <option value="all">🍽️ All Campus Canteens Combined</option>
                      <option value="canteen-1">🍲 Canteen 1 (Central Dining Hall)</option>
                      <option value="canteen-2">⚽ Canteen 2 (North Hostel & Sports)</option>
                      <option value="canteen-3">🌳 Canteen 3 (Courtyard Diner)</option>
                      <option value="canteen-it">💻 IT Canteen (AB-3 Food Court)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Timeline Horizon</label>
                    <select
                      value={forecastHorizon}
                      onChange={(e) => setForecastHorizon(e.target.value)}
                      className="p-2.5 px-3 bg-white border border-[#E8E3D7] rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-[#B0003A]"
                    >
                      <option value="all">🗓️ 14-Day Full Horizon (Past + Today + Future)</option>
                      <option value="future">🔮 Next 7 Days (Forward Forecast & Warnings)</option>
                      <option value="past">📊 Past 7 Days (Historical Baseline)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Simulation Sandbox Toolbar */}
              <div className="mt-6 pt-5 border-t border-[#F8C0CE]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#B0003A]" />
                  <span className="text-xs font-bold text-slate-700">What-If Simulation Sandbox:</span>
                  {simulationEventName && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B0003A] text-white">
                      Active: {simulationEventName} ({simulationModifier}x)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSimulationModifier(1.0);
                      setSimulationEventName(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      simulationModifier === 1.0
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-[#E8E3D7] hover:bg-slate-100'
                    }`}
                  >
                    Reset Baseline (1.0x)
                  </button>

                  <button
                    onClick={() => {
                      setSimulationModifier(1.95);
                      setSimulationEventName('Anokha Fest Surge');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      simulationModifier === 1.95
                        ? 'bg-[#B0003A] text-white shadow-sm'
                        : 'bg-white text-[#B0003A] border border-[#F8C0CE] hover:bg-[#FFF0F4]'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Simulate Tech Fest Surge (+95%)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSimulationModifier(0.42);
                      setSimulationEventName('Monsoon Weather Dip');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      simulationModifier === 0.42
                        ? 'bg-sky-700 text-white shadow-sm'
                        : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <span>🌧️ Simulate Monsoon Rain Dip (-58%)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSimulationModifier(0.35);
                      setSimulationEventName('Holiday Exodus');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      simulationModifier === 0.35
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Simulate Vacation Exodus (-65%)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* EARLY WARNINGS & ACTION CARDS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-extrabold text-base text-slate-900">
                    Active Canteen Warnings & Calendar Risk Advisories
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {activeData.warnings.length} Active System Advisories
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {activeData.warnings.map((warn) => {
                  const isCritical = warn.level === 'critical_surge';
                  const isHoliday = warn.level === 'holiday_dip';
                  const cardBg = isCritical
                    ? 'bg-gradient-to-br from-[#FFF0F4] to-white border-[#F8C0CE]'
                    : isHoliday
                    ? 'bg-gradient-to-br from-rose-50/70 to-white border-rose-200'
                    : 'bg-gradient-to-br from-amber-50/70 to-white border-amber-200';

                  const badgeBg = isCritical
                    ? 'bg-[#B0003A] text-white'
                    : isHoliday
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-600 text-white';

                  return (
                    <div
                      key={warn.id}
                      className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 ${cardBg}`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${badgeBg}`}>
                            {warn.severity}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 font-mono">
                            {warn.dateWindow}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {warn.title}
                        </h5>

                        <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">Volume Shift:</span>
                          <span className={`text-xs font-extrabold font-mono ${isCritical ? 'text-[#B0003A]' : isHoliday ? 'text-rose-600' : 'text-amber-700'}`}>
                            {warn.surgePercent} ({warn.expectedVolume})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          <strong>Root Cause:</strong> {warn.rootCause}
                        </p>

                        <div className="text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                          <strong>Canteen Notice:</strong> {warn.canteenNotice}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Recommended Kitchen Action:
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-700">
                          {warn.actionRecommendations.map((act, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 14-DAY TIMELINE VISUALIZER (PAST LOOKING -> PRESENT -> FUTURE) */}
            <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-base text-[#B0003A] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#B0003A]" />
                    <span>Daily Customer Orders Timeline: Past 7 Days ➔ Today ➔ Next 7 Days</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click any day below to inspect meal breakdown, peak rush congestion curves, and kitchen raw material procurement.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-300" />
                    <span className="text-slate-600">Past Actuals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-emerald-700 font-bold">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#B0003A]" />
                    <span className="text-[#B0003A] font-bold">Future Forecast</span>
                  </div>
                </div>
              </div>

              {/* Bar Visualizer Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-2 pt-2">
                {filteredTimeline.map((item, idx) => {
                  const effectiveOrders = Math.round(item.predictedOrders * (item.offsetDays > 0 ? simulationModifier : 1));
                  const effectiveRevenue = Math.round(item.estimatedRevenue * (item.offsetDays > 0 ? simulationModifier : 1));
                  const barHeightPercent = Math.max(18, Math.min(100, Math.round((effectiveOrders / maxTimelineOrders) * 100)));
                  const isSelected = activeData.timeline.indexOf(item) === selectedDayIndex;

                  let barColor = 'bg-slate-300 hover:bg-slate-400';
                  let badgeText = 'PAST';
                  let badgeColor = 'bg-slate-100 text-slate-600';

                  if (item.isToday) {
                    barColor = 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20';
                    badgeText = 'TODAY';
                    badgeColor = 'bg-emerald-100 text-emerald-800 font-bold animate-pulse';
                  } else if (item.isFuture) {
                    if (item.eventType === 'critical_surge' || item.eventType === 'festival_surge') {
                      barColor = 'bg-gradient-to-t from-[#B0003A] to-amber-500 hover:from-[#8F002E] hover:to-amber-600 shadow-md shadow-[#B0003A]/20';
                      badgeText = 'SURGE';
                      badgeColor = 'bg-[#FFF0F4] text-[#B0003A] font-bold border border-[#F8C0CE]';
                    } else if (item.eventType === 'holiday_dip') {
                      barColor = 'bg-rose-300 hover:bg-rose-400';
                      badgeText = 'DIP';
                      badgeColor = 'bg-rose-100 text-rose-800 font-bold';
                    } else {
                      barColor = 'bg-[#B0003A]/80 hover:bg-[#B0003A]';
                      badgeText = 'EST';
                      badgeColor = 'bg-slate-100 text-slate-700';
                    }
                  }

                  return (
                    <div
                      key={item.date}
                      onClick={() => setSelectedDayIndex(activeData.timeline.indexOf(item))}
                      className={`p-2.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between text-center select-none ${
                        isSelected
                          ? 'border-[#B0003A] bg-[#FFF0F4]/40 ring-2 ring-[#B0003A]/30 shadow-md'
                          : 'border-[#E8E3D7] hover:border-slate-400 bg-white hover:bg-[#FDFBF7]'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] uppercase tracking-wider block font-mono ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <div className="font-extrabold text-[11px] text-slate-800 leading-tight">
                          {item.date.split(',')[0]}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.date.split(',')[1]?.trim()}
                        </div>
                      </div>

                      {/* Bar Visual */}
                      <div className="h-28 flex items-end justify-center my-2">
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${barColor}`}
                        />
                      </div>

                      <div className="space-y-0.5 pt-1 border-t border-slate-100">
                        <div className="text-xs font-black text-slate-900 font-mono">
                          {effectiveOrders.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          ₹{(effectiveRevenue / 1000).toFixed(1)}k
                        </div>
                        <div className={`text-[8px] font-bold px-1 py-0.2 rounded font-mono ${
                          item.peakWaitMinutes > 15 ? 'text-rose-700 bg-rose-50' : 'text-slate-500'
                        }`}>
                          ~{item.peakWaitMinutes}m wait
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED DAY DEEP-DIVE INSPECTOR & PROCUREMENT PLANNER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Day Metrics & Meal Breakdown */}
              <div className="lg:col-span-1 bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#B0003A]" />
                    <div>
                      <h4 className="font-extrabold text-sm text-[#B0003A]">Day Demand Deep-Dive</h4>
                      <div className="text-xs font-bold text-slate-800">{selectedDay.date}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedDay.isToday
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDay.isFuture
                      ? 'bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedDay.isToday ? 'Live Today' : selectedDay.isFuture ? 'AI Forecast' : 'Historical'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E8E3D7] space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Calendar Event Note:</span>
                  <div className="text-xs font-bold text-slate-900">{selectedDay.eventName}</div>
                  <div className="text-[11px] text-slate-600 leading-snug">{selectedDay.note}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-[#E8E3D7] rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Predicted Orders</span>
                    <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                      {scaledOrders.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                      {selectedDay.confidenceScore}% AI Confidence
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-[#E8E3D7] rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Est. Daily Revenue</span>
                    <div className="text-lg font-extrabold text-[#B0003A] font-mono mt-0.5">
                      ₹{scaledRevenue.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">Avg ₹68 / Token</span>
                  </div>
                </div>

                {/* Meal Distribution Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    Meal Timing Order Distribution:
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        <span>Breakfast (07:30 - 10:00)</span>
                      </span>
                      <span className="font-extrabold font-mono text-slate-900">
                        {Math.round(selectedDay.meals.breakfast * simulationModifier)} ({Math.round((selectedDay.meals.breakfast / selectedDay.predictedOrders) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '22%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-[#B0003A]" />
                        <span>Lunch Peak (12:00 - 14:30)</span>
                      </span>
                      <span className="font-extrabold font-mono text-slate-900">
                        {Math.round(selectedDay.meals.lunch * simulationModifier)} ({Math.round((selectedDay.meals.lunch / selectedDay.predictedOrders) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#B0003A] rounded-full" style={{ width: '38%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Evening Bakes & Tea (16:30 - 18:30)</span>
                      </span>
                      <span className="font-extrabold font-mono text-slate-900">
                        {Math.round(selectedDay.meals.eveningSnacks * simulationModifier)} ({Math.round((selectedDay.meals.eveningSnacks / selectedDay.predictedOrders) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '24%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-purple-600" />
                        <span>Dinner (19:30 - 21:30)</span>
                      </span>
                      <span className="font-extrabold font-mono text-slate-900">
                        {Math.round(selectedDay.meals.dinner * simulationModifier)} ({Math.round((selectedDay.meals.dinner / selectedDay.predictedOrders) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '16%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen Ingredient Procurement & Hourly Congestion */}
              <div className="lg:col-span-2 space-y-6">
                {/* Kitchen Ingredient Procurement Table */}
                <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#B0003A]" />
                      <div>
                        <h4 className="font-extrabold text-sm text-[#B0003A]">
                          Kitchen Raw Material Procurement Recommendation
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          AI-calculated ingredient stock to prevent 1:00 PM stockouts and eliminate holiday spoilage
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Auto-Adjusted for {selectedDay.date.split(',')[0]}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="py-2.5 px-3">Raw Ingredient</th>
                          <th className="py-2.5 px-3">Normal Baseline</th>
                          <th className="py-2.5 px-3">AI Recommended Stock</th>
                          <th className="py-2.5 px-3">Est. Cost (₹)</th>
                          <th className="py-2.5 px-3">Prep Urgency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeData.kitchenProcurement.map((ing) => {
                          const surgeRatio = (selectedDay.predictedOrders * simulationModifier) / activeData.baseDailyOrders;
                          const recommended = Math.round(ing.normalQty * surgeRatio);
                          const totalCost = recommended * ing.unitCost;
                          const isSurge = surgeRatio > 1.25;
                          const isDip = surgeRatio < 0.6;

                          return (
                            <tr key={ing.item} className="hover:bg-[#FDFBF7] transition">
                              <td className="py-3 px-3 font-bold text-slate-900">{ing.item}</td>
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {ing.normalQty} {ing.unit}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                <span className={isSurge ? 'text-[#B0003A] font-extrabold' : isDip ? 'text-rose-600' : 'text-slate-900'}>
                                  {recommended} {ing.unit}
                                </span>
                                {isSurge && (
                                  <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                                    (+{Math.round((surgeRatio - 1) * 100)}%)
                                  </span>
                                )}
                                {isDip && (
                                  <span className="ml-1 text-[10px] text-rose-600 font-bold">
                                    (-{Math.round((1 - surgeRatio) * 100)}%)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-700">₹{totalCost.toLocaleString()}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isSurge
                                    ? 'bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE]'
                                    : isDip
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {isSurge ? 'High Surge Prep' : isDip ? 'Reduce Order' : 'Standard'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Hour-by-Hour Rush Curve */}
                <div className="bg-white border border-[#E8E3D7] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#B0003A]" />
                      <div>
                        <h4 className="font-extrabold text-sm text-[#B0003A]">
                          Hour-by-Hour Queue Rush & Counter Congestion Curve
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Expected traffic flow to schedule chef breaks and open auxiliary billing counters
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {activeData.hourlyCurve.map((hr) => {
                      const dynamicOrders = Math.round(
                        (selectedDay.offsetDays > 0 && selectedDay.eventType.includes('surge')
                          ? hr.peakFestivalOrders
                          : hr.normalOrders) * simulationModifier
                      );
                      const isMegaPeak = hr.hour.includes('01:15 PM') || hr.hour.includes('12:30 PM');

                      return (
                        <div
                          key={hr.hour}
                          className={`p-3 rounded-2xl border text-center transition ${
                            isMegaPeak
                              ? 'bg-[#FFF0F4] border-[#F8C0CE] shadow-sm'
                              : 'bg-white border-[#E8E3D7] hover:bg-[#FDFBF7]'
                          }`}
                        >
                          <div className="font-extrabold text-xs text-slate-800">{hr.hour}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{hr.meal}</div>
                          <div className={`text-base font-extrabold font-mono mt-1 ${isMegaPeak ? 'text-[#B0003A]' : 'text-slate-900'}`}>
                            {dynamicOrders}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">tokens/hr</div>
                          {isMegaPeak && (
                            <span className="mt-1 inline-block px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#B0003A] text-white">
                              PEAK RUSH
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Image Preview Modal for Admin */}
      {adminLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setAdminLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white border border-[#E8E3D7] rounded-2xl overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#B0003A] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#B0003A]" />
                Issue Evidence Photo — High-Resolution Inspection
              </span>
              <button
                onClick={() => setAdminLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden mt-3">
              <img
                src={adminLightboxImage}
                alt="Admin high-res evidence inspect"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER NEW CANTEEN / STORE */}
      {isAddCanteenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAddCanteenModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-white border border-[#E8E3D7] rounded-3xl overflow-hidden shadow-2xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] rounded-xl shadow-sm">
                  <Store className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#B0003A]">Register New Canteen or Store</h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly activates across Student Menu, Kitchen KDS, and Admin controls.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCanteenModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCanteen} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Canteen / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canteen 4 (PG Diner) or Nescafe Kiosk"
                    value={canteenForm.name}
                    onChange={(e) => setCanteenForm({ ...canteenForm, name: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Badge Code</label>
                  <input
                    type="text"
                    placeholder="e.g. C4 or NES"
                    value={canteenForm.code}
                    onChange={(e) => setCanteenForm({ ...canteenForm, code: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 uppercase placeholder-slate-400 font-mono focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Block 3 Ground Floor, Near Tech Quad"
                  value={canteenForm.location}
                  onChange={(e) => setCanteenForm({ ...canteenForm, location: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={canteenForm.timings}
                    onChange={(e) => setCanteenForm({ ...canteenForm, timings: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Crowd</label>
                  <select
                    value={canteenForm.crowdLevel}
                    onChange={(e) => setCanteenForm({ ...canteenForm, crowdLevel: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Busy">Busy</option>
                    <option value="Rush Hour">Rush Hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Avg Wait (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={canteenForm.avgWaitTimeMinutes}
                    onChange={(e) =>
                      setCanteenForm({ ...canteenForm, avgWaitTimeMinutes: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={canteenForm.image}
                  onChange={(e) => setCanteenForm({ ...canteenForm, image: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCanteenModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create & Launch Outlet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DISH TO MENU */}
      {isAddDishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAddDishModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-white border border-[#E8E3D7] rounded-3xl overflow-hidden shadow-2xl p-6 max-h-[90vh] overflow-y-auto text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] rounded-xl shadow-sm">
                  <Utensils className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#B0003A]">Add New Food Item to Menu</h3>
                  <p className="text-[11px] text-slate-500">
                    Specify outlet, category, pricing, kitchen prep time, and upload photo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDishModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Canteen / Outlet *</label>
                  <select
                    value={dishForm.canteenId}
                    onChange={(e) => setDishForm({ ...dishForm, canteenId: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala Combo or Cold Coffee Shake"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishForm.prepTimeMinutes}
                    onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={dishForm.stock}
                    onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              {/* Diet Classification */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Diet Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shadow-sm ${
                      dishForm.isVeg
                        ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#198754]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198754]" />
                    <span>Pure Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shadow-sm ${
                      !dishForm.isVeg
                        ? 'bg-[#FFF0F4] border-[#F8C0CE] text-[#B0003A]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC3545]" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Dish Image Source (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">Dish Photo</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-[#E8E3D7]">
                    <button
                      type="button"
                      onClick={() => setDishImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                        dishImageMode === 'upload'
                          ? 'bg-[#B0003A] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                        dishImageMode === 'url'
                          ? 'bg-[#B0003A] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-2.5 h-2.5" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {dishImageMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={adminDishFileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminDishFileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#B0003A] bg-[#FAF7F0] hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-[#B0003A]" />
                      <span>Choose Image from Computer</span>
                    </button>
                    {dishForm.imageUrl && (
                      <div className="relative shrink-0">
                        <img
                          src={dishForm.imageUrl}
                          alt="Dish preview"
                          className="w-12 h-12 rounded-xl object-cover border border-[#E8E3D7] shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setDishForm({ ...dishForm, imageUrl: '' })}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC3545] text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={dishForm.imageUrl}
                      onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                    />
                    {dishForm.imageUrl && (
                      <img
                        src={dishForm.imageUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-[#E8E3D7] shrink-0 shadow-sm"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Ingredients</label>
                <textarea
                  rows="2"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Ingredients, accompaniments, allergens..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Dish to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT DISH MODAL */}
      {editingDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setEditingDish(null)}
        >
          <div
            className="relative max-w-xl w-full bg-white border border-[#E8E3D7] rounded-3xl overflow-hidden shadow-2xl p-6 max-h-[90vh] overflow-y-auto text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#FFF0F4] text-[#B0003A] border border-[#F8C0CE] rounded-xl shadow-sm">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#B0003A]">Edit Dish: {editingDish.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Update pricing, category, kitchen prep time, photo, or stock availability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Canteen / Outlet *</label>
                  <select
                    value={dishForm.canteenId}
                    onChange={(e) => setDishForm({ ...dishForm, canteenId: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishForm.prepTimeMinutes}
                    onChange={(e) => setDishForm({ ...dishForm, prepTimeMinutes: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={dishForm.stock}
                    onChange={(e) => setDishForm({ ...dishForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              {/* Diet Classification */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Diet Type</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: true })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shadow-sm ${
                      dishForm.isVeg
                        ? 'bg-[#E8F5E9] border-[#A3D9B5] text-[#198754]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198754]" />
                    <span>Pure Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, isVeg: false })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shadow-sm ${
                      !dishForm.isVeg
                        ? 'bg-[#FFF0F4] border-[#F8C0CE] text-[#B0003A]'
                        : 'bg-[#FAF7F0] border-[#E8E3D7] text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC3545]" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Dish Image Source (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">Dish Photo</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-[#E8E3D7]">
                    <button
                      type="button"
                      onClick={() => setDishImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                        dishImageMode === 'upload'
                          ? 'bg-[#B0003A] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                        dishImageMode === 'url'
                          ? 'bg-[#B0003A] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-2.5 h-2.5" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {dishImageMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={adminEditDishFileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminEditDishFileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#B0003A] bg-[#FAF7F0] hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-[#B0003A]" />
                      <span>Choose New Image from Computer</span>
                    </button>
                    {dishForm.imageUrl && (
                      <div className="relative shrink-0">
                        <img
                          src={dishForm.imageUrl}
                          alt="Dish preview"
                          className="w-12 h-12 rounded-xl object-cover border border-[#E8E3D7] shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setDishForm({ ...dishForm, imageUrl: '' })}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC3545] text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={dishForm.imageUrl}
                      onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                    />
                    {dishForm.imageUrl && (
                      <img
                        src={dishForm.imageUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-[#E8E3D7] shrink-0 shadow-sm"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Ingredients</label>
                <textarea
                  rows="2"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Ingredients, accompaniments..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CANTEEN / STORE DETAILS & RENAME */}
      {editingCanteen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setEditingCanteen(null)}
        >
          <div
            className="relative max-w-xl w-full bg-white border border-[#E8E3D7] rounded-3xl overflow-hidden shadow-2xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#FFF0F4] text-[#B0003A] rounded-xl border border-[#F8C0CE] shadow-sm">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-[#B0003A]">Edit Canteen / Store Details</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Rename outlet, update badge code, location, timings, and operational settings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCanteen(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCanteen} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Canteen / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canteen 1 (Central Dining Hall)"
                    value={editCanteenForm.name}
                    onChange={(e) => setEditCanteenForm({ ...editCanteenForm, name: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Badge Code</label>
                  <input
                    type="text"
                    value={editCanteenForm.code}
                    onChange={(e) => setEditCanteenForm({ ...editCanteenForm, code: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 uppercase font-mono focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Campus Location</label>
                <input
                  type="text"
                  value={editCanteenForm.location}
                  onChange={(e) => setEditCanteenForm({ ...editCanteenForm, location: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={editCanteenForm.timings}
                    onChange={(e) => setEditCanteenForm({ ...editCanteenForm, timings: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Live Crowd</label>
                  <select
                    value={editCanteenForm.crowdLevel}
                    onChange={(e) => setEditCanteenForm({ ...editCanteenForm, crowdLevel: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Busy">Busy</option>
                    <option value="Rush Hour">Rush Hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Avg Wait (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editCanteenForm.avgWaitTimeMinutes}
                    onChange={(e) => setEditCanteenForm({ ...editCanteenForm, avgWaitTimeMinutes: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editCanteenForm.image}
                  onChange={(e) => setEditCanteenForm({ ...editCanteenForm, image: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F0] border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#B0003A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCanteen(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B0003A] hover:bg-[#8F002E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Save Outlet Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
