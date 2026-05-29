import React, { useState } from 'react';
import { 
  CheckCircle2, CheckSquare, Heart, Sparkles, TrendingUp, Award, 
  Check, Info, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface TrackerDefinition {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'core' | 'analytics';
  color: string;
}

interface TrackersLibraryViewProps {
  selectedTrackers: string[];
  onToggleTracker: (key: string) => void;
  bgTheme?: string;
}

const GET_PANEL_CLASS = (theme: string | undefined, additionalClasses = '', borderOverride = '') => {
  if (theme === 'light_blue') {
    return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-xs ${additionalClasses}`;
  }
  if (theme === 'light_pink') {
    return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-xs ${additionalClasses}`;
  }
  if (theme === 'light_green') {
    return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-emerald-200/50'} shadow-xs ${additionalClasses}`;
  }
  return `bg-white rounded-2xl border ${borderOverride || 'border-neutral-200'} shadow-sm ${additionalClasses}`;
};

export default function TrackersLibraryView({ 
  selectedTrackers, 
  onToggleTracker, 
  bgTheme 
}: TrackersLibraryViewProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trackerItems: TrackerDefinition[] = [
    {
      key: 'habits',
      label: 'Habits Tracker',
      description: 'Log and monitor daily or weekly routines, custom intervals, streaks and consistency targets.',
      icon: CheckCircle2,
      type: 'core',
      color: 'text-violet-600 bg-violet-50 border-violet-100'
    },
    {
      key: 'tasks',
      label: 'Tasks List',
      description: 'Manage prioritized detailed checklists, progress bars, workflow status boards and reward point rules.',
      icon: CheckSquare,
      type: 'core',
      color: 'text-sky-600 bg-sky-50 border-sky-100'
    },
    {
      key: 'mood',
      label: 'Moods & Reflection',
      description: 'Reflect heavily on daily mood vibes, jot emotional diaries and note persistent feeling trends.',
      icon: Heart,
      type: 'core',
      color: 'text-rose-600 bg-rose-50 border-rose-100'
    }
  ];

  // Group trackers
  const coreTrackers = trackerItems;

  // Count core selected currently
  const coreSelectedCount = selectedTrackers.filter(key => coreTrackers.some(t => t.key === key)).length;

  const handleToggle = (tracker: TrackerDefinition) => {
    const isSelected = selectedTrackers.includes(tracker.key);
    setErrorMsg(null);

    if (!isSelected) {
      if (coreSelectedCount >= 3) {
        setErrorMsg("Cannot select more than 3 trackers.");
        return;
      }
    } else {
      // Trying to deselect: ensure we don't leave the navbar completely empty
      if (selectedTrackers.length <= 1) {
        setErrorMsg("You must keep at least one tracker active in your app interface.");
        return;
      }
    }

    onToggleTracker(tracker.key);
  };

  const renderTrackerCard = (tracker: TrackerDefinition) => {
    const isSelected = selectedTrackers.includes(tracker.key);
    const TrackerIcon = tracker.icon;
    const isDisabled = !isSelected && coreSelectedCount >= 3;

    return (
      <div 
        key={tracker.key}
        onClick={() => !isDisabled && handleToggle(tracker)}
        className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-4 ${
          isSelected 
            ? 'shadow-lg border-neutral-300' 
            : isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:opacity-95'
        }`}
        style={{
          backgroundColor: isSelected ? '#ffffff' : '#858383',
          borderColor: isSelected ? '#d4d4d4' : '#71717a',
        }}
        id={`tracker-card-${tracker.key}`}
      >
        {/* Left icon component */}
        <div 
          className={`p-2.5 rounded-xl border shrink-0 ${
            isSelected 
              ? tracker.color
              : 'text-white'
          }`}
          style={!isSelected ? { backgroundColor: '#6e6c6c', borderColor: '#5e5c5c' } : undefined}
        >
          <TrackerIcon className="w-5 h-5" />
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className={`text-sm font-black tracking-tight leading-none ${
              isSelected ? 'text-neutral-900' : 'text-white'
            }`}>
              {tracker.label}
            </h4>
            {isSelected && (
              <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-0.5 uppercase z-10 animate-pulse">
                <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
              </span>
            )}
            {isDisabled && (
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                Limit (3)
              </span>
            )}
          </div>
          <p className={`text-xs font-semibold mt-1.5 leading-normal ${
            isSelected ? 'text-neutral-500' : 'text-neutral-150'
          }`}>
            {tracker.description}
          </p>
        </div>

        {/* Custom checkmark indicator box on the right */}
        <div className="shrink-0 pt-0.5">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-emerald-600 border-emerald-600 text-white' 
              : 'border-white bg-transparent text-transparent hover:border-neutral-200'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="trackers-library-root">
      {/* Banner Intro summary layout design */}
      <div className={GET_PANEL_CLASS(bgTheme, "p-5 relative overflow-hidden flex flex-col md:flex-row items-start gap-4 md:gap-5")}>
        <div className="absolute top-0 right-0 w-36 h-36 bg-neutral-200/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 text-neutral-600 shrink-0 shadow-xs" id="library-lead-badge-box">
          <ShieldCheck className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1 z-10">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight leading-none">Trackers Library</h2>
          <p className="text-xs font-semibold text-neutral-500 max-w-xl leading-relaxed mt-1">
            Pick and turn on your preferred core tracker panels to display in your navigation or main app screen workspace.
          </p>
        </div>
      </div>

      {/* Error / Limit warning panel */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-150 bg-rose-50/70 text-rose-800 flex items-start gap-2.5 text-xs font-bold animate-shake" id="library-limit-warning">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <span>{errorMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)}
            className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-700 underline shrink-0 cursor-pointer"
          >
            Okay
          </button>
        </div>
      )}

      {/* Core Trackers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-black text-neutral-700 tracking-wider uppercase">CORE ACTION TRACKERS</h3>
          </div>
          <span className="text-[10px] font-bold text-neutral-450 font-mono bg-neutral-200/50 px-2.5 py-1 rounded-md">
            {coreSelectedCount} / 3 Selected
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {coreTrackers.map(renderTrackerCard)}
        </div>
      </div>
    </div>
  );
}
