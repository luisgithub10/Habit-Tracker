import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Lightbulb, Sparkles, Clock, CheckCircle, Database } from 'lucide-react';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  timestamp: string;
  status: 'Pending Sync' | 'Synced';
}

interface RequestFeatureViewProps {
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}

export default function RequestFeatureView({ bgTheme }: RequestFeatureViewProps) {
  const isDarkBg = bgTheme && bgTheme !== 'none';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Routine Improvement');
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Load saved feature requests from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_feature_requests');
      if (stored) {
        setRequests(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load feature requests:', e);
    }
  }, []);

  // Save requests to localStorage when they change
  const saveRequests = (updated: FeatureRequest[]) => {
    setRequests(updated);
    try {
      localStorage.setItem('pwa_habits_tracker_feature_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to preserve feature requests:', e);
    }
  };

  const getPanelClass = (additional = '') => {
    return `backdrop-blur-md rounded-2xl border transition-all duration-300 ${
      isDarkBg
        ? 'bg-white/85 border-white/60 shadow-lg'
        : 'bg-white border-neutral-150 shadow-xs'
    } ${additional}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      return;
    }

    const newRequest: FeatureRequest = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Pending Sync',
    };

    const updated = [newRequest, ...requests];
    saveRequests(updated);

    // Reset Form & Show Success Banner
    setTitle('');
    setDescription('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4500);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="request-feature-container">
      {/* Introduction Card */}
      <div className={getPanelClass("p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-5")}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-100/40 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none" />

        <div className="p-3.5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl text-white shadow-md shrink-0 relative z-10">
          <Lightbulb className="w-7 h-7" />
        </div>

        <div className="text-center md:text-left space-y-1 relative z-10 flex-1">
          <h2 className="text-lg font-black tracking-tight text-neutral-900 leading-none">Request New Features</h2>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest font-mono">Build with us • Shape the Tracker’s future</p>
          <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-xl pt-1">
            Explain what metrics, habits, rewards, or visual interfaces you would like to see in your routine loop. 
            Your suggestions are preserved locally and will sync instantly to the server database once connected.
          </p>
        </div>
      </div>

      {/* Main Form & Success Toast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className={getPanelClass("p-5 sm:p-6 space-y-5")} id="feature-request-form">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">
              💡 Feature Proposal Form
            </h3>

            {/* Success Banner */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-3xs"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="leading-tight">Thank you! Your feature request has been compiled successfully.</p>
                    <p className="text-[10px] font-medium text-emerald-600 mt-0.5">Stored in local queue ready for sync when external database is connected.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-50 border border-red-150 text-red-800 rounded-xl text-xs font-extrabold"
                >
                  ⚠️ Please fill in both the title and detail description fields.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category selection */}
            <div className="space-y-1.5 animate-slide-up">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block font-mono">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Routine Improvement',
                  'Task Scheduling',
                  'Mood & Feelings',
                  'Theme & Visuals',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 text-left text-[11px] font-bold rounded-xl border transition-all ${
                      category === cat
                        ? 'bg-violet-950 text-white border-violet-950'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title field */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block font-mono">
                Feature Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Apple Watch Sync, Custom Sound Uploads..."
                className="w-full text-xs font-bold border border-neutral-200 focus:border-neutral-900 rounded-xl px-4 py-3 bg-neutral-50/70 text-neutral-800 focus:outline-hidden transition-all duration-200 shadow-3xs"
              />
            </div>

            {/* Detail field */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block font-mono">
                What features would you like to see?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Please explain in detail why this feature is helpful and how it should work..."
                className="w-full text-xs font-bold border border-neutral-200 focus:border-neutral-900 rounded-xl px-4 py-3 bg-neutral-50/70 text-neutral-800 focus:outline-hidden transition-all duration-200 shadow-3xs"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 border border-violet-950 bg-violet-950 hover:bg-violet-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Suggestion
              </button>
            </div>
          </form>
        </div>

        {/* Side Panel: Local Sync Queue Status */}
        <div className="space-y-4">
          <div className={getPanelClass("p-4 space-y-3")}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-mono border-b border-neutral-100 pb-2">
              <Database className="w-3.5 h-3.5 text-violet-500" />
              <span>Sync Status</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-semibold">Local Queue Size</span>
                <span className="font-extrabold text-neutral-800">{requests.length} items</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-semibold">Network Target</span>
                <span className="font-black text-amber-600 uppercase text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                  Standalone / Local
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 font-medium leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                ⚠️ Once the external database is integrated, these locally curated proposals will automatically batch-sync to the central system.
              </div>
            </div>
          </div>

          <div className={getPanelClass("p-4 space-y-3")}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Why Request?</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              We build this loop around actual, daily productivity challenges. 
              Each suggestion is checked and directly helps us shape optimal sound feedback, goal configurations, and trends indicators!
            </p>
          </div>
        </div>
      </div>

      {/* Previously requested list */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono block">
          📋 My Submitted Requests ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <div className={getPanelClass("p-8 text-center")}>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wide">No feature requests submitted yet</p>
            <p className="text-[11px] text-neutral-500 font-medium max-w-sm mx-auto mt-1">
              Use the builder form above to suggest your first tracker mechanism, custom category, or aesthetic layout!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className={getPanelClass("p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform duration-200")}>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                      {req.category}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 font-semibold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {req.timestamp}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-neutral-900 text-sm truncate">{req.title}</h4>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed pr-4">
                    {req.description}
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-150 px-2.5 py-1 rounded-full font-mono">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending Sync
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
