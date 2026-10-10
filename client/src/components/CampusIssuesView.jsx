import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  Building,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Camera,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { api } from '../api';

export function CampusIssuesView() {
  const [issues, setIssues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedIssueId, setExpandedIssueId] = useState('iss-0');

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Hostel Maintenance & Grounds',
    location: '',
    description: '',
    priority: 'Medium',
    photoUrl: ''
  });

  const fetchIssues = async () => {
    try {
      const res = await api.getIssues();
      if (res && res.success) setIssues(res.data);
    } catch (err) {
      console.error('Failed to load campus issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const stages = [
    { num: 1, title: 'Report', desc: 'Choose category, describe problem & mark location' },
    { num: 2, title: 'Route', desc: 'Reaches responsible staff or admin' },
    { num: 3, title: 'Act', desc: 'Staff update status as work progresses' },
    { num: 4, title: 'Notify', desc: 'User alerted whenever status changes' },
    { num: 5, title: 'Resolve', desc: 'Issue closed and visible in history' }
  ];

  const categories = [
    'All',
    'Hostel Maintenance & Grounds',
    'Water Cooler & Plumbing',
    'WiFi & IT Infrastructure',
    'Classroom AV & Electronics',
    'Sanitation & Hygiene',
    'Electrical Maintenance Cell',
    'Safety & Campus Hazards'
  ];

  const filteredIssues = issues.filter((iss) => {
    if (selectedCategory !== 'All' && iss.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && iss.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !iss.title.toLowerCase().includes(q) &&
        !iss.description.toLowerCase().includes(q) &&
        !iss.location.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size exceeds 5MB. Please choose a smaller photo.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photoUrl: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedPhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, photoUrl: '' }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
      alert('Please fill out all required fields: Issue Title, Location, and Problem Description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createIssue(form);
      if (res && res.success) {
        alert(res.message || 'Issue reported successfully!');
        setIsReportModalOpen(false);
        setForm({
          title: '',
          category: 'Hostel Maintenance & Grounds',
          location: '',
          description: '',
          priority: 'Medium',
          photoUrl: ''
        });
        removeSelectedPhoto();
        fetchIssues();
      } else {
        alert(res?.message || 'Could not submit issue report. Please try again.');
      }
    } catch (err) {
      alert('Error submitting report: ' + (err.message || 'Unable to connect to server.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-50 text-[#A41034] border-rose-300 font-bold';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200 font-bold';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Step Process Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-lg text-[#A41034] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#A41034]" />
              <span>Campus Issue Resolution System</span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#A41034] border border-rose-200">
                5-Stage Resolution Workflow
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              "Raise it. Track it. Get it resolved." — Full transparent facilities tracking for Amrita students & faculty
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A41034] hover:bg-[#880E2D] text-white font-bold text-xs transition shadow-md shadow-[#A41034]/20 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Raise A Campus Problem</span>
          </button>
        </div>

        {/* 5-Stage Visual Workflow Stepper */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stages.map((st) => (
            <div
              key={st.num}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-[#A41034] text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  {st.num}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">Step {st.num}</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-slate-800 text-xs">{st.title}</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#A41034] text-white shadow-sm font-bold'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search water, wifi, room 302..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
          />
        </div>
      </div>

      {/* Issues List with 5-Stage Live Progress */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading campus issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl text-xs shadow-xs">
          No campus issues match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            const currentStage = issue.currentStageIndex || 1;
            const isResolved = issue.status === 'resolved';

            return (
              <div
                key={issue.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all ${
                  isExpanded ? 'border-[#A41034]/60 ring-2 ring-[#A41034]/10' : 'border-slate-200'
                }`}
              >
                {/* Issue Header Summary */}
                <div
                  onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#A41034]">
                          {issue.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityColor(
                            issue.priority
                          )}`}
                        >
                          {issue.priority} Priority
                        </span>
                        <span className="text-slate-500 text-xs font-medium">• {issue.category}</span>
                        {issue.photoUrl && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-[#A41034] border border-rose-200">
                            <ImageIcon className="w-3 h-3" /> Photo Attached
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base mt-1">{issue.title}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {issue.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-[#A41034] border border-rose-200'
                      }`}
                    >
                      Stage {currentStage}/5: {stages[currentStage - 1]?.title}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* 5-Stage Live Interactive Stepper */}
                <div className="px-5 pb-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-5 gap-2 relative">
                      {stages.map((st) => {
                        const isDone = st.num <= currentStage;
                        const isCurrent = st.num === currentStage;

                        return (
                          <div key={st.num} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 shadow-xs ${
                                isCurrent
                                  ? 'bg-[#A41034] text-white ring-4 ring-[#A41034]/20 animate-pulse'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-400 border border-slate-300'
                              }`}
                            >
                              {isDone && !isCurrent ? '✓' : st.num}
                            </div>
                            <span
                              className={`mt-1.5 text-[11px] font-bold ${
                                isCurrent
                                  ? 'text-[#A41034]'
                                  : isDone
                                  ? 'text-emerald-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Expanded Activity Timeline & Description */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-4 text-xs animate-in fade-in">
                    <div>
                      <h5 className="font-bold text-slate-800 mb-1">Problem Description:</h5>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    {/* Optional Photo Display */}
                    {issue.photoUrl && (
                      <div>
                        <h5 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#A41034]" />
                          <span>Attached Photo Evidence:</span>
                        </h5>
                        <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                          <img
                            src={issue.photoUrl}
                            alt={issue.title}
                            className="w-full h-44 object-cover cursor-pointer hover:opacity-95 transition"
                            onClick={() => setLightboxImage(issue.photoUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => setLightboxImage(issue.photoUrl)}
                            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md backdrop-blur-sm transition"
                          >
                            <Maximize2 className="w-3 h-3" /> View Full
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Timeline History */}
                    <div>
                      <h5 className="font-bold text-slate-800 mb-2">Resolution Timeline History:</h5>
                      <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                        {issue.timeline?.map((step, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#A41034] ring-4 ring-white" />
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-900">
                                  Stage: {step.stage} • {step.actor}
                                </span>
                                <span className="text-slate-500">
                                  {new Date(step.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] mt-1">{step.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Issue Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#A41034]" />
                <span>Report Campus Problem</span>
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tree fell blocking Hostel D path / Water cooler leaking"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034] shadow-xs"
                  >
                    <option value="Hostel Maintenance & Grounds">Hostel & Grounds (Tree falls, Roads, etc.)</option>
                    <option value="Water Cooler & Plumbing">Water Cooler & Plumbing</option>
                    <option value="WiFi & IT Infrastructure">WiFi & IT Infrastructure</option>
                    <option value="Classroom AV & Electronics">Classroom AV & Projectors</option>
                    <option value="Sanitation & Hygiene">Sanitation & Restrooms</option>
                    <option value="Electrical Maintenance Cell">Electrical & Lights</option>
                    <option value="Safety & Campus Hazards">Safety & Campus Hazards</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#A41034] shadow-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Immediate Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Location Marker / Building & Room
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Block D Main Pathway / Academic Block B Room 204"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Detailed Problem Description
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe what happened, any risk, blockage, or urgency..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#A41034] shadow-xs"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-800 font-semibold flex items-center gap-1.5 text-xs">
                    <Camera className="w-3.5 h-3.5 text-[#A41034]" />
                    <span>Attach Photo</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                      Optional
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500">Not all issues require a picture</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                  Helpful for tree falls, damaged infrastructure, or leaks. You can skip this if not applicable.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#A41034] file:text-white hover:file:bg-[#880E2D] cursor-pointer focus:outline-none"
                />

                {imagePreview && (
                  <div className="mt-2.5 relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeSelectedPhoto}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/85 hover:bg-rose-600 text-white rounded-lg transition"
                      title="Remove attached photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-white">
                      Photo ready for upload
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-[#A41034] leading-relaxed">
                Smart routing will assign this ticket immediately to the relevant facilities team. You'll receive real-time updates as progress is logged.
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition shadow-sm ${
                    isSubmitting
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#A41034] hover:bg-[#880E2D] shadow-[#A41034]/20'
                  }`}
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Submit Campus Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#A41034]" />
                Attached Issue Photo Evidence
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden mt-2">
              <img
                src={lightboxImage}
                alt="Enlarged issue evidence"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
