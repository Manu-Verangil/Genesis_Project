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
  Filter
} from 'lucide-react';
import { api } from '../api';

export function CampusIssuesView() {
  const [issues, setIssues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedIssueId, setExpandedIssueId] = useState('iss-1');

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Water Cooler & Plumbing',
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
    'Water Cooler & Plumbing',
    'WiFi & IT Infrastructure',
    'Classroom AV & Electronics',
    'Sanitation & Hygiene',
    'Electrical Maintenance Cell'
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
          category: 'Water Cooler & Plumbing',
          location: '',
          description: '',
          priority: 'Medium',
          photoUrl: ''
        });
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
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Step Process Banner from Slide 5 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Campus Issue Resolution System</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Slide 5 Lifecycle
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              "Raise it. Track it. Get it resolved." — Full transparency from report to closure
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Raise A Campus Problem</span>
          </button>
        </div>

        {/* 5-Stage Visual Workflow Stepper from Slide 5 */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stages.map((st, idx) => (
            <div
              key={st.num}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {st.num}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Step {st.num}</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-white text-xs">{st.title}</h5>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{st.desc}</p>
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
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
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Issues List with 5-Stage Live Progress */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading campus issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
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
                className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all ${
                  isExpanded ? 'border-blue-500/50' : 'border-slate-800 hover:border-slate-700'
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
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {issue.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityColor(
                            issue.priority
                          )}`}
                        >
                          {issue.priority} Priority
                        </span>
                        <span className="text-slate-400 text-xs">• {issue.category}</span>
                      </div>

                      <h4 className="font-bold text-white text-base mt-1">{issue.title}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          {issue.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
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

                {/* 5-Stage Live Interactive Stepper (Slide 5: Report -> Route -> Act -> Notify -> Resolve) */}
                <div className="px-5 pb-5">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="grid grid-cols-5 gap-2 relative">
                      {stages.map((st) => {
                        const isDone = st.num <= currentStage;
                        const isCurrent = st.num === currentStage;

                        return (
                          <div key={st.num} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 shadow-md ${
                                isCurrent
                                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}
                            >
                              {isDone && !isCurrent ? '✓' : st.num}
                            </div>
                            <span
                              className={`mt-1.5 text-[11px] font-bold ${
                                isCurrent
                                  ? 'text-blue-300'
                                  : isDone
                                  ? 'text-emerald-400'
                                  : 'text-slate-500'
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
                  <div className="p-5 pt-0 border-t border-slate-800/80 mt-2 space-y-4 text-xs animate-in fade-in">
                    <div>
                      <h5 className="font-bold text-slate-300 mb-1">Problem Description:</h5>
                      <p className="text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    {/* Timeline History */}
                    <div>
                      <h5 className="font-bold text-slate-300 mb-2">Resolution Timeline History:</h5>
                      <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                        {issue.timeline?.map((step, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/30">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-white">
                                  Stage: {step.stage} • {step.actor}
                                </span>
                                <span className="text-slate-400">
                                  {new Date(step.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px] mt-1">{step.message}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Report Campus Problem (Slide 5)</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water cooler leaking on 3rd floor"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Water Cooler & Plumbing">Water Cooler & Plumbing</option>
                    <option value="WiFi & IT Infrastructure">WiFi & IT Infrastructure</option>
                    <option value="Classroom AV & Electronics">Classroom AV & Projectors</option>
                    <option value="Sanitation & Hygiene">Sanitation & Restrooms</option>
                    <option value="Electrical Maintenance Cell">Electrical & Lights</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Location Marker / Building & Room
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic Block B, 3rd Floor East Corridor"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Problem Description
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe what is broken, risk, or symptoms..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-relaxed">
                Smart routing will assign this ticket immediately to the relevant facilities team. You'll receive real-time push alerts as progress is logged.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition shadow-lg ${
                    isSubmitting
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
                  }`}
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Submit Campus Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
