import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Calendar, Sparkles, Dumbbell, Brain, Heart, BookOpen, Coins, Award, Trophy,
  Save, HelpCircle, RotateCcw, Plus, Trash2, Edit2, Timer, ToggleRight, PlusCircle, X, ChevronUp, ChevronDown
} from 'lucide-react';
import { Habit, HabitCompletion, HabitProgress, AppSettings } from '../types';

interface HabitsViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  progress: HabitProgress[];
  onToggleHabit: (habitId: string, date: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateProgress: (habitId: string, date: string, value: number) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>, targetDate?: string) => void;
  userName: string;
  onClearDayCompletions: (date: string) => void;
  bgTheme?: 'none' | 'light_blue' | 'light_pink' | 'light_green';
  subtaskCompletions: { [key: string]: boolean };
  onAddSubtask: (habitId: string, text: string) => void;
  onDeleteSubtask: (habitId: string, subtaskId: string) => void;
  onToggleSubtask: (subtaskId: string, date: string) => void;
  onToggleHabitActiveDate: (habitId: string, date: string) => void;
  settings?: AppSettings;
}

const CATEGORIES = [
  { name: 'Fitness', icon: Dumbbell, color: 'text-rose-500 bg-rose-50 border-rose-100' },
  { name: 'Mind', icon: Brain, color: 'text-violet-500 bg-violet-50 border-violet-100' },
  { name: 'Health', icon: Heart, color: 'text-teal-500 bg-teal-50 border-teal-100' },
  { name: 'Productivity', icon: BookOpen, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  { name: 'Finance', icon: Coins, color: 'text-sky-500 bg-sky-50 border-sky-100' },
];

const COLORS = [
  { name: 'sky', border: 'border-sky-200', text: 'text-sky-600', bg: 'bg-sky-500 hover:bg-sky-600' },
  { name: 'rose', border: 'border-rose-200', text: 'text-rose-600', bg: 'bg-rose-500 hover:bg-rose-600' },
  { name: 'violet', border: 'border-violet-200', text: 'text-violet-600', bg: 'bg-violet-500 hover:bg-violet-600' },
  { name: 'teal', border: 'border-teal-200', text: 'text-teal-600', bg: 'bg-teal-500 hover:bg-teal-600' },
  { name: 'amber', border: 'border-amber-200', text: 'text-amber-600', bg: 'bg-amber-500 hover:bg-amber-600' },
];

export const getHabitColorClasses = (colorName: string) => {
  const name = (colorName || 'sky').toLowerCase();
  switch (name) {
    case 'rose':
      return 'text-rose-500 bg-rose-50 border-rose-100';
    case 'violet':
      return 'text-violet-500 bg-violet-50 border-violet-100';
    case 'teal':
      return 'text-teal-500 bg-teal-50 border-teal-100';
    case 'amber':
      return 'text-amber-500 bg-amber-50 border-amber-100';
    case 'sky':
    default:
      return 'text-sky-500 bg-sky-50 border-sky-100';
  }
};

const formatMinutes = (minutes: number): string => {
  if (minutes === 0) return '0 mins';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    if (mins > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${hrs} hr`;
  }
  return `${mins} min`;
};

const playCompletionSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.12, start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    
    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.3, 'sine'); // C5
    playTone(659.25, now + 0.08, 0.3, 'sine'); // E5
    playTone(783.99, now + 0.16, 0.4, 'sine'); // G5
  } catch (err) {
    console.debug('AudioContext not allowed or not supported', err);
  }
};

export default function HabitsView({
  habits,
  completions,
  progress,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onUpdateProgress,
  onAddHabit,
  userName,
  onClearDayCompletions,
  bgTheme,
  subtaskCompletions,
  onAddSubtask,
  onDeleteSubtask,
  onToggleSubtask,
  onToggleHabitActiveDate,
  settings
}: HabitsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'insights'>('tracker');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ date: string; rate: number; index: number } | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // State elements for HABIT CREATOR panel at the top
  const [creatorName, setCreatorName] = useState('');
  const [creatorGoalType, setCreatorGoalType] = useState<'time' | 'quantity' | 'on_off'>('time');
  const [creatorTimeHours, setCreatorTimeHours] = useState(1);
  const [creatorTimeMinutes, setCreatorTimeMinutes] = useState(15);
  const [creatorQtyUnit, setCreatorQtyUnit] = useState('cups');
  const [creatorQtyMaxGoal, setCreatorQtyMaxGoal] = useState(5);
  const [creatorCategory, setCreatorCategory] = useState('Health');
  const [creatorColor, setCreatorColor] = useState('sky');
  const [creatorSubtaskText, setCreatorSubtaskText] = useState('');
  const [creatorSubtasks, setCreatorSubtasks] = useState<string[]>([]);

  // Editing states support
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<{ [habitId: string]: string }>({});

  // Input validation error animations support
  const [creatorNameError, setCreatorNameError] = useState(false);
  const [subtaskErrors, setSubtaskErrors] = useState<{ [habitId: string]: boolean }>({});
  const [showAddedOverlay, setShowAddedOverlay] = useState(false);
  const [showClearedFeedback, setShowClearedFeedback] = useState(false);
  const [expandedHabitIds, setExpandedHabitIds] = useState<{ [habitId: string]: boolean }>({});

  const toggleHabitExpansion = (habitId: string) => {
    setExpandedHabitIds(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  // Dynamic glassmorphic background configurations
  const getPanelClass = (additionalClasses = '', borderOverride = '') => {
    if (bgTheme === 'light_blue') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-sm ${additionalClasses}`;
    }
    if (bgTheme === 'light_pink') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-sm ${additionalClasses}`;
    }
    if (bgTheme === 'light_green') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-emerald-200/50'} shadow-sm ${additionalClasses}`;
    }
    return `bg-neutral-100/80 rounded-2xl border ${borderOverride || 'border-neutral-200/60'} shadow-sm ${additionalClasses}`;
  };

  const getHabitItemClass = () => {
    if (bgTheme === 'light_blue') {
      return 'bg-white/90 backdrop-blur-xs text-neutral-800 rounded-2xl p-4 border border-sky-200/80 shadow-md transition-all flex flex-col space-y-3';
    }
    if (bgTheme === 'light_pink') {
      return 'bg-white/90 backdrop-blur-xs text-neutral-800 rounded-2xl p-4 border border-pink-200/80 shadow-md transition-all flex flex-col space-y-3';
    }
    if (bgTheme === 'light_green') {
      return 'bg-white/90 backdrop-blur-xs text-neutral-800 rounded-2xl p-4 border border-emerald-200/80 shadow-md transition-all flex flex-col space-y-3';
    }
    return 'bg-white text-neutral-800 rounded-2xl p-4 border border-neutral-200 shadow-sm transition-all flex flex-col space-y-3';
  };

  const getInnerPanelClass = () => {
    if (bgTheme === 'light_blue') {
      return 'bg-sky-50/50 rounded-xl p-3 border border-sky-100 flex flex-row items-center justify-between gap-3';
    }
    if (bgTheme === 'light_pink') {
      return 'bg-pink-50/50 rounded-xl p-3 border border-pink-100 flex flex-row items-center justify-between gap-3';
    }
    if (bgTheme === 'light_green') {
      return 'bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex flex-row items-center justify-between gap-3';
    }
    return 'bg-neutral-50 rounded-xl p-3 border border-neutral-250 flex flex-row items-center justify-between gap-3';
  };

  // Generate date carousel items (last 6 days and today, excluding tomorrow)
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

  // Retrieve current metrics
  const isHabitCompletedForDate = (habitId: string, date: string): boolean => {
    return completions.some(c => c.habitId === habitId && c.date === date);
  };

  const getHabitProgressValue = (habitId: string, date: string): number => {
    const record = progress.find(p => p.habitId === habitId && p.date === date);
    return record ? record.value : 0;
  };

  const isHabitActiveOnDate = (habit: Habit, date: string): boolean => {
    // If no activeDates are listed, the habit is active every single day
    if (!habit.activeDates || habit.activeDates.length === 0) {
      return true;
    }

    // Direct match: habit is active on this day
    if (habit.activeDates.includes(date)) {
      return true;
    }

    // Carry over: any habit created/active on a day should show on the following day
    const dObj = new Date(date + 'T00:00:00');
    dObj.setDate(dObj.getDate() - 1);
    const prevDateStr = dObj.toISOString().split('T')[0];

    if (habit.activeDates.includes(prevDateStr)) {
      return true;
    }

    return false;
  };

  const activeHabits = habits.filter(h => isHabitActiveOnDate(h, selectedDate));

  const selectedCompletionsCount = activeHabits.filter(h => isHabitCompletedForDate(h.id, selectedDate)).length;
  const selectedCompletionRate = activeHabits.length > 0 
    ? Math.round((selectedCompletionsCount / activeHabits.length) * 100) 
    : 0;

  const getCategoryDetails = (catName: string) => {
    const found = CATEGORIES.find(c => c.name === catName);
    return found || { icon: HelpCircle, color: 'text-neutral-500 bg-neutral-50 border-neutral-100' };
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

  // Click handler to Toggle completion status, accompanied by secure sound + device vibration
  const handleToggleCheck = (habitId: string) => {
    const isCompleted = isHabitCompletedForDate(habitId, selectedDate);
    const nextCompleted = !isCompleted;
    
    if (nextCompleted) {
      if (settings?.soundEnabled) {
        playCompletionSound();
      }
      if (settings?.hapticFeedback && window.navigator && window.navigator.vibrate) {
        try {
          window.navigator.vibrate([100, 50, 100]);
        } catch (e) {
          // Safe skip frame sandboxed protection
        }
      }
    }
    onToggleHabit(habitId, selectedDate);
  };

  // Click handler to create habit via creator
  const handleCreateHabitSubmit = () => {
    if (!creatorName.trim()) {
      setCreatorNameError(true);
      alert("Please enter a habit name.");
      return;
    }
    
    const minutesVal = (creatorTimeHours * 60) + creatorTimeMinutes;
    onAddHabit({
      name: creatorName.trim(),
      description: creatorGoalType === 'time'
        ? `If you to go to the gym and want it as a habit set a time habit.`
        : creatorGoalType === 'quantity'
          ? `Select Quantity e.g., water intake, book pages read task creation.`
          : `For simple task just create and On Off check mark.`,
      category: creatorCategory,
      frequency: 'daily',
      color: creatorColor,
      icon: creatorGoalType === 'time' 
        ? 'Clock' 
        : creatorGoalType === 'quantity' 
          ? 'Heart' 
          : 'Brain',
      habitType: creatorGoalType === 'quantity' ? 'quantity' : (creatorGoalType === 'time' ? 'time' : 'on_off'),
      timeGoal: creatorGoalType === 'time' ? minutesVal : undefined,
      quantityGoal: creatorGoalType === 'quantity' ? creatorQtyMaxGoal : undefined,
      quantityUnit: creatorGoalType === 'quantity' ? creatorQtyUnit : undefined,
      rewardAmount: 5.0,
      subtasks: creatorSubtasks.map((text, idx) => ({
        id: `subtask-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        text: text.trim()
      }))
    }, selectedDate);

    // Display temporary success feedback overlay for 1 second
    setShowAddedOverlay(true);
    setTimeout(() => {
      setShowAddedOverlay(false);
    }, 1000);

    // Reset fields
    setCreatorName('');
    setCreatorNameError(false);
    setCreatorSubtasks([]);
    setCreatorSubtaskText('');
  };

  // Add draft subtask of creator
  const handleAddCreatorSubtask = () => {
    if (!creatorSubtaskText.trim()) return;
    setCreatorSubtasks([...creatorSubtasks, creatorSubtaskText.trim()]);
    setCreatorSubtaskText('');
  };

  // Delete draft subtask of creator
  const handleDeleteCreatorSubtask = (index: number) => {
    setCreatorSubtasks(creatorSubtasks.filter((_, i) => i !== index));
  };

  // Add subtask for already created habit
  const handleAddSubtaskSubmit = (habitId: string) => {
    const text = newSubtaskInputs[habitId] || '';
    if (!text.trim()) {
      setSubtaskErrors(prev => ({ ...prev, [habitId]: true }));
      alert("Please enter a task name for the optional subtask.");
      return;
    }
    onAddSubtask(habitId, text.trim());
    setNewSubtaskInputs(prev => ({ ...prev, [habitId]: '' }));
    setSubtaskErrors(prev => ({ ...prev, [habitId]: false }));
  };

  // Direct edit changes from cards
  const handleDirectFieldUpdate = (habit: Habit, updatedFields: Partial<Habit>) => {
    onEditHabit({
      ...habit,
      ...updatedFields
    });
  };

  // 1. Weekly calculations for Habit stats
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
  }, [completions]);

  const weeklyCompletions = React.useMemo(() => {
    return completions.filter(c => currentWeekDates.includes(c.date));
  }, [completions, currentWeekDates]);

  const todayStr = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, [completions]);

  const dailyCompletions = React.useMemo(() => {
    return completions.filter(c => c.date === todayStr);
  }, [completions, todayStr]);

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

  const getHabitRankings = () => {
    if (habits.length === 0) return [];
    return habits.map(h => {
      const count = weeklyCompletions.filter(c => c.habitId === h.id).length;
      return { ...h, completionCount: count };
    }).sort((a, b) => b.completionCount - a.completionCount);
  };

  const habitStats = getHabitRankings();
  const starHabit = habitStats.length > 0 && habitStats[0].completionCount > 0 ? habitStats[0] : null;

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

  const getCategoryPerformance = () => {
    const CATEGORIES_INFO = [
      { name: 'Fitness', fontIcon: 'Dumbbell' },
      { name: 'Mind', fontIcon: 'Brain' },
      { name: 'Health', fontIcon: 'Heart' },
      { name: 'Productivity', fontIcon: 'BookOpen' },
      { name: 'Finance', fontIcon: 'Coins' },
    ];
    return CATEGORIES_INFO.map(cat => {
      const categoryHabits = habits.filter(h => h.category === cat.name);
      if (categoryHabits.length === 0) {
        return { ...cat, rate: 0, habitCount: 0, color: '', fill: '', track: '' };
      }
      const categoryHabitIds = new Set(categoryHabits.map(h => h.id));
      const categoryCompletions = weeklyCompletions.filter(c => categoryHabitIds.has(c.habitId)).length;
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

  const getDailyRates = () => {
    return dateSeries.map(date => {
      const dayCompletions = completions.filter(c => c.date === date).length;
      const dayActiveHabits = habits.filter(h => isHabitActiveOnDate(h, date));
      const total = dayActiveHabits.length;
      const rate = total > 0 ? Math.round((dayCompletions / total) * 100) : 0;
      return { date, rate, completed: dayCompletions, total };
    });
  };

  const dailyRates = getDailyRates();

  const getHeatmapGrid = () => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const completedCount = completions.filter(c => c.date === iso).length;
      const dayActiveHabits = habits.filter(h => isHabitActiveOnDate(h, iso));
      const total = dayActiveHabits.length;
      const rate = total > 0 ? (completedCount / total) : 0;
      days.push({
        date: iso,
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        rate,
        completedCount
      });
    }
    return days;
  };

  const heatmapDays = getHeatmapGrid();

  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const getSvgCoordinates = () => {
    const points: { x: number; y: number; date: string; rate: number; index: number }[] = [];
    const chartWidth = width - (paddingX * 2);
    const chartHeight = height - (paddingY * 2);
    dailyRates.forEach((item, index) => {
      const x = paddingX + (index * (chartWidth / (dailyRates.length - 1)));
      const y = (height - paddingY) - (item.rate / 100 * chartHeight);
      points.push({ x, y, date: item.date, rate: item.rate, index });
    });
    return points;
  };

  const chartPoints = getSvgCoordinates();

  const getSvgPath = () => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, point, index) => {
      const cmd = index === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${point.x} ${point.y}`;
    }, '');
  };

  const svgPathString = getSvgPath();

  const getAreaSvgPath = () => {
    if (chartPoints.length === 0) return '';
    return `${svgPathString} L ${chartPoints[chartPoints.length - 1].x} ${height - paddingY} L ${chartPoints[0].x} ${height - paddingY} Z`;
  };

  const areaPathString = getAreaSvgPath();

  const formatDateLabel = (isoStr: string) => {
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getIntensityColor = (rate: number) => {
    if (habits.length === 0 || rate === 0) return 'bg-neutral-100/60 hover:bg-neutral-200 text-neutral-400';
    if (rate >= 0.7) return 'bg-violet-600 hover:bg-violet-700 text-white';
    if (rate >= 0.4) return 'bg-violet-400 hover:bg-violet-500 text-white';
    if (rate > 0) return 'bg-violet-200 hover:bg-violet-300 text-neutral-800';
    return 'bg-neutral-150 hover:bg-neutral-250 text-neutral-500';
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="today-view-root">
      {/* Dynamic Status Progress Card */}
      <div className={getPanelClass("p-4 sm:p-6 flex flex-row justify-between items-center gap-3 sm:gap-4 w-full")}>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-extrabold text-neutral-800 tracking-tight flex items-center gap-1.5 sm:gap-2">
            Hello, {userName || 'Dreamer'} <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 animate-pulse" />
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-neutral-700 mt-1 truncate">
            {selectedDate === new Date().toISOString().split('T')[0] 
              ? "Let's track and log your custom habits." 
              : `Viewing log entries for ${selectedDateLabel()}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[9px] sm:text-xs font-bold text-neutral-700 block leading-tight">Daily Accomplishment</span>
            <span className="text-xs sm:text-sm font-black text-neutral-750">{selectedCompletionsCount} of {activeHabits.length} ({selectedCompletionRate}%)</span>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="text-neutral-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className="text-neutral-905 transition-all duration-500 ease-out text-violet-600"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - selectedCompletionRate / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-neutral-700">{selectedCompletionRate}%</span>
          </div>
        </div>
      </div>

      {/* Segment switcher tab under the Hello panel */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/85 border border-neutral-200/50 max-w-xs shadow-3xs" id="habits-subtab-bar">
        <button
          type="button"
          onClick={() => setActiveSubTab('tracker')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tracker'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="habits-tab-checklist"
        >
          📅 Habits
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('insights')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'insights'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="habits-tab-insights"
        >
          📊 Insights & Trends
        </button>
      </div>

      {activeSubTab === 'tracker' ? (
        <div className="space-y-6">

      {/* Interactive Week Carousel */}
      <div className={getPanelClass("p-4")}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Habit Schedule
          </h3>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
            {selectedDateLabel()}
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {datesCarousel.map((item) => {
            const isSelected = item.iso === selectedDate;
            const dayActiveHabits = habits.filter(h => isHabitActiveOnDate(h, item.iso));
            const dayComps = dayActiveHabits.filter(h => isHabitCompletedForDate(h.id, item.iso)).length;
            const completionRate = dayActiveHabits.length > 0 ? (dayComps / dayActiveHabits.length) : 0;
            
            return (
              <button
                key={item.iso}
                id={`date-${item.iso}`}
                onClick={() => setSelectedDate(item.iso)}
                className={`py-3 px-1.5 rounded-xl flex flex-col items-center justify-between transition-all outline-hidden text-center cursor-pointer ${
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
                <span className="text-sm font-extrabold my-1 leading-none">{item.dayNum}</span>
                <div className="flex gap-0.5 mt-0.5 items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    completionRate === 1 
                      ? 'bg-emerald-500' 
                      : completionRate >= 0.5 
                        ? 'bg-violet-500' 
                        : completionRate > 0 
                          ? 'bg-amber-400' 
                          : 'bg-neutral-300'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================
          ESSENTIAL HABITS FOR TODAY LIST (Styled Cards 2, 3, 4)
         ======================================================= */}
      <div className="space-y-4" id="essential-habits-output-list">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider">
            Essential Habits for {selectedDateLabel()} ({activeHabits.length})
          </h3>
        </div>

        {activeHabits.length === 0 && (
          <div className="bg-neutral-50 rounded-3xl p-10 text-center border-dashed border-2 border-neutral-200 flex flex-col items-center">
            <Award className="w-10 h-10 text-neutral-300 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-neutral-600 block">No Active Habits For This Day</span>
            <span className="text-xs text-neutral-400 mt-1 max-w-sm">
              Use the builder component below to configure and instantly create a custom habit for today!
            </span>
          </div>
        )}

        <div className="space-y-5">
          {activeHabits.map((habit) => {
            const isCompleted = isHabitCompletedForDate(habit.id, selectedDate);
            const progressVal = getHabitProgressValue(habit.id, selectedDate);
            const catInfo = getCategoryDetails(habit.category);

            // Compute values for controls
            const hoursPart = Math.floor((habit.timeGoal || 0) / 60);
            const minsPart = (habit.timeGoal || 0) % 60;

            const isHabitExpanded = !!expandedHabitIds[habit.id];

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={habit.id}
                className={getHabitItemClass()}
              >
                {/* Top Row (Line 1): Expandable header with Habit name, category, and description */}
                <div
                  onClick={(e) => {
                    if (e.target instanceof HTMLInputElement || e.target.closest('input')) return;
                    toggleHabitExpansion(habit.id);
                  }}
                  className="cursor-pointer hover:bg-neutral-50/60 p-1.5 -m-1.5 rounded-xl transition-all flex items-start gap-2 select-none min-w-0"
                >
                  {/* Inline chevron indicating expansion */}
                  <div className="mt-1 shrink-0 text-neutral-400 hover:text-neutral-700 transition">
                    {isHabitExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        maxLength={25}
                        value={habit.name}
                        onChange={(e) => handleDirectFieldUpdate(habit, { name: e.target.value.substring(0, 25) })}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[14px] font-extrabold text-neutral-900 border-b border-transparent focus:border-neutral-400 hover:bg-neutral-100/80 px-1 py-0.5 rounded-md outline-hidden bg-transparent mb-0.5 max-w-xs sm:max-w-md w-full"
                        placeholder="Habit Name"
                      />
                      <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-300 font-extrabold uppercase tracking-wider text-[9px] shrink-0">
                        {habit.category}
                      </span>
                      
                      {/* Habit Type badge placed next to Category */}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide font-mono ${
                        habit.habitType === 'time'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : habit.habitType === 'quantity'
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-violet-100 text-violet-700 border border-violet-200'
                      }`}>
                        {habit.habitType === 'time' ? 'TIME' : (habit.habitType === 'quantity' ? 'QUANTITY' : 'ON/OFF')}
                      </span>
                    </div>

                    {/* Description also in the top lines */}
                    {habit.description && (
                      <p className="text-[11px] font-semibold text-neutral-500 leading-tight mt-0.5 pl-1">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Row (Line 2): Habit actions: check mark, meta badges, and delete button on the far right */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-neutral-100/40 select-none">
                  {/* Check mark along with label, Goal Type and Reward in second line */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id={`btn-complete-${habit.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCheck(habit.id);
                      }}
                      className={`w-[30px] h-[30px] rounded-xl flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                        isCompleted
                          ? `border-emerald-500 bg-emerald-500 text-white shadow-xs`
                          : `border-neutral-300 hover:border-neutral-400 bg-white text-transparent`
                      }`}
                      title={isCompleted ? "Completed! Click to undo" : "Click to complete"}
                    >
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </button>
                    
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-neutral-500/80'}`}>
                      {isCompleted ? 'Goal Achieved!' : 'Complete'}
                    </span>

                    {/* Animated Trophy placed between the green check status and the delete icon */}
                    <motion.div
                      key={isCompleted ? "card-trophy-active" : "card-trophy-inactive"}
                      animate={isCompleted ? {
                        scale: [1, 1.25, 1],
                        rotate: [0, -10, 10, -10, 10, 0]
                      } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className={`p-1 border rounded-lg flex items-center justify-center shrink-0 w-7 h-7 transition-colors ${
                        isCompleted
                          ? 'bg-amber-100 border-amber-300 text-amber-500 shadow-xs'
                          : 'bg-white border-neutral-250 text-neutral-355'
                      }`}
                      title={isCompleted ? "Challenge Completed! 🏆" : "Locked Challenge"}
                    >
                      <Trophy className={`w-3.5 h-3.5 ${isCompleted ? 'stroke-[2.5] fill-amber-300' : 'stroke-2'}`} />
                    </motion.div>

                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-widest leading-none">
                      <span>5 PTS</span>
                    </span>
                  </div>

                  {/* Red circular delete button on right of second line */}
                  <button
                    id={`btn-delete-${habit.id}`}
                    type="button"
                    onClick={() => onDeleteHabit(habit.id)}
                    className="w-8 h-8 rounded-full bg-[#E12C2C] text-white flex items-center justify-center hover:bg-red-700 transition font-bold shadow-md cursor-pointer shrink-0"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isHabitExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-3 border-t border-neutral-100/50 mt-1 overflow-hidden"
                    >                {/* Middle section: Operational controllers as in standard mockup items */}
                {{
                  time: (
                    <div className={`${getInnerPanelClass()} flex flex-row items-center justify-between gap-4 p-3 relative flex-wrap sm:flex-nowrap`} id={`inner-panel-time-${habit.id}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono shrink-0">Duration:</span>
                        
                        {/* Hours & Minutes inputs in one line */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Hours */}
                          <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-1.5 h-8 shadow-3xs">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={hoursPart}
                              onChange={(e) => {
                                const hrs = Math.max(0, parseInt(e.target.value) || 0);
                                handleDirectFieldUpdate(habit, { timeGoal: (hrs * 60) + minsPart });
                              }}
                              className="w-6 text-center bg-transparent text-xs font-black outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="flex flex-col">
                              <button type="button" onClick={() => handleDirectFieldUpdate(habit, { timeGoal: ((hoursPart + 1) * 60) + minsPart })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-2.5 h-2.5" /></button>
                              <button type="button" onClick={() => handleDirectFieldUpdate(habit, { timeGoal: (Math.max(0, hoursPart - 1) * 60) + minsPart })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-2.5 h-2.5" /></button>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-450 mr-1">Hr</span>

                          {/* Minutes */}
                          <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-1.5 h-8 shadow-3xs">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={minsPart}
                              onChange={(e) => {
                                const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                handleDirectFieldUpdate(habit, { timeGoal: (hoursPart * 60) + m });
                              }}
                              className="w-6 text-center bg-transparent text-xs font-black outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="flex flex-col">
                              <button type="button" onClick={() => handleDirectFieldUpdate(habit, { timeGoal: (hoursPart * 60) + Math.min(59, minsPart + 5) })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-2.5 h-2.5" /></button>
                              <button type="button" onClick={() => handleDirectFieldUpdate(habit, { timeGoal: (hoursPart * 60) + Math.max(0, minsPart - 5) })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-2.5 h-2.5" /></button>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-450">Min</span>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] font-semibold text-neutral-500 leading-tight mt-1 pl-1 flex-1">
                          {habit.description}
                        </p>
                      </div>
                    </div>
                  ),
                  quantity: (
                    <div className={`${getInnerPanelClass()} flex flex-row items-center justify-between gap-4 p-3 relative flex-wrap sm:flex-nowrap`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 shrink-0 flex-row">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase">UNIT</span>
                            <input
                              type="text"
                              value={habit.quantityUnit || ''}
                              onChange={(e) => handleDirectFieldUpdate(habit, { quantityUnit: e.target.value })}
                              className="w-14 text-center border border-neutral-200 bg-white rounded-lg h-8 text-xs font-bold px-1"
                              title="Edit Unit"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase">MAX</span>
                            <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-1.5 h-8">
                              <input
                                type="number"
                                min="1"
                                value={habit.quantityGoal || 1}
                                onChange={(e) => handleDirectFieldUpdate(habit, { quantityGoal: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-7 text-center bg-transparent text-xs font-black outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex flex-col">
                                <button type="button" onClick={() => handleDirectFieldUpdate(habit, { quantityGoal: (habit.quantityGoal || 1) + 1 })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-2.5 h-2.5" /></button>
                                <button type="button" onClick={() => handleDirectFieldUpdate(habit, { quantityGoal: Math.max(1, (habit.quantityGoal || 1) - 1) })} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] font-semibold text-neutral-500 leading-tight truncate flex-1 min-w-0">
                          {habit.description}
                        </p>
                      </div>
                    </div>
                  ),
                  on_off: (
                    <div className={`${getInnerPanelClass()} flex flex-row items-center justify-between gap-4 p-3 relative flex-wrap sm:flex-nowrap`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-emerald-500">
                            <Check className="w-4 h-4 stroke-[3.5]" />
                          </span>
                          <span className="text-[10px] font-black uppercase text-emerald-600 font-mono tracking-wider">ON/OFF STATE</span>
                        </div>

                        <p className="text-[11px] font-semibold text-neutral-500 leading-tight truncate flex-1 min-w-0">
                          {habit.description}
                        </p>
                      </div>
                    </div>
                  )
                }[habit.habitType === 'time' ? 'time' : (habit.habitType === 'quantity' ? 'quantity' : 'on_off')]}

                {/* Optional Subtasks Section inside Card */}
                <div className="mt-1 space-y-3 pt-2.5 border-t border-dashed border-neutral-200/85">
                  
                  {/* List of existing subtasks */}
                  {(habit.subtasks || []).map((subtask) => {
                    const isSubtaskChecked = !!subtaskCompletions[`${selectedDate}_${subtask.id}`];
                    return (
                      <div key={subtask.id} className="flex items-center gap-2 sm:gap-3 w-full animate-fadeIn min-w-0">
                        <div className="flex-1 min-w-0 bg-neutral-50 rounded-xl p-2 sm:p-2.5 border border-neutral-200 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2 mt-0.5 mb-0.5 min-w-0 w-full">
                            <button
                              type="button"
                              onClick={() => onToggleSubtask(subtask.id, selectedDate)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                                isSubtaskChecked
                                  ? 'border-neutral-300 bg-neutral-150 text-neutral-600'
                                  : 'border-neutral-250 bg-white hover:border-neutral-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            </button>
                            <span className={`text-[11px] font-bold transition-all break-words min-w-0 flex-1 leading-snug ${isSubtaskChecked ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                              {subtask.text}
                            </span>
                          </div>
                        </div>
                        {/* Red circular delete button matching the mockup */}
                        <button
                          type="button"
                          onClick={() => onDeleteSubtask(habit.id, subtask.id)}
                          className="w-8 h-8 rounded-full bg-[#E12C2C] text-white flex items-center justify-center hover:bg-red-700 transition font-bold shadow-sm cursor-pointer shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add optional task input row */}
                  {(!habit.subtasks || habit.subtasks.length < 5) && (
                    <motion.div
                      animate={subtaskErrors[habit.id] ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-2 sm:gap-3 w-full min-w-0"
                    >
                      <div className={`flex-1 rounded-full p-1.5 px-3.5 border flex items-center gap-2 shadow-xs min-w-0 transition-all duration-200 ${
                        subtaskErrors[habit.id]
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : 'border-neutral-200 bg-white'
                      }`}>
                        <button
                          type="button"
                          onClick={() => handleAddSubtaskSubmit(habit.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ${
                            subtaskErrors[habit.id]
                              ? 'bg-red-200 text-red-700 hover:bg-red-300'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
                          }`}
                          title="Create task"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <input
                          type="text"
                          placeholder={subtaskErrors[habit.id] ? "❌ Enter task name first!" : "Add task optional"}
                          value={newSubtaskInputs[habit.id] || ''}
                          onChange={(e) => {
                            setNewSubtaskInputs({ ...newSubtaskInputs, [habit.id]: e.target.value });
                            if (subtaskErrors[habit.id]) {
                              setSubtaskErrors(prev => ({ ...prev, [habit.id]: false }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtaskSubmit(habit.id);
                            }
                          }}
                          className={`flex-1 bg-transparent text-xs font-bold outline-hidden h-8 py-1 min-w-0 transition-colors duration-200 ${
                            subtaskErrors[habit.id]
                              ? 'text-red-900 placeholder-red-400'
                              : 'text-neutral-800 placeholder-neutral-400'
                          }`}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {habits.length > 0 && (
          <div className="flex justify-center pt-4" id="clear-day-completions-container">
            <button
              id="btn-clear-day-completions"
              onClick={() => {
                onClearDayCompletions(selectedDate);
                setShowClearedFeedback(true);
                setTimeout(() => {
                  setShowClearedFeedback(false);
                }, 1000);
              }}
              className={`flex items-center gap-2 border font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all cursor-pointer shadow-sm ${
                showClearedFeedback
                  ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
              disabled={showClearedFeedback}
            >
              {showClearedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-white stroke-[3.5]" />
                  <span>Cleared successfully!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear all check marks ABOVE for this day</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* =======================================================
          UNIFIED HABIT CREATOR (Styled EXACTLY per standard mockup Card 1)
         ======================================================= */}
      <div className="bg-white text-neutral-800 rounded-3xl p-6 border border-neutral-300/80 shadow-md flex flex-col space-y-5 relative overflow-hidden" id="essential-panel-creator">
        
        <AnimatePresence>
          {showAddedOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl z-40 flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-3xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-black text-neutral-900 uppercase tracking-wide">Added - Check above list</h4>
              <p className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase">Target date: {selectedDate}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habit Creator header on very top - Static and permanently open */}
        <div className="border-b border-neutral-100 pb-2">
          <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider">
            Habit Creator
          </h3>
        </div>

        {/* Row 1: HABIT NAME Input field & Large green Plus button */}
        <div className="flex items-center justify-between gap-4">
          <motion.div
            animate={creatorNameError ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex-1 space-y-1.5"
          >
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest block font-mono transition-colors duration-200 ${
              creatorNameError ? 'text-red-500 animate-pulse' : 'text-neutral-400'
            }`}>
              HABIT NAME {creatorNameError && " (REQUIRED)"}
            </span>
            <input
              type="text"
              required
              maxLength={25}
              placeholder={creatorNameError ? "❌ Please enter a habit name first!" : "e.g., Gym Workout, Active Running"}
              value={creatorName}
              onChange={(e) => {
                setCreatorName(e.target.value);
                if (creatorNameError) setCreatorNameError(false);
              }}
              className={`w-full text-[14px] border rounded-xl px-4 py-3 outline-hidden font-semibold transition-all duration-200 ${
                creatorNameError 
                  ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-600'
                  : 'border-neutral-200 focus:border-neutral-900 bg-neutral-50 text-neutral-800'
              }`}
            />
          </motion.div>
          <button
            type="button"
            onClick={handleCreateHabitSubmit}
            className="w-14 h-14 rounded-full bg-[#22C55E] hover:bg-[#1f9d4b] text-white flex items-center justify-center transition-all duration-200 shadow-lg shrink-0 cursor-pointer hover:scale-105 active:scale-95"
            title="Create Habit"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Row 2: Goal Type buttons */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Goal Type:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCreatorGoalType('time')}
                  className={`text-[10px] sm:text-xs font-extrabold uppercase px-4 py-1.5 rounded-lg transition-all ${
                    creatorGoalType === 'time'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}
                >
                  TIME
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorGoalType('quantity')}
                  className={`text-[10px] sm:text-xs font-extrabold uppercase px-4 py-1.5 rounded-lg transition-all ${
                    creatorGoalType === 'quantity'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}
                >
                  QUANTITY
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorGoalType('on_off')}
                  className={`text-[10px] sm:text-xs font-extrabold uppercase px-4 py-1.5 rounded-lg transition-all ${
                    creatorGoalType === 'on_off'
                      ? 'bg-violet-500 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}
                >
                  ON/OFF
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Parameter Box & Advice depending on creatorGoalType */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
            <div className="w-full">
              {/* Config content */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                {creatorGoalType === 'time' && (
                  <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                    <div className="flex flex-row items-center gap-3 shrink-0">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Hour</span>
                        <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-2 h-9 w-16">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={creatorTimeHours}
                            onChange={(e) => setCreatorTimeHours(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center bg-transparent text-xs font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-hidden"
                          />
                          <div className="flex flex-col shrink-0">
                            <button type="button" onClick={() => setCreatorTimeHours(h => h + 1)} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-3 h-3" /></button>
                            <button type="button" onClick={() => setCreatorTimeHours(h => Math.max(0, h - 1))} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Min</span>
                        <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-2 h-9 w-16">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={creatorTimeMinutes}
                            onChange={(e) => setCreatorTimeMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                            className="w-full text-center bg-transparent text-xs font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-hidden"
                          />
                          <div className="flex flex-col shrink-0">
                            <button type="button" onClick={() => setCreatorTimeMinutes(m => Math.min(59, m + 5))} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-3 h-3" /></button>
                            <button type="button" onClick={() => setCreatorTimeMinutes(m => Math.max(0, m - 5))} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-500 leading-relaxed md:ml-2">
                      Use the time type when a duration is needed (e.g., gym sessions or tracking sleep duration).
                    </span>
                  </div>
                )}

                {creatorGoalType === 'quantity' && (
                  <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                    <div className="flex flex-row items-center gap-3 shrink-0">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">UNIT</span>
                        <input
                          type="text"
                          value={creatorQtyUnit}
                          onChange={(e) => setCreatorQtyUnit(e.target.value)}
                          className="w-20 border border-neutral-200 bg-white rounded-lg px-2 py-1.5 text-xs text-center font-bold h-9 outline-hidden"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">MAX GOAL</span>
                        <div className="flex items-center border border-neutral-200 bg-white rounded-lg px-2 h-9 w-16">
                          <input
                            type="number"
                            min="1"
                            value={creatorQtyMaxGoal}
                            onChange={(e) => setCreatorQtyMaxGoal(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-center bg-transparent text-xs font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-hidden"
                          />
                          <div className="flex flex-col shrink-0">
                            <button type="button" onClick={() => setCreatorQtyMaxGoal(prev => prev + 1)} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronUp className="w-3 h-3" /></button>
                            <button type="button" onClick={() => setCreatorQtyMaxGoal(prev => Math.max(1, prev - 1))} className="p-0.5 text-neutral-400 hover:text-neutral-600"><ChevronDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-500 leading-relaxed md:ml-2">
                      Use the quantity type when progress is measured by numbers (e.g., cups for water consumption, pages read in a book, or water bottles completed).
                    </span>
                  </div>
                )}

                {creatorGoalType === 'on_off' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    <span className="text-[12px] font-bold text-neutral-500 leading-relaxed">
                      Use the ON/OFF type for simple tasks that only require a quick checkmark to complete (e.g., taking vitamins, watering plants, or making your bed).
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: CATEGORY and ACCENT dropdown selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">CATEGORY</span>
              <select
                value={creatorCategory}
                onChange={(e) => setCreatorCategory(e.target.value)}
                className="w-full text-xs font-bold border border-neutral-200 rounded-xl px-2.5 py-2.5 bg-neutral-25 cursor-pointer hover:bg-neutral-50 transition"
              >
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">ACCENT</span>
              <select
                value={creatorColor}
                onChange={(e) => setCreatorColor(e.target.value)}
                className="w-full text-xs font-bold border border-neutral-200 rounded-xl px-2.5 py-2.5 bg-neutral-25 cursor-pointer hover:bg-neutral-50 transition animate-none"
              >
                {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      </div>
      ) : (
        <div className="space-y-6" id="habits-insights-tab-content">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={getPanelClass("p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Consistency</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-neutral-800">{consistencyRate}%</span>
                <span className="text-[10px] font-bold text-neutral-500 pb-1">past 14d</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">✓ Active & consistent</p>
            </div>

            <div className={getPanelClass("p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Active Streak</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-violet-700">{activeStreak} Days</span>
              </div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Keep consistency going!</p>
            </div>

            <div className={getPanelClass("p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Weekly Logs</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-neutral-800">{weeklyCompletions.length} Logs</span>
                <span className="text-[10px] font-bold text-neutral-500 pb-1">this week</span>
              </div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Aggregate checkmarks</p>
            </div>

            <div className={getPanelClass("p-4 flex flex-col justify-between")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Star Performer</span>
              <div className="mt-2">
                {starHabit ? (
                  <div className="truncate">
                    <span className="text-sm font-black text-amber-700 block truncate">{starHabit.name}</span>
                    <span className="text-[10px] font-bold text-neutral-500 block">{starHabit.completionCount} completions</span>
                  </div>
                ) : (
                  <span className="text-sm font-extrabold text-neutral-400 block py-1">No major logs</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-0.5">⭐ Top Habit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Categories & Rankings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Category Focus */}
              <div className={getPanelClass("p-5 space-y-4")}>
                <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Category Focus</h4>
                <div className="space-y-3">
                  {categoryStats.length > 0 ? (
                    categoryStats.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-neutral-700 flex items-center gap-1.5">{cat.name}</span>
                          <span className="text-neutral-500">{cat.rate}% consistency</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cat.fill}`} style={{ width: `${cat.rate}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-extrabold text-neutral-400 py-2">Create custom habits to display category focus analysis.</p>
                  )}
                </div>
              </div>

              {/* Weekly Leaderboard / Rankings */}
              <div className={getPanelClass("p-5 space-y-4")}>
                <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Habit Consistency Rankings</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {habitStats.length > 0 ? (
                    habitStats.slice(0, 5).map((h, i) => {
                      const pct = Math.min(100, Math.round((h.completionCount / 7) * 100));
                      return (
                        <div key={h.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50/50 border border-neutral-150/60 text-xs font-bold">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">#{i+1}</span>
                            <span className="text-neutral-800 truncate">{h.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-neutral-700 block">{h.completionCount}/7 checks</span>
                            <span className="text-[9px] font-mono text-neutral-400">{pct}% consistency</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs font-extrabold text-neutral-400 py-2">Log custom habits to see consistency performance leaderboard.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: 14-Day Velocity & GitHub Heatmap */}
            <div className="lg:col-span-2 space-y-6">
              {/* Line Velocity */}
              <div className={getPanelClass("p-5 space-y-4")}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">14-Day Habit Velocity</h4>
                  {hoveredDataPoint && (
                    <span className="text-[10px] font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100 animate-pulse">
                      {formatDateLabel(hoveredDataPoint.date)}: <strong>{hoveredDataPoint.rate}% completed</strong>
                    </span>
                  )}
                </div>

                <div className="relative w-full overflow-hidden flex items-center justify-center">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[220px]">
                    <g opacity="0.15">
                      <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#737373" strokeWidth="1" />
                      <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#737373" strokeWidth="1" />
                      <line x1={paddingX} y1={(height/2)} x2={width - paddingX} y2={(height/2)} stroke="#737373" strokeWidth="1" strokeDasharray="4 4" />
                    </g>

                    <svg viewBox={`0 0 ${width} ${height}`}>
                      {chartPoints.length > 0 && (
                        <>
                          <path d={areaPathString} fill="url(#violet-area-grad)" opacity="0.08" className="transition-all duration-300" />
                          <path d={svgPathString} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                          
                          {chartPoints.map((pt, i) => (
                            <g key={i}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={hoveredDataPoint?.index === pt.index ? 6 : 4}
                                fill={hoveredDataPoint?.index === pt.index ? "#7c3aed" : "#a78bfa"}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="cursor-pointer transition-all duration-200 hover:scale-130"
                                onMouseEnter={() => setHoveredDataPoint(pt)}
                                onMouseLeave={() => setHoveredDataPoint(null)}
                              />
                            </g>
                          ))}
                        </>
                      )}
                    </svg>

                    <defs>
                      <linearGradient id="violet-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <g opacity="0.6">
                      <text x={paddingX} y={height - 10} textAnchor="start" fontSize="9pt" fill="#737373" className="font-mono">{formatDateLabel(dailyRates[0]?.date)}</text>
                      <text x={width - paddingX} y={height - 10} textAnchor="end" fontSize="9pt" fill="#737373" className="font-mono">{formatDateLabel(dailyRates[dailyRates.length - 1]?.date)}</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* GitHub Matrix Heatmap */}
              <div className={getPanelClass("p-5 space-y-4")}>
                <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">28-Day Consistency Matrix</h4>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-7 gap-2.5 max-w-sm mx-auto sm:mx-0">
                    {heatmapDays.map((day, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex flex-col justify-center items-center font-mono text-[9px] font-bold border transition relative group cursor-help ${getIntensityColor(day.rate)}`}
                      >
                        <span>{day.dayNum}</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-neutral-900 text-white font-mono text-[8px] font-extrabold px-2 py-1 rounded-md z-15 whitespace-nowrap shadow-md">
                          {day.month} {day.dayNum}: {day.completedCount} logs ({Math.round(day.rate*100)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-500 justify-end max-w-sm">
                    <span>Less</span>
                    <div className="w-3 h-3 bg-neutral-100 rounded-sm border border-neutral-200" />
                    <div className="w-3 h-3 bg-violet-200 rounded-sm" />
                    <div className="w-3 h-3 bg-violet-400 rounded-sm" />
                    <div className="w-3 h-3 bg-violet-600 rounded-sm" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
