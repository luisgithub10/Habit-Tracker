import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Award, Flame, Zap, Target, Calendar, Dumbbell, 
  Brain, Heart, BookOpen, Coins, CheckCircle, Lightbulb, Compass, RotateCcw,
  CheckSquare
} from 'lucide-react';
import { Habit, HabitCompletion, Mood, MoodLog, Task } from '../types';

interface InsightsViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  moods: Mood[];
  moodLogs: MoodLog[];
  tasks: Task[];
  dailyGoal: number;
  bgTheme?: 'none' | 'light_blue' | 'light_pink' | 'light_green';
}

const CATEGORIES = [
  { name: 'Fitness', icon: Dumbbell, color: 'text-rose-500', fill: 'bg-rose-500', track: 'bg-rose-50' },
  { name: 'Mind', icon: Brain, color: 'text-violet-500', fill: 'bg-violet-500', track: 'bg-violet-50' },
  { name: 'Health', icon: Heart, color: 'text-teal-500', fill: 'bg-teal-500', track: 'bg-teal-50' },
  { name: 'Productivity', icon: BookOpen, color: 'text-amber-500', fill: 'bg-amber-500', track: 'bg-amber-50' },
  { name: 'Finance', icon: Coins, color: 'text-sky-500', fill: 'bg-sky-500', track: 'bg-sky-50' },
];

export default function InsightsView({ habits, completions, moods, moodLogs, tasks = [], dailyGoal, bgTheme }: InsightsViewProps) {
  // Sunday to Saturday counts for weekly task accomplishments metrics
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Dynamic glassmorphic background configurations matching user request
  const getPanelClass = (additionalClasses = '', borderOverride = '') => {
    if (bgTheme === 'light_blue') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-3xs ${additionalClasses}`;
    }
    if (bgTheme === 'light_pink') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-3xs ${additionalClasses}`;
    }
    if (bgTheme === 'light_green') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-emerald-200/50'} shadow-3xs ${additionalClasses}`;
    }
    return `bg-neutral-100/80 rounded-2xl border ${borderOverride || 'border-neutral-200/60'} shadow-3xs ${additionalClasses}`;
  };

  const getListItemClass = () => {
    if (bgTheme === 'light_blue') {
      return 'flex items-center justify-between p-2 rounded-xl bg-white/65 border border-sky-100 hover:bg-white/85 transition-all';
    }
    if (bgTheme === 'light_pink') {
      return 'flex items-center justify-between p-2 rounded-xl bg-white/65 border border-pink-100 hover:bg-white/85 transition-all';
    }
    if (bgTheme === 'light_green') {
      return 'flex items-center justify-between p-2 rounded-xl bg-white/65 border border-emerald-100 hover:bg-white/85 transition-all';
    }
    return 'flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/55 transition-all';
  };

  // Calculate total historical completions count
  const totalCompletionsCount = completions.length;
  
  // Calculate Sunday to Saturday of current week to handle the weekly resets automatically
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday...
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
  }, [completions]);

  // Completions that match active week dates (starts Sunday, automatically resets to 0 weekly)
  const weeklyCompletions = React.useMemo(() => {
    return completions.filter(c => currentWeekDates.includes(c.date));
  }, [completions, currentWeekDates]);

  // Today's date string under local time (automatically resets to 0 daily!)
  const todayStr = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, [completions]);

  const taskcompletionsByDay = React.useMemo(() => {
    return currentWeekDates.map((dateStr, idx) => {
      const dayTasks = tasks.filter(t => t.date === dateStr);
      const accomplishedCount = dayTasks.filter(t => t.status === 'Done').length;
      const totalCount = dayTasks.length;
      return {
        date: dateStr,
        dayName: weekDayNames[idx],
        completed: accomplishedCount,
        total: totalCount,
      };
    });
  }, [tasks, currentWeekDates, weekDayNames]);

  const totalWeeklyDoneTasks = React.useMemo(() => {
    return taskcompletionsByDay.reduce((acc, curr) => acc + curr.completed, 0);
  }, [taskcompletionsByDay]);

  const totalWeeklyCreatedTasks = React.useMemo(() => {
    return taskcompletionsByDay.reduce((acc, curr) => acc + curr.total, 0);
  }, [taskcompletionsByDay]);

  const weeklyPercentage = totalWeeklyCreatedTasks > 0 
    ? Math.round((totalWeeklyDoneTasks / totalWeeklyCreatedTasks) * 100) 
    : 0;

  const maxDoneCount = Math.max(...taskcompletionsByDay.map(d => d.completed), 1);

  const dailyCompletions = React.useMemo(() => {
    return completions.filter(c => c.date === todayStr);
  }, [completions, todayStr]);

  const isHabitActiveOnDate = (habit: Habit, date: string): boolean => {
    return !habit.activeDates || habit.activeDates.includes(date);
  };

  // Overall 14-day rolling consistency (generic reference metric)
  const calculateOverallConsistency = () => {
    if (habits.length === 0) return 0;
    
    const uniqueDatesList: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      uniqueDatesList.push(d.toISOString().split('T')[0]);
    }
    
    let possibleCompletionsCount = 0;
    uniqueDatesList.forEach(dateStr => {
      possibleCompletionsCount += habits.filter(h => isHabitActiveOnDate(h, dateStr)).length;
    });
    
    if (possibleCompletionsCount === 0) return 0;
    
    const uniqueDatesSet = new Set(uniqueDatesList);
    let actualCompletionsInWindow = completions.filter(c => uniqueDatesSet.has(c.date)).length;
    
    return Math.round((actualCompletionsInWindow / possibleCompletionsCount) * 100);
  };

  const consistencyRate = calculateOverallConsistency();

  // Habit rankings computed strictly by the quantity of check marks completed in current week (resetting daily to 0, weekly start Sunday)
  const getHabitRankings = () => {
    if (habits.length === 0) return [];
    
    return habits.map(h => {
      const count = weeklyCompletions.filter(c => c.habitId === h.id).length;
      return {
        ...h,
        completionCount: count
      };
    }).sort((a, b) => b.completionCount - a.completionCount);
};

const getHabitColorTheme = (colorName: string) => {
  const name = (colorName || 'violet').toLowerCase();
  switch (name) {
    case 'rose':
      return { color: 'text-rose-500', fill: 'bg-rose-500', track: 'bg-rose-50' };
    case 'violet':
      return { color: 'text-violet-500', fill: 'bg-violet-500', track: 'bg-violet-50' };
    case 'teal':
      return { color: 'text-teal-500', fill: 'bg-teal-500', track: 'bg-teal-50' };
    case 'amber':
      return { color: 'text-amber-500', fill: 'bg-amber-500', track: 'bg-amber-50' };
    case 'sky':
    default:
      return { color: 'text-sky-500', fill: 'bg-sky-500', track: 'bg-sky-50' };
  }
};

  const habitStats = getHabitRankings();
  const starHabit = habitStats.length > 0 && habitStats[0].completionCount > 0 ? habitStats[0] : null;

  // Category performance (using weekly completions)
  const getCategoryPerformance = () => {
    return CATEGORIES.map(cat => {
      const categoryHabits = habits.filter(h => h.category === cat.name);
      if (categoryHabits.length === 0) {
        return { ...cat, rate: 0, habitCount: 0 };
      }
      
      const categoryHabitIds = new Set(categoryHabits.map(h => h.id));
      const categoryCompletions = weeklyCompletions.filter(c => categoryHabitIds.has(c.habitId)).length;
      
      // Total potential completions in current week (7 days) based on active days
      let potential = 0;
      currentWeekDates.forEach(dateStr => {
        potential += categoryHabits.filter(h => isHabitActiveOnDate(h, dateStr)).length;
      });
      
      const rate = potential > 0 ? Math.min(100, Math.round((categoryCompletions / potential) * 100)) : 0;
      const themeColors = getHabitColorTheme(categoryHabits[0]?.color);
      
      return {
        ...cat,
        color: themeColors.color,
        fill: themeColors.fill,
        track: themeColors.track,
        rate,
        habitCount: categoryHabits.length
      };
    }).filter(c => c.habitCount > 0);
  };

  const categoryStats = getCategoryPerformance();

  const moodStats = React.useMemo(() => {
    const weeklyLogs = moodLogs.filter(l => currentWeekDates.includes(l.timestamp.split('T')[0]));
    const defaults: Record<string, { name: string; emoji: string; color: string }> = {
      m1: { name: 'Happy', emoji: '😊', color: 'rose' },
      m2: { name: 'Neutral', emoji: '😐', color: 'sky' },
      m3: { name: 'Sad', emoji: '😢', color: 'violet' },
    };

    const statsMap: Record<string, { id: string; name: string; emoji: string; color: string; count: number }> = {};
    
    // Seed with active moods
    moods.forEach(m => {
      statsMap[m.id] = { id: m.id, name: m.name, emoji: m.emoji, color: m.color, count: 0 };
    });

    // Populate with actual log entries
    weeklyLogs.forEach(l => {
      const activeMood = moods.find(m => m.id === l.moodId);
      const defaultVal = defaults[l.moodId] || { name: 'Custom Mood', emoji: '💬', color: 'sky' };
      const name = activeMood?.name || l.moodName || defaultVal.name;
      const emoji = activeMood?.emoji || l.moodEmoji || defaultVal.emoji;
      const color = activeMood?.color || defaultVal.color;

      if (!statsMap[l.moodId]) {
        statsMap[l.moodId] = { id: l.moodId, name, emoji, color, count: 0 };
      }
      statsMap[l.moodId].count += 1;
    });

    return Object.values(statsMap)
      .filter(m => m.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [moodLogs, moods, currentWeekDates]);

  // Streak calculations (Active streak based on daily checklist logs)
  const calculateCurrentActiveStreak = () => {
    if (completions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDateToCheck = new Date(today);
    
    while (true) {
      const dateStr = currentDateToCheck.toISOString().split('T')[0];
      const hasCompletedHabits = completions.some(c => c.date === dateStr);
      
      if (hasCompletedHabits) {
        streak++;
        currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      } else {
        // Fallback for today if they didn't check today but did check yesterday
        if (streak === 0 && dateStr === today.toISOString().split('T')[0]) {
          currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
          continue;
        }
        break;
      }
    }
    
    return streak;
  };

  const activeStreak = calculateCurrentActiveStreak();

  // Dynamic coaching advice
  const getCoachingAdvice = () => {
    if (habits.length === 0) {
      return "Start building consistency. Navigate to Today and create your first essential habit.";
    }
    if (starHabit && starHabit.completionCount > 0) {
      return `Splendid! "${starHabit.name}" is your highest scoring habit with ${starHabit.completionCount} accomplishments this week. Draw inspiration from it!`;
    }
    if (consistencyRate > dailyGoal) {
      return `Outstanding effort! You are exceeding your milestone consistency target. Keep feeding the fire!`;
    }
    return 'Checking small habits early in the morning builds momentum. Tick your habits under Today to watch this dashboard update in real-time!';
  };

  return (
    <div className="space-y-6" id="insights-view-container">
      
      {/* Visual Header with Alert */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-3" id="insights-head-wrapper">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-neutral-800 tracking-tight flex items-center gap-2">
            Performance Insights <Zap className="w-5 h-5 text-indigo-500 fill-indigo-100" />
          </h2>
          <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">
            ⚠️ <span className="text-indigo-800 font-extrabold">Weekly Reset Notice:</span> All tracker data will be reset every week starting Sunday to Monday. Today's counter resets to 0 daily.
          </p>
        </div>
      </div>

      {/* Dynamic coaching advise strip */}
      <div className="bg-neutral-900 rounded-2xl p-5 text-white flex items-start gap-4">
        <span className="p-2 rounded-xl bg-neutral-800 shrink-0 text-amber-400 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </span>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Coaching Wisdom</h4>
          <p className="text-xs mt-1.5 text-neutral-200 leading-relaxed font-normal">
            {getCoachingAdvice()}
          </p>
        </div>
      </div>

      {/* Visual Line Break Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-neutral-50 px-3 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
            Task Analytics Stream
          </span>
        </div>
      </div>

      {/* Full-Width Task Tracker Insights Panel */}
      <div className={getPanelClass("p-6 space-y-6")}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-650">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-neutral-805">
                Task Analitics
              </h3>
              <p className="text-xs font-bold text-neutral-700">Completions and goals tracked for the current week.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-xs font-bold">
            <div className="text-neutral-500">
              Done: <span className="text-indigo-600 font-extrabold">{totalWeeklyDoneTasks}</span> / <span className="text-neutral-700">{totalWeeklyCreatedTasks}</span>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
              {weeklyPercentage}% Achieved
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown of the entire week */}
          <div className="space-y-4 lg:border-r border-neutral-100 lg:pr-6">
            <h4 className="text-xs font-black uppercase text-neutral-450 tracking-wider">Weekly Status Distribution</h4>
            <div className="space-y-2.5">
              {['TO-DO', 'In Progress', 'Blocked', 'Review', 'Done'].map(statusKey => {
                const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
                const statusTasks = weekTasks.filter(t => t.status === statusKey);
                const pct = weekTasks.length > 0 ? Math.round((statusTasks.length / weekTasks.length) * 100) : 0;
                
                const colors: Record<string, string> = {
                  'TO-DO': 'bg-neutral-400',
                  'In Progress': 'bg-sky-500',
                  'Blocked': 'bg-rose-500',
                  'Review': 'bg-amber-500',
                  'Done': 'bg-emerald-500',
                };

                return (
                  <div key={statusKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-neutral-600">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors[statusKey] || 'bg-neutral-400'}`} />
                        {statusKey}
                      </span>
                      <span className="font-bold">{statusTasks.length} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colors[statusKey] || 'bg-neutral-400'} transition-all duration-300`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertical Bar Chart Panel */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <h4 className="text-xs font-black uppercase text-neutral-455 tracking-wider mb-2">Weekly Task Accomplishment Chart</h4>
            
            <div className="flex items-end justify-between gap-1 h-36 pt-4 border-b border-neutral-200 px-2">
              {taskcompletionsByDay.map(d => {
                const heightPct = maxDoneCount > 0 ? (d.completed / maxDoneCount) * 85 : 0;
                const isTodayStr = d.date === todayStr;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {d.completed} of {d.total} tasks Done
                    </div>

                    {/* Stacked bar or standard done bar */}
                    <div className="w-full max-w-[32px] h-28 flex flex-col justify-end bg-neutral-100/60 rounded-t-lg overflow-hidden relative border border-dashed border-neutral-200">
                      {d.total > 0 ? (
                        <>
                          <div className="absolute inset-0 bg-neutral-200/50" />
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-500 absolute bottom-0 ${
                              d.completed === d.total && d.total > 0 
                                ? 'bg-emerald-500' 
                                : 'bg-indigo-500'
                            }`} 
                            style={{ height: `${heightPct}%` }}
                          />
                        </>
                      ) : null}
                    </div>

                    {/* Day Label */}
                    <span className={`text-[10px] font-extrabold mt-2 ${
                      isTodayStr ? 'text-indigo-600 underline decoration-2 underline-offset-4' : 'text-neutral-500'
                    }`}>
                      {d.dayName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status footer hints */}
            <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-2 font-bold px-1">
              <span>* Hover/tap bars to see daily completions breakdown</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-md" /> Day Perfect</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-md" /> Partial</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Line Break Divider for Habit Group */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-neutral-50 px-3 text-[10px] font-bold text-violet-600 uppercase tracking-widest">
            Habit Performance & Rankings
          </span>
        </div>
      </div>

      {/* Visual KPI Metrics Dashboard (Belongs to Habit group now) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's check marks (Resets daily to 0) */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Completed Today</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{dailyCompletions.length}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Resets to 0 daily at midnight</p>
          </div>
        </div>

        {/* KPI 2: Active streak */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Streak</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
              <Flame className="w-4 h-4 fill-rose-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{activeStreak} {activeStreak === 1 ? 'day' : 'days'}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Consecutive days tracking</p>
          </div>
        </div>

        {/* KPI 3: Completions this week */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">This Week</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{weeklyCompletions.length}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Completions starting Sunday</p>
          </div>
        </div>

        {/* KPI 4: Top performing habit */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Star Performer</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
              <Award className="w-4 h-4 text-amber-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-bold truncate text-neutral-800 tracking-tight">{starHabit ? starHabit.name : 'None'}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">
              {starHabit ? `${starHabit.completionCount} checks this week` : 'Ranked by weekly checks'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Category breakdown (Weekly Habit Focus, formerly Focus-Area Vectors) */}
        <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" /> Habit Focus Categories
            </h3>
            <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Your current weekly habit focus-area completions distribution.</p>
          </div>

          <div className="space-y-4 pt-2">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No weekly completions yet. Tick off checklists on the Today page to view weekly focus scores.</p>
            ) : (
              categoryStats.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-neutral-700">
                        <CategoryIcon className={`w-3.5 h-3.5 ${cat.color}`} /> {cat.name}
                        <span className="text-[10px] text-neutral-400 font-semibold">({cat.habitCount} {cat.habitCount === 1 ? 'habit' : 'habits'})</span>
                      </span>
                      <span className="font-bold text-neutral-700">{cat.rate}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${cat.track} w-full overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${cat.fill} transition-all duration-500`}
                        style={{ width: `${cat.rate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Habit Rankings (Right, grouped with Category Performance) */}
        <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Habit Rankings
            </h3>
            <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Ranked purely by total check marks logged during the current week.</p>
          </div>

          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {habitStats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Your list is blank. Add habits and complete checklists to view rankings here.</p>
            ) : (
              habitStats.map((h, i) => (
                <div key={h.id} className={getListItemClass()}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-neutral-400 w-5 text-center">
                      #{i + 1}
                    </span>
                    <span className="text-xs font-bold text-neutral-700 truncate min-w-0">
                      {h.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      h.completionCount > 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {h.completionCount} {h.completionCount === 1 ? 'check' : 'checks'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Line Break Divider for Mood Group */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-neutral-50 px-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest">
            Mood Tracker Insights
          </span>
        </div>
      </div>

      {/* Mood Trends (Last, separated as requested) */}
      <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
        <div>
           <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> Mood Trends
          </h3>
          <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Most frequent moods of the active week.</p>
        </div>
        <div className="space-y-2">
          {moodStats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No mood logs this week.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {moodStats.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3.5 bg-white/60 border border-neutral-100/70 hover:border-neutral-200/50 rounded-xl transition-all shadow-3xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="font-extrabold text-xs text-neutral-800 uppercase tracking-tight">{m.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-neutral-100 px-2.5 py-0.5 rounded-full text-neutral-600">{m.count} logs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
