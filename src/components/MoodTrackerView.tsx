import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, GripVertical, Plus, Check, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Mood, MoodLog } from '../types';

interface MoodTrackerViewProps {
  moods: Mood[];
  moodLogs: MoodLog[];
  onAddMoodLog: (moodId: string) => void;
  onDeleteMoodLog: (logId: string) => void;
  onUpdateMoodLog: (logId: string, note: string) => void;
  onAddMood: (mood: Omit<Mood, 'id' | 'order'>) => void;
  onDeleteMood: (id: string) => void;
  onUpdateMood: (mood: Mood) => void;
  onMoveMood: (id: string, direction: 'up' | 'down') => void;
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}
//... Omitted for brevity, will use multi_edit or be careful in edit_file.
// Actually, let's just use MultiEdit to handle the changes in MoodTrackerView at once.

const AFFIRMATION_QUOTES = [
  "You are capable of doing difficult things with grace and strength.",
  "Every small step you take today builds the foundation of your future self.",
  "Consistency is not about perfection; it’s about showing up for yourself.",
  "Your potential is limitless. Cultivate your daily habits with patience.",
  "You are worthy of the time and energy it takes to grow and heal.",
  "Believe in your progress, even when it feels quiet or invisible.",
  "One positive thought in the morning can change your entire afternoon.",
  "Make your well-being a priority; you cannot pour from an empty cup.",
  "Every positive choice you make is a vote for the person you wish to become.",
  "You have the power to write a wonderful story for yourself today.",
  "Your mind is a powerful thing. When you fill it with positive thoughts, your life starts to change.",
  "Mistakes are proof that you are trying. Treat yourself with kindness and keep moving forward.",
  "Deep breaths, steady steps. You are exactly where you need to be in your journey.",
  "The only person you should try to be better than is the person you were yesterday.",
  "You bring a unique light to this world. Never underestimate the value of your presence.",
  "Your habits define your future. Even the smallest choice to stay on track is a magnificent achievement.",
  "Be gentle with yourself. You are doing the best you can with what you have.",
  "Peace begins with an inner breath and a conscious decision to let go of what you cannot control.",
  "Every day is another opportunity to discover your strengths and celebrate your progress.",
  "Success is the sum of small efforts, repeated day in and day out. Trust your process."
];

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

const MOOD_EMOJIS = [
  { emoji: '😊', name: 'Happy' },
  { emoji: '😐', name: 'Neutral' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '😍', name: 'Love' },
  { emoji: '😡', name: 'Angry' },
  { emoji: '😱', name: 'Scared' },
  { emoji: '🤤', name: 'Hungry' },
  { emoji: '😴', name: 'Tired' },
  { emoji: '😎', name: 'Cool' },
  { emoji: '🤢', name: 'Sick' },
  { emoji: '🤩', name: 'Excited' },
  { emoji: '🤑', name: 'Rich' }
];

export default function MoodTrackerView({ moods, moodLogs, onAddMoodLog, onDeleteMoodLog, onUpdateMoodLog, onAddMood, onDeleteMood, onUpdateMood, onMoveMood, bgTheme }: MoodTrackerViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'insights'>('tracker');
  const [selectedMoodId, setSelectedMoodId] = useState<string>(moods[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodEmoji, setNewMoodEmoji] = useState({ emoji: '😊', name: 'Happy' });
  const [affirmationQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * AFFIRMATION_QUOTES.length);
    return AFFIRMATION_QUOTES[randomIndex];
  });
  const [activeOverlays, setActiveOverlays] = useState<{ [moodId: string]: boolean }>({});

  const handleAddMoodClick = (moodId: string) => {
    onAddMoodLog(moodId);
    setActiveOverlays(prev => ({ ...prev, [moodId]: true }));
    setTimeout(() => {
      setActiveOverlays(prev => ({ ...prev, [moodId]: false }));
    }, 1000);
  };
  const selectedMood = moods.find(m => m.id === selectedMoodId) || moods[0];

  const getDatesCarousel = () => {
    const dates = [];
    const today = new Date();
    // From 6 days ago (i = 6) up to today (i = 0), excluding tomorrow
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isToday = d.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      const tomorrowObj = new Date(today);
      tomorrowObj.setDate(today.getDate() + 1);
      const isTomorrow = d.toISOString().split('T')[0] === tomorrowObj.toISOString().split('T')[0];
      
      dates.push({
        iso: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday,
        isTomorrow
      });
    }
    return dates;
  };
  const datesCarousel = getDatesCarousel();

  const getTodayLogs = () => {
    return moodLogs.filter(log => log.timestamp.split('T')[0] === selectedDate).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const selectedDateLabel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) return 'Today';
    
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
    if (selectedDate === tomorrowStr) return 'Tomorrow';
    
    const dateObj = new Date(selectedDate + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Mood insights calculations
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const currentWeekDates = React.useMemo(() => {
    const start = getStartOfWeek();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [moodLogs]);

  const moodTrendsList = React.useMemo(() => {
    const weeklyLogs = moodLogs.filter(log => currentWeekDates.includes(log.timestamp.split('T')[0]));
    const counts: { [key: string]: number } = {};
    weeklyLogs.forEach(log => {
      counts[log.moodName] = (counts[log.moodName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([moodName, count]) => {
        const matchingMood = moods.find(m => m.name === moodName);
        return {
          moodName,
          count,
          emoji: matchingMood ? matchingMood.emoji : '😐'
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [moodLogs, currentWeekDates, moods]);

  // 14-day Mood logging frequency frequency count
  const getPast14Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateSeries = getPast14Days();

  const moodDailyCounts = React.useMemo(() => {
    return dateSeries.map(date => {
      const dayLogs = moodLogs.filter(log => log.timestamp.split('T')[0] === date).length;
      return {
        date,
        count: dayLogs
      };
    });
  }, [moodLogs, dateSeries]);

  const maxLogCount = Math.max(...moodDailyCounts.map(d => d.count), 1);

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-neutral-100/60 hover:bg-neutral-200 text-neutral-400';
    if (count >= 3) return 'bg-rose-500 hover:bg-rose-605 text-white';
    if (count >= 2) return 'bg-rose-300 hover:bg-rose-405 text-neutral-850';
    return 'bg-rose-150 hover:bg-rose-250 text-neutral-800';
  };

  return (
    <div className="space-y-6 pb-20" id="mood-tracker-container">
      {/* Segment switcher tab */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/85 border border-neutral-200/50 max-w-xs shadow-3xs" id="mood-subtab-bar">
        <button
          type="button"
          onClick={() => setActiveSubTab('tracker')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tracker'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="mood-tab-logger"
        >
          📝 Moods
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('insights')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'insights'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="mood-tab-insights"
        >
          📊 Insights & Trends
        </button>
      </div>

      {activeSubTab === 'tracker' ? (
        <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-neutral-800 tracking-tight">Mood Tracker</h2>
      
      {/* Interactive Week Carousel */}
      <div className={GET_PANEL_CLASS(bgTheme, "p-4")}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Mood Schedule</h3>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
            {selectedDateLabel()}
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {datesCarousel.map((item) => {
            const isSelected = item.iso === selectedDate;
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDate(item.iso)}
                className={`py-3 px-1.5 rounded-xl flex flex-col items-center justify-between transition-all outline-hidden cursor-pointer ${
                  isSelected 
                    ? 'bg-neutral-900 text-white shadow-xs scale-102 font-medium' 
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-100'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${
                  item.isToday 
                    ? 'text-emerald-600 font-extrabold animate-pulse' 
                    : isSelected 
                      ? 'text-neutral-450' 
                      : 'text-neutral-500'
                }`}>
                  {item.dayName}
                </span>
                <span className="text-sm font-extrabold my-1">{item.dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tracker Log */}
      <div className={GET_PANEL_CLASS(bgTheme, "p-5")}>
        <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider mb-4">Moods for {selectedDateLabel()}</h3>
        <div className="space-y-3">
          {getTodayLogs().map(log => {
            const mood = moods.find(m => m.id === log.moodId);
            const defaults: Record<string, { name: string; emoji: string }> = {
              m1: { name: 'Happy', emoji: '😊' },
              m2: { name: 'Neutral', emoji: '😐' },
              m3: { name: 'Sad', emoji: '😢' },
            };
            const defaultValues = defaults[log.moodId] || { name: 'Custom Mood', emoji: '💬' };
            const finalEmoji = mood?.emoji || log.moodEmoji || defaultValues.emoji;
            const finalName = mood?.name || log.moodName || defaultValues.name;

            return (
              <div key={log.id} className="flex flex-col p-4 bg-neutral-50 rounded-xl border border-neutral-100 gap-3">
                <div className="flex items-center justify-between w-full font-sans">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl bg-white p-2 rounded-lg border border-neutral-100">{finalEmoji}</span>
                    <span className="font-extrabold text-black text-sm uppercase">{finalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-neutral-500 font-bold bg-neutral-200/50 px-2.5 py-1 rounded-md">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <button onClick={() => onDeleteMoodLog(log.id)} className="text-neutral-400 hover:text-red-500 transition-colors p-1" title="Delete log">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Note Field: white background, larger, and highly visible */}
                <div className="w-full">
                  <input 
                    type="text" 
                    placeholder="Add a note or comment on how you feel..." 
                    className="w-full bg-white text-neutral-800 placeholder-neutral-400 px-3 py-2 rounded-lg border border-neutral-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                    value={log.note || ''}
                    onChange={(e) => onUpdateMoodLog(log.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Affirmation Quotes panel - matching coaching wisdom color and design */}
      <div className="bg-neutral-900 rounded-2xl p-5 text-white flex items-start gap-4">
        <span className="p-2 rounded-xl bg-neutral-800 shrink-0 text-rose-400 mt-0.5 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </span>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Daily Affirmations</h4>
          <p className="text-xs mt-1.5 text-neutral-200 leading-relaxed font-normal italic">
            "{affirmationQuote}"
          </p>
        </div>
      </div>

      <hr className="my-8 border-neutral-200" />                

      <div className={GET_PANEL_CLASS(bgTheme, "p-5")}>
        <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider mb-4">Mood Configuration</h3>
        
        <div className="space-y-3">
          {[...moods].sort((a, b) => a.order - b.order).map((mood) => (
            <div key={mood.id} className="flex flex-col p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 gap-2.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-white p-2 rounded-lg border border-neutral-100">{mood.emoji}</span>
                  <span className="font-extrabold text-black uppercase tracking-tight text-sm">{mood.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => onMoveMood(mood.id, 'up')} className="text-neutral-400 hover:text-neutral-600 p-0.5" title="Move up"><ChevronUp className="w-4 h-4"/></button>
                    <button onClick={() => onMoveMood(mood.id, 'down')} className="text-neutral-400 hover:text-neutral-600 p-0.5" title="Move down"><ChevronDown className="w-4 h-4"/></button>
                  </div>
                  <button 
                    onClick={() => onDeleteMood(mood.id)} 
                    className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-neutral-200 transition-colors shrink-0 cursor-pointer"
                    title="Delete mood"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative pb-0">
                <button 
                  onClick={() => handleAddMoodClick(mood.id)} 
                  className="w-full text-xs font-bold text-center text-teal-600 bg-teal-50 hover:bg-teal-100 py-2 rounded-xl border border-teal-200 transition-colors cursor-pointer"
                >
                  Add for This Day
                </button>
                <AnimatePresence>
                  {activeOverlays[mood.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 4 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 text-center pointer-events-none z-10"
                    >
                      <span className="inline-block bg-teal-600/95 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm border border-teal-500/20">
                        Send to above
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

       <div className={GET_PANEL_CLASS(bgTheme, "p-5")}>
        <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider mb-4">Configure New Mood</h3>
        <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Mood Name (e.g. Joyful)" 
              value={newMoodName} 
              onChange={(e) => setNewMoodName(e.target.value)} 
              className="w-full bg-white text-neutral-900 placeholder-neutral-400 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-3xs" 
            />
            <div className="flex flex-wrap gap-2 pt-1">
                {MOOD_EMOJIS.map(m => {
                  const isSelected = newMoodEmoji.emoji === m.emoji;
                  return (
                    <div 
                      key={m.emoji} 
                      onClick={() => setNewMoodEmoji(m)} 
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 shadow-3xs w-16 ${
                        isSelected 
                          ? 'bg-indigo-50/40 border-2 border-indigo-500 ring-1 ring-indigo-100 scale-102' 
                          : 'bg-white hover:bg-neutral-50 border border-neutral-200/70 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-2xl filter drop-shadow-3xs">{m.emoji}</span>
                      <span className="text-[9px] font-black uppercase text-black tracking-wider text-center select-none truncate w-full">{m.name}</span>
                    </div>
                  );
                })}
            </div>
            <button 
              onClick={() => { onAddMood({ name: newMoodName || newMoodEmoji.name, emoji: newMoodEmoji.emoji, color: 'sky' }); setNewMoodName(''); }} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              SAVE MOOD
            </button>
        </div>
      </div>
      </div>
      ) : (
        <div className="space-y-6 animate-fadeIn" id="mood-insights-tab-content">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={GET_PANEL_CLASS(bgTheme, "p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Total Mood Logs</span>
              <div className="mt-2 text-3xl font-black text-neutral-800">{moodLogs.length} logs</div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Recorded feelings count</p>
            </div>

            <div className={GET_PANEL_CLASS(bgTheme, "p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Most Logged Feeling</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                {moodTrendsList.length > 0 ? (
                  <>
                    <span className="text-2xl">{moodTrendsList[0].emoji}</span>
                    <span className="text-xl font-black text-rose-600 truncate">{moodTrendsList[0].moodName}</span>
                  </>
                ) : (
                  <span className="text-sm font-extrabold text-neutral-400">No logs yet</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Focus weekly vibe</p>
            </div>

            <div className={GET_PANEL_CLASS(bgTheme, "p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Avg Daily Logging</span>
              <div className="mt-2 text-2xl font-black text-teal-700">
                {(moodLogs.length / 14).toFixed(1)} / day
              </div>
              <p className="text-[10px] font-bold text-teal-600 mt-1">✓ Log frequency index</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Box: Mood Frequency Leaderboard */}
            <div className={GET_PANEL_CLASS(bgTheme, "p-5 space-y-4")}>
              <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Weekly Mood Distribution</h4>
              <div className="space-y-4">
                {moodTrendsList.length > 0 ? (
                  moodTrendsList.map((item, idx) => {
                    const totalLogsWeHave = moodLogs.length || 1;
                    const pct = Math.round((item.count / totalLogsWeHave) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-neutral-700 flex items-center gap-1.5"><span>{item.emoji}</span> {item.moodName}</span>
                          <span className="text-neutral-500">{item.count} times ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs font-extrabold text-neutral-400 py-3 text-center">Log feelings inside the logger checklist to analyse mood frequency trends.</p>
                )}
              </div>
            </div>

            {/* Right Box: 14-Day Logging Frequency bar chart */}
            <div className={GET_PANEL_CLASS(bgTheme, "p-5 space-y-4")}>
              <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">14-Day Logging Frequency</h4>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-7 gap-2.5 max-w-sm">
                  {moodDailyCounts.map((day, i) => {
                    const dt = new Date(day.date + 'T00:00:00');
                    const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div
                        key={i}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex flex-col justify-center items-center font-mono text-[9px] font-bold border transition relative group cursor-help ${getIntensityColor(day.count)}`}
                      >
                        <span>{dt.getDate()}</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-neutral-900 text-white font-mono text-[8px] font-extrabold px-2 py-1 rounded-md z-15 whitespace-nowrap shadow-md">
                          {label}: {day.count} mood logs
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-500 justify-end max-w-sm mt-1">
                  <span>Less</span>
                  <div className="w-3 h-3 bg-neutral-100 rounded-sm border border-neutral-200" />
                  <div className="w-3 h-3 bg-rose-150 rounded-sm" />
                  <div className="w-3 h-3 bg-rose-300 rounded-sm" />
                  <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Mood notes list */}
          <div className={GET_PANEL_CLASS(bgTheme, "p-5 space-y-4")}>
            <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Vibe Log History (Notes)</h4>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {moodLogs.length > 0 ? (
                [...moodLogs].slice(-10).reverse().map((log) => {
                  const mood = moods.find(m => m.id === log.moodId);
                  const matchingMoodPreset = MOOD_EMOJIS.find(me => me.name === log.moodName) || { emoji: '😊' };
                  const finalEmoji = mood?.emoji || log.moodEmoji || matchingMoodPreset.emoji;
                  const finalName = mood?.name || log.moodName || 'Feeling';
                  const logDate = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id} className="p-3.5 bg-neutral-50/50 rounded-xl border border-neutral-150/65 flex flex-col gap-2">
                      <div className="flex items-center justify-between font-sans">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl bg-white px-1.5 py-1 rounded-md border border-neutral-200/50">{finalEmoji}</span>
                          <span className="font-extrabold text-neutral-800 text-xs uppercase">{finalName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-neutral-500 font-bold bg-neutral-200/40 px-2.5 py-1 rounded-md">{logDate}</span>
                          <button onClick={() => onDeleteMoodLog(log.id)} className="text-neutral-400 hover:text-red-500 p-1 transition" title="Delete entry">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {log.note ? (
                        <p className="text-xs text-neutral-700 bg-white border border-neutral-200/50 rounded-lg p-2 font-medium italic">
                          "{log.note}"
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-400 italic">No notes logged for this mood.</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs font-extrabold text-neutral-400 py-3 text-center">Your logged mood notes history list will output here once created.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
