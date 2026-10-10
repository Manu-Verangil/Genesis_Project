import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ShieldCheck,
  Tag,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export function LostAndFoundView() {
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState('All'); // 'All', 'found', 'lost'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [targetItemForClaim, setTargetItemForClaim] = useState(null);

  // Report Form State
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'found',
    category: 'Electronics',
    location: '',
    description: '',
    contactInfo: 'student@campus.edu',
    imageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Claim Form State
  const [claimForm, setClaimForm] = useState({
    claimantName: '',
    claimantRoll: '',
    claimantPhone: '',
    proofDetails: ''
  });

  const fetchItems = async () => {
    try {
      const res = await api.getLostAndFound();
      if (res.success) setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const categories = ['All', 'Electronics', 'Accessories', 'Documents', 'Personal Belongings'];

  const filteredItems = items.filter((item) => {
    if (filterType !== 'All' && item.type !== filterType) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.location.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const resetReportForm = () => {
    setReportForm({
      title: '',
      type: 'found',
      category: 'Electronics',
      location: '',
      description: '',
      contactInfo: 'student@campus.edu',
      imageUrl: ''
    });
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportForm((prev) => ({ ...prev, imageUrl: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setReportForm((prev) => ({ ...prev, imageUrl: '' }));
      setImagePreview(null);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = reportForm;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('title', reportForm.title);
        formData.append('type', reportForm.type);
        formData.append('category', reportForm.category);
        formData.append('location', reportForm.location);
        formData.append('description', reportForm.description);
        formData.append('contactInfo', reportForm.contactInfo);
        formData.append('imageUrl', reportForm.imageUrl);
        formData.append('image', selectedFile);
        payload = formData;
      }
      const res = await api.reportLostFound(payload);
      if (res.success) {
        alert(res.message || 'Item reported successfully!');
        setIsReportModalOpen(false);
        resetReportForm();
        fetchItems();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!targetItemForClaim) return;
    try {
      const res = await api.claimLostFound(targetItemForClaim.id, claimForm);
      if (res.success) {
        alert('Claim request submitted! Campus administration will review your proof.');
        setIsClaimModalOpen(false);
        setClaimForm({
          claimantName: '',
          claimantRoll: '',
          claimantPhone: '',
          proofDetails: ''
        });
        fetchItems();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#A41034]" />
              <span>Campus Lost & Found Portal</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-50 text-[#A41034] border border-rose-200 font-bold">
                Verified Custody
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              One centralized portal replacing buried WhatsApp groups and wall notices
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Report Lost or Found Item</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'All', label: 'All Items' },
              { id: 'found', label: 'Found (Claimable)' },
              { id: 'lost', label: 'Reported Lost' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterType === t.id
                    ? 'bg-[#A41034] text-white shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search calculator, watch, keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading Lost & Found items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          No items match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isFound = item.type === 'found';
            const isResolved = item.status === 'verified_returned';
            const isClaimed = item.status === 'claimed';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between transition"
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative h-48 w-full bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                    {/* Type Badge */}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isFound
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#A41034] text-white shadow-xs'
                      }`}
                    >
                      {item.type}
                    </span>

                    {/* Category */}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] text-slate-800 border border-slate-200 font-medium">
                      {item.category}
                    </span>

                    {/* Status Badge */}
                    <div className="absolute bottom-3 left-3">
                      {isResolved ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Returned to Owner
                        </span>
                      ) : isClaimed ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                          Claim Pending Verification
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-300">
                          Open for Claim
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Reported by: {item.reportedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  {isFound && !isResolved && (
                    <button
                      onClick={() => {
                        setTargetItemForClaim(item);
                        setIsClaimModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-50 hover:bg-[#A41034] hover:text-white text-[#A41034] text-xs font-semibold border border-slate-200 hover:border-[#A41034] transition flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Claim This Item (Verify Ownership)</span>
                    </button>
                  )}
                  {item.type === 'lost' && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-[10px] text-slate-600">
                      If found, contact: {item.contactInfo}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Report Lost or Found Item</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034]"
                  >
                    <option value="found">I Found Something (Claimable)</option>
                    <option value="lost">I Lost Something (Missing)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Documents">Documents / ID Cards</option>
                    <option value="Personal Belongings">Personal Belongings</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Item Title</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Titan Quartz Watch"
                  required
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Library 2nd floor desk #14"
                  required
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description & Identifying Clues</label>
                <textarea
                  rows="3"
                  placeholder="Color, condition, scratches, distinctive marks..."
                  required
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload Item Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#A41034] file:text-white hover:file:bg-[#880E2D] cursor-pointer focus:outline-none"
                />
                {imagePreview && (
                  <div className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                        setReportForm((prev) => ({ ...prev, imageUrl: '' }));
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-lg transition"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-xs transition shadow-sm"
                >
                  Publish to Campus Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && targetItemForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Claim Item Verification</h3>
                <p className="text-[11px] text-[#A41034] font-semibold mt-0.5">{targetItemForClaim.title}</p>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={claimForm.claimantName}
                  onChange={(e) => setClaimForm({ ...claimForm, claimantName: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    value={claimForm.claimantRoll}
                    onChange={(e) => setClaimForm({ ...claimForm, claimantRoll: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={claimForm.claimantPhone}
                    onChange={(e) => setClaimForm({ ...claimForm, claimantPhone: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Proof of Ownership Details
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe secret marks, wallpaper, lock screen, invoice number, or exact contents inside..."
                  value={claimForm.proofDetails}
                  onChange={(e) => setClaimForm({ ...claimForm, proofDetails: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-[#A41034] leading-relaxed">
                Campus admin will verify your claim with the item custodian prior to handover.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-xs transition shadow-sm"
                >
                  Submit Claim for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
