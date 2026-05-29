import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Sparkles, TrendingUp, Settings as SettingsIcon, CheckCircle2, 
  Flame, Award, Smartphone, Github, Heart, LayoutDashboard, Share, Plus, MoreVertical, X, Download,
  CheckSquare, Menu, Gift, BookOpen, Lightbulb, Library
} from 'lucide-react';

import { LOGO_BASE64 } from './assets/logoBase64';

import { Habit, HabitCompletion, HabitProgress, AppSettings, ViewType, Mood, MoodLog, Task } from './types';
import HabitsView from './components/HabitsView';
import InsightsView from './components/InsightsView';
import TrendsView from './components/TrendsView';
import SettingsView from './components/SettingsView';
import MoodTrackerView from './components/MoodTrackerView';
import TasksView from './components/TasksView';
import RewardsView from './components/RewardsView';
import HelpView from './components/HelpView';
import RequestFeatureView from './components/RequestFeatureView';
import TrackersLibraryView from './components/TrackersLibraryView';
import { getVal, setVal, clearAllVal, delVal } from './lib/db';


// Default initial habits matching the screenshot exactly
const SEED_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Water Intake',
    description: 'Track daily hydration count against physical quota',
    category: 'Health',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'sky',
    icon: 'Heart',
    habitType: 'quantity',
    quantityGoal: 15,
    quantityUnit: 'cups'
  },
  {
    id: 'habit-2',
    name: 'Exercise',
    description: 'Active gym workouts, morning yoga, or jogging duration',
    category: 'Fitness',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'rose',
    icon: 'Dumbbell',
    habitType: 'time',
    timeGoal: 120
  },
  {
    id: 'habit-3',
    name: 'Meditation',
    description: 'Focused silent box breathing or guided zazen',
    category: 'Mind',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'violet',
    icon: 'Brain',
    habitType: 'on_off'
  }
];

// Seed generator for past completions and progress (28 days)
const generateSeedCompletionsAndProgress = (): { completions: HabitCompletion[], progress: HabitProgress[] } => {
  const completionsList: HabitCompletion[] = [];
  const progressList: HabitProgress[] = [];
  const today = new Date();
  
  // Seed past 28 days
  for (let i = 28; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    SEED_HABITS.forEach((h) => {
      let isComplete = false;
      let progressVal = 0;
      
      if (h.habitType === 'on_off') {
        isComplete = Math.random() < 0.75;
        progressVal = isComplete ? 1 : 0;
      } else if (h.habitType === 'quantity') {
        const goal = h.quantityGoal || 15;
        // give them random counts between 8 and 17 cups
        progressVal = Math.floor(Math.random() * 10) + 8;
        isComplete = progressVal >= goal;
      } else if (h.habitType === 'time') {
        const goal = h.timeGoal || 120;
        // random minutes between 60 and 140 minutes
        progressVal = Math.floor(Math.random() * 90) + 60;
        isComplete = progressVal >= goal;
      }

      if (isComplete) {
        completionsList.push({
          habitId: h.id,
          date: dateStr
        });
      }

      progressList.push({
        habitId: h.id,
        date: dateStr,
        value: progressVal
      });
    });
  }
  return { completions: completionsList, progress: progressList };
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Luis',
  dailyGoal: 75, // 75% target consistency
  reminderTime: '21:00',
  soundEnabled: true,
  hapticFeedback: true,
  bgTheme: 'none'
};

export default function App() {
  const [view, setView] = useState<ViewType>('habits');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_habits');
      return stored ? JSON.parse(stored) : SEED_HABITS;
    } catch {
      return SEED_HABITS;
    }
  });
  const [completions, setCompletions] = useState<HabitCompletion[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_completions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [progress, setProgress] = useState<HabitProgress[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_progress');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [moods, setMoods] = useState<Mood[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_moods');
      return stored ? JSON.parse(stored) : [
        { id: 'm1', name: 'Happy', emoji: '😊', color: 'rose', order: 0 },
        { id: 'm2', name: 'Neutral', emoji: '😐', color: 'sky', order: 1 },
        { id: 'm3', name: 'Sad', emoji: '😢', color: 'violet', order: 2 },
      ];
    } catch {
      return [
        { id: 'm1', name: 'Happy', emoji: '😊', color: 'rose', order: 0 },
        { id: 'm2', name: 'Neutral', emoji: '😐', color: 'sky', order: 1 },
        { id: 'm3', name: 'Sad', emoji: '😢', color: 'violet', order: 2 },
      ];
    }
  });
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_mood_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [subtaskCompletions, setSubtaskCompletions] = useState<{ [key: string]: boolean }>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_subtasks');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [spentAmount, setSpentAmount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_spent_amount');
      return stored ? parseFloat(stored) : 0;
    } catch {
      return 0;
    }
  });
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pwa_habits_tracker_selected_trackers');
      return stored ? JSON.parse(stored) : ['habits', 'tasks', 'mood'];
    } catch {
      return ['habits', 'tasks', 'mood'];
    }
  });

  // Swipe gesture hooks & page sliding state variables
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [pageDirection, setPageDirection] = useState<'left' | 'right' | null>(null);

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);

  // Navigates and updates page slide direction index
  const handleSetView = (newView: ViewType) => {
    const keys: ViewType[] = [
      'habits', 'tasks', 'mood', 'insights', 'trends', 'rewards', 
      'help', 'request_feature', 'trackers_library', 'settings'
    ];
    const oldIndex = keys.indexOf(view);
    const newIndex = keys.indexOf(newView);
    if (newIndex > oldIndex) {
      setPageDirection('right');
    } else if (newIndex < oldIndex) {
      setPageDirection('left');
    }
    setView(newView);
  };

  // Wrapper updaters that write state to both IndexedDB and LocalStorage in parallel
  const updateHabitsState = async (newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem('pwa_habits_tracker_habits', JSON.stringify(newHabits));
    await setVal('pwa_habits_tracker_habits', newHabits);
  };

  const updateCompletionsState = async (newCompletions: HabitCompletion[]) => {
    setCompletions(newCompletions);
    localStorage.setItem('pwa_habits_tracker_completions', JSON.stringify(newCompletions));
    await setVal('pwa_habits_tracker_completions', newCompletions);
  };

  const updateProgressState = async (newProgress: HabitProgress[]) => {
    setProgress(newProgress);
    localStorage.setItem('pwa_habits_tracker_progress', JSON.stringify(newProgress));
    await setVal('pwa_habits_tracker_progress', newProgress);
  };

  const updateSettingsState = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pwa_habits_tracker_settings', JSON.stringify(newSettings));
    await setVal('pwa_habits_tracker_settings', newSettings);
  };

  const updateSubtaskCompletionsState = async (newVal: { [key: string]: boolean }) => {
    setSubtaskCompletions(newVal);
    localStorage.setItem('pwa_habits_tracker_subtasks', JSON.stringify(newVal));
    await setVal('pwa_habits_tracker_subtasks', newVal);
  };

  const updateTasksState = async (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('pwa_habits_tracker_tasks', JSON.stringify(newTasks));
    await setVal('pwa_habits_tracker_tasks', newTasks);
  };
  
  const updateSpentAmountState = async (newVal: number) => {
    setSpentAmount(newVal);
    localStorage.setItem('pwa_habits_tracker_spent_amount', newVal.toString());
    await setVal('pwa_habits_tracker_spent_amount', newVal);
  };

  const updateSelectedTrackersState = async (newVal: string[]) => {
    setSelectedTrackers(newVal);
    localStorage.setItem('pwa_habits_tracker_selected_trackers', JSON.stringify(newVal));
    await setVal('pwa_habits_tracker_selected_trackers', newVal);
  };

  const handleToggleTracker = (key: string) => {
    let nextTrackers;
    if (selectedTrackers.includes(key)) {
      nextTrackers = selectedTrackers.filter((t) => t !== key);
      if (view === key) {
        setView(nextTrackers[0] as ViewType);
      }
    } else {
      nextTrackers = [...selectedTrackers, key];
    }
    updateSelectedTrackersState(nextTrackers);
  };

  // Initialization of cache and theme settings
  useEffect(() => {
    console.log('App theme initialized.');
  }, []);

  // Initial state load from IndexedDB (with LocalStorage sync and seed generation)
  useEffect(() => {
    const loadState = async () => {
      try {
        let loadedHabits = await getVal<Habit[]>('pwa_habits_tracker_habits');
        let loadedCompletions = await getVal<HabitCompletion[]>('pwa_habits_tracker_completions');
        let loadedProgress = await getVal<HabitProgress[]>('pwa_habits_tracker_progress');
        let loadedSettings = await getVal<AppSettings>('pwa_habits_tracker_settings');
        let loadedSubtasks = await getVal<{ [key: string]: boolean }>('pwa_habits_tracker_subtasks');
        let loadedMoods = await getVal<Mood[]>('pwa_habits_tracker_moods');
        let loadedMoodLogs = await getVal<MoodLog[]>('pwa_habits_tracker_mood_logs');
        let loadedTasks = await getVal<Task[]>('pwa_habits_tracker_tasks');
        let loadedSpentAmount = await getVal<number>('pwa_habits_tracker_spent_amount');
        let loadedSelectedTrackers = await getVal<string[]>('pwa_habits_tracker_selected_trackers');

        if (!loadedSelectedTrackers) {
          const storedTrackers = localStorage.getItem('pwa_habits_tracker_selected_trackers');
          if (storedTrackers) {
            loadedSelectedTrackers = JSON.parse(storedTrackers);
            await setVal('pwa_habits_tracker_selected_trackers', loadedSelectedTrackers);
          }
        }

        // Parallel storage synchronization logic (sync back empty indexedDB from LocalStorage)
        if (loadedSpentAmount === undefined || loadedSpentAmount === null) {
          const storedSpent = localStorage.getItem('pwa_habits_tracker_spent_amount');
          if (storedSpent) {
            loadedSpentAmount = parseFloat(storedSpent);
            await setVal('pwa_habits_tracker_spent_amount', loadedSpentAmount);
          } else {
            loadedSpentAmount = 0;
          }
        }
        if (!loadedMoods) {
          const storedMoods = localStorage.getItem('pwa_habits_tracker_moods');
          if (storedMoods) {
            loadedMoods = JSON.parse(storedMoods);
            await setVal('pwa_habits_tracker_moods', loadedMoods);
          }
        }
        if (!loadedMoodLogs) {
          const storedMoodLogs = localStorage.getItem('pwa_habits_tracker_mood_logs');
          if (storedMoodLogs) {
            loadedMoodLogs = JSON.parse(storedMoodLogs);
            await setVal('pwa_habits_tracker_mood_logs', loadedMoodLogs);
          }
        }
        if (!loadedHabits) {
          const storedHabits = localStorage.getItem('pwa_habits_tracker_habits');
          if (storedHabits) {
            loadedHabits = JSON.parse(storedHabits);
            await setVal('pwa_habits_tracker_habits', loadedHabits);
          }
        }
        if (!loadedCompletions) {
          const storedCompletions = localStorage.getItem('pwa_habits_tracker_completions');
          if (storedCompletions) {
            loadedCompletions = JSON.parse(storedCompletions);
            await setVal('pwa_habits_tracker_completions', loadedCompletions);
          }
        }
        if (!loadedProgress) {
          const storedProgress = localStorage.getItem('pwa_habits_tracker_progress');
          if (storedProgress) {
            loadedProgress = JSON.parse(storedProgress);
            await setVal('pwa_habits_tracker_progress', loadedProgress);
          }
        }
        if (!loadedSettings) {
          const storedSettings = localStorage.getItem('pwa_habits_tracker_settings');
          if (storedSettings) {
            loadedSettings = JSON.parse(storedSettings);
            await setVal('pwa_habits_tracker_settings', loadedSettings);
          }
        }
        if (!loadedSubtasks) {
          const storedSubtasks = localStorage.getItem('pwa_habits_tracker_subtasks');
          if (storedSubtasks) {
            loadedSubtasks = JSON.parse(storedSubtasks);
            await setVal('pwa_habits_tracker_subtasks', loadedSubtasks);
          }
        }

        // Apply loaded values or generate fresh lists
        if (loadedHabits) {
          setHabits(loadedHabits);
        } else {
          setHabits(SEED_HABITS);
          await setVal('pwa_habits_tracker_habits', SEED_HABITS);
          localStorage.setItem('pwa_habits_tracker_habits', JSON.stringify(SEED_HABITS));
        }

        if (loadedCompletions && loadedProgress) {
          setCompletions(loadedCompletions);
          setProgress(loadedProgress);
        } else {
          const seededData = generateSeedCompletionsAndProgress();
          setCompletions(seededData.completions);
          setProgress(seededData.progress);
          await setVal('pwa_habits_tracker_completions', seededData.completions);
          await setVal('pwa_habits_tracker_progress', seededData.progress);
          localStorage.setItem('pwa_habits_tracker_completions', JSON.stringify(seededData.completions));
          localStorage.setItem('pwa_habits_tracker_progress', JSON.stringify(seededData.progress));
        }

        if (loadedSettings) {
          setSettings(loadedSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
          await setVal('pwa_habits_tracker_settings', DEFAULT_SETTINGS);
          localStorage.setItem('pwa_habits_tracker_settings', JSON.stringify(DEFAULT_SETTINGS));
        }

        if (loadedSubtasks) {
          setSubtaskCompletions(loadedSubtasks);
        } else {
          setSubtaskCompletions({});
        }

        if (loadedMoods) {
          setMoods(loadedMoods);
        } else {
          await setVal('pwa_habits_tracker_moods', moods);
          localStorage.setItem('pwa_habits_tracker_moods', JSON.stringify(moods));
        }

        if (loadedMoodLogs) {
          setMoodLogs(loadedMoodLogs);
        } else {
          await setVal('pwa_habits_tracker_mood_logs', []);
          localStorage.setItem('pwa_habits_tracker_mood_logs', JSON.stringify([]));
        }

        if (loadedTasks) {
          setTasks(loadedTasks);
        } else {
          await setVal('pwa_habits_tracker_tasks', []);
          localStorage.setItem('pwa_habits_tracker_tasks', JSON.stringify([]));
        }

        if (loadedSelectedTrackers) {
          setSelectedTrackers(loadedSelectedTrackers);
        } else {
          await setVal('pwa_habits_tracker_selected_trackers', ['habits', 'tasks', 'mood']);
          localStorage.setItem('pwa_habits_tracker_selected_trackers', JSON.stringify(['habits', 'tasks', 'mood']));
        }

        setSpentAmount(loadedSpentAmount || 0);
      } catch (error) {
        console.warn('IndexedDB initial load issue, syncing from LocalStorage:', error);
        // Resilient immediate LocalStorage fallback
        const storedHabits = localStorage.getItem('pwa_habits_tracker_habits');
        const storedCompletions = localStorage.getItem('pwa_habits_tracker_completions');
        const storedProgress = localStorage.getItem('pwa_habits_tracker_progress');
        const storedSettings = localStorage.getItem('pwa_habits_tracker_settings');
        const storedSubtasks = localStorage.getItem('pwa_habits_tracker_subtasks');
        const storedMoods = localStorage.getItem('pwa_habits_tracker_moods');
        const storedMoodLogs = localStorage.getItem('pwa_habits_tracker_mood_logs');
        const storedTasks = localStorage.getItem('pwa_habits_tracker_tasks');
        const storedSpent = localStorage.getItem('pwa_habits_tracker_spent_amount');
        const storedTrackers = localStorage.getItem('pwa_habits_tracker_selected_trackers');
 
        setHabits(storedHabits ? JSON.parse(storedHabits) : SEED_HABITS);
        if (storedCompletions && storedProgress) {
          setCompletions(JSON.parse(storedCompletions));
          setProgress(JSON.parse(storedProgress));
        } else {
          const seededData = generateSeedCompletionsAndProgress();
          setCompletions(seededData.completions);
          setProgress(seededData.progress);
        }
        setSettings(storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS);
        setSubtaskCompletions(storedSubtasks ? JSON.parse(storedSubtasks) : {});
        if (storedMoods) setMoods(JSON.parse(storedMoods));
        if (storedMoodLogs) setMoodLogs(JSON.parse(storedMoodLogs));
        setTasks(storedTasks ? JSON.parse(storedTasks) : []);
        setSpentAmount(storedSpent ? parseFloat(storedSpent) : 0);
        setSelectedTrackers(storedTrackers ? JSON.parse(storedTrackers) : ['habits', 'tasks', 'mood']);
      } finally {
        setIsInitialLoadComplete(true);
      }
    };

    loadState();
  }, []);

  // Synchronically persist moods & mood logs when changed
  useEffect(() => {
    if (isInitialLoadComplete) {
      localStorage.setItem('pwa_habits_tracker_moods', JSON.stringify(moods));
      setVal('pwa_habits_tracker_moods', moods).catch(e => console.warn(e));
    }
  }, [moods, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      localStorage.setItem('pwa_habits_tracker_mood_logs', JSON.stringify(moodLogs));
      setVal('pwa_habits_tracker_mood_logs', moodLogs).catch(e => console.warn(e));
    }
  }, [moodLogs, isInitialLoadComplete]);

  // Slide translation variants based on navigation direction
  const slideVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      x: direction === 'right' ? '100vw' : direction === 'left' ? '-100vw' : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'right' ? '-100vw' : direction === 'left' ? '100vw' : 0,
      opacity: 0,
    }),
  };

  // Swiping touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distanceX = touchStart - touchEnd;
    const minSwipeDistance = 60; // 60px deliberate movement required

    // Ignore swipes if modifying active range slider inputs (workout timers, etc.)
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'range') {
      return;
    }

    if (Math.abs(distanceX) > minSwipeDistance) {
      const keys: ViewType[] = ['habits', 'tasks', 'mood', 'settings'];
      const currentIndex = keys.indexOf(view);

      if (distanceX > minSwipeDistance && currentIndex < keys.length - 1) {
        // Swipe Left finger direction -> slide forward (move right)
        triggerHapticImpulse();
        handleSetView(keys[currentIndex + 1]);
      } else if (distanceX < -minSwipeDistance && currentIndex > 0) {
        // Swipe Right finger direction -> slide backward (move left)
        triggerHapticImpulse();
        handleSetView(keys[currentIndex - 1]);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Play crisp ascending client-side custom synthesized check audio
  const playChimeSoundOutput = () => {
    if (!settings.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Note 1: C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Note 2: E5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(659.25, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      // Note 3: G5
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.frequency.setValueAtTime(783.99, now + 0.16);
      gain3.gain.setValueAtTime(0.12, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);

      osc3.start(now + 0.16);
      osc3.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // Safe device haptics
  const triggerHapticImpulse = () => {
    if (settings.hapticFeedback && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (err) {
        // Silently catch sandboxed frame security constraints
      }
    }
  };

  // Toggle habit check state
  const handleToggleHabit = (habitId: string, date: string) => {
    triggerHapticImpulse();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.habitType === 'on_off') {
      const exists = completions.some((c) => c.habitId === habitId && c.date === date);
      let updatedCompletions: HabitCompletion[];

      if (exists) {
        updatedCompletions = completions.filter((c) => !(c.habitId === habitId && c.date === date));
      } else {
        updatedCompletions = [...completions, { habitId, date }];
        setTimeout(() => playChimeSoundOutput(), 10);
      }
      updateCompletionsState(updatedCompletions);

      // Update corresponding progress
      const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
      let updatedProgress: HabitProgress[] = [...progress];
      const isCurrentlyCompleted = progress.some(p => p.habitId === habitId && p.date === date && p.value > 0);
      
      if (existsIndex >= 0) {
        updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: isCurrentlyCompleted ? 0 : 1 };
      } else {
        updatedProgress.push({ habitId, date, value: 1 });
      }
      updateProgressState(updatedProgress);
    } else {
      // For Time or Quantity, check toggle goes straight to targetGoal or 0
      const targetGoal = habit.habitType === 'quantity' ? (habit.quantityGoal || 15) : (habit.timeGoal || 120);
      
      const exists = completions.some((c) => c.habitId === habitId && c.date === date);
      let updatedCompletions: HabitCompletion[];

      if (exists) {
        updatedCompletions = completions.filter((c) => !(c.habitId === habitId && c.date === date));
      } else {
        updatedCompletions = [...completions, { habitId, date }];
        setTimeout(() => playChimeSoundOutput(), 10);
      }
      updateCompletionsState(updatedCompletions);

      const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
      let updatedProgress: HabitProgress[] = [...progress];
      const existsProgressVal = existsIndex >= 0 && progress[existsIndex].value >= targetGoal;
      
      if (existsIndex >= 0) {
        updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: existsProgressVal ? 0 : targetGoal };
      } else {
        updatedProgress.push({ habitId, date, value: targetGoal });
      }
      updateProgressState(updatedProgress);
    }
  };

  // Update progressive metrics dynamically (minutes check and counter logs)
  const handleUpdateProgress = (habitId: string, date: string, newValue: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const clampValue = Math.max(0, newValue);
    const targetGoal = habit.habitType === 'quantity' ? (habit.quantityGoal || 1) : (habit.timeGoal || 1);
    const isCompletedNow = clampValue >= targetGoal;

    let updatedProgress: HabitProgress[] = [];
    const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
    if (existsIndex >= 0) {
      updatedProgress = [...progress];
      updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: clampValue };
    } else {
      updatedProgress = [...progress, { habitId, date, value: clampValue }];
    }
    updateProgressState(updatedProgress);

    const exists = completions.some(c => c.habitId === habitId && c.date === date);
    let updatedCompletions: HabitCompletion[] = [...completions];
    if (isCompletedNow && !exists) {
      updatedCompletions.push({ habitId, date });
      setTimeout(() => playChimeSoundOutput(), 10);
    } else if (!isCompletedNow && exists) {
      updatedCompletions = completions.filter(c => !(c.habitId === habitId && c.date === date));
    }
    updateCompletionsState(updatedCompletions);
  };

  // Create custom habit
  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'createdAt'>, targetDate?: string) => {
    triggerHapticImpulse();
    const created: Habit = {
      ...newHabit,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      activeDates: targetDate ? [targetDate] : []
    };
    const updated = [...habits, created];
    updateHabitsState(updated);
  };

  // Assign or remove a habit from active list for a specific date (clones/duplicates the habit as many times as requested)
  const handleToggleHabitActiveDate = (habitId: string, date: string) => {
    triggerHapticImpulse();
    const sourceHabit = habits.find(h => h.id === habitId);
    if (!sourceHabit) return;

    const cloned: Habit = {
      ...sourceHabit,
      id: `habit-clone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      activeDates: [date],
      isClone: true,
      parentHabitId: sourceHabit.id
    };

    if (sourceHabit.subtasks) {
      cloned.subtasks = sourceHabit.subtasks.map(s => ({
        ...s,
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }));
    }

    const updated = [...habits, cloned];
    updateHabitsState(updated);
  };

  // Edit custom habit properties
  const handleEditHabit = (editedHabit: Habit) => {
    triggerHapticImpulse();
    const isClone = !!editedHabit.isClone;
    const rootId = isClone ? editedHabit.parentHabitId : editedHabit.id;
    const targetColor = editedHabit.color;

    const updated = habits.map(h => {
      // If indeed it is the exact edited object itself
      if (h.id === editedHabit.id) {
        return editedHabit;
      }
      // If h matches the parent template or another clone of the parent template, synchronize values.
      if (rootId) {
        if (h.id === rootId || h.parentHabitId === rootId) {
          return {
            ...h,
            color: targetColor,
            name: editedHabit.name,
            description: editedHabit.description,
            category: editedHabit.category,
            timeGoal: editedHabit.timeGoal,
            quantityGoal: editedHabit.quantityGoal,
            quantityUnit: editedHabit.quantityUnit,
            icon: editedHabit.icon
          };
        }
      }
      return h;
    });
    updateHabitsState(updated);
  };

  // Delete habit
  const handleDeleteHabit = (id: string) => {
    triggerHapticImpulse();
    const habitToDelete = habits.find(h => h.id === id);
    if (!habitToDelete) return;

    // If deleting a global template (not a clone), we must also delete all clones of it
    const isGlobalTemplate = !habitToDelete.isClone;
    
    let updatedHabits: Habit[];
    let deletedIds: string[];

    if (isGlobalTemplate) {
      updatedHabits = habits.filter((h) => h.id !== id && h.parentHabitId !== id);
      deletedIds = habits
        .filter((h) => h.id === id || h.parentHabitId === id)
        .map(h => h.id);
    } else {
      updatedHabits = habits.filter((h) => h.id !== id);
      deletedIds = [id];
    }

    const updatedCompletions = completions.filter((c) => !deletedIds.includes(c.habitId));
    const updatedProgress = progress.filter((p) => !deletedIds.includes(p.habitId));

    updateHabitsState(updatedHabits);
    updateCompletionsState(updatedCompletions);
    updateProgressState(updatedProgress);
  };

  // Clear achievements/progress for a single day only
  const handleClearDayCompletions = (date: string) => {
    triggerHapticImpulse();
    const updatedCompletions = completions.filter((c) => c.date !== date);
    const updatedProgress = progress.map((p) => p.date === date ? { ...p, value: 0 } : p);
    updateCompletionsState(updatedCompletions);
    updateProgressState(updatedProgress);
  };

  // Restores/clears all analytics, completions, database logs, and progress metrics to pristine state
  const handleResetAllData = () => {
    triggerHapticImpulse();
    updateCompletionsState([]);
    updateProgressState([]);
    updateHabitsState([]);
    updateSubtaskCompletionsState({});
    updateTasksState([]);
  };

  // Save Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    updateSettingsState(updated);
  };

  // Backup & Import Actions
  const handleBackupExport = () => {
    return {
      habits,
      completions,
      progress,
      settings,
      moods,
      moodLogs,
      subtaskCompletions,
      tasks,
      backupVersion: '2.0',
      exportedAt: new Date().toISOString()
    };
  };

  const handleBackupRestore = async (importedData: any): Promise<boolean> => {
    try {
      if (!importedData || typeof importedData !== 'object') return false;
      
      // Basic format verification
      if (!Array.isArray(importedData.habits) && !Array.isArray(importedData.moods)) {
        return false;
      }

      if (Array.isArray(importedData.habits)) {
        await updateHabitsState(importedData.habits);
      }
      if (Array.isArray(importedData.completions)) {
        await updateCompletionsState(importedData.completions);
      }
      if (Array.isArray(importedData.progress)) {
        await updateProgressState(importedData.progress);
      }
      if (importedData.settings && typeof importedData.settings === 'object') {
        await updateSettingsState({ ...settings, ...importedData.settings });
      }
      if (importedData.subtaskCompletions && typeof importedData.subtaskCompletions === 'object') {
        await updateSubtaskCompletionsState(importedData.subtaskCompletions);
      }
      if (Array.isArray(importedData.moods)) {
        setMoods(importedData.moods);
        localStorage.setItem('pwa_habits_tracker_moods', JSON.stringify(importedData.moods));
        await setVal('pwa_habits_tracker_moods', importedData.moods);
      }
      if (Array.isArray(importedData.moodLogs)) {
        setMoodLogs(importedData.moodLogs);
        localStorage.setItem('pwa_habits_tracker_mood_logs', JSON.stringify(importedData.moodLogs));
        await setVal('pwa_habits_tracker_mood_logs', importedData.moodLogs);
      }
      if (Array.isArray(importedData.tasks)) {
        await updateTasksState(importedData.tasks);
      }

      return true;
    } catch (e) {
      console.warn('Error during backup restore:', e);
      return false;
    }
  };

  // Wipe application data completely
  const handleWipeDatabase = () => {
    updateHabitsState([]);
    updateCompletionsState([]);
    updateProgressState([]);
    updateSettingsState(DEFAULT_SETTINGS);
    updateSubtaskCompletionsState({});
  };

  // Optional subtasks handlers
  const handleAddSubtask = (habitId: string, text: string) => {
    triggerHapticImpulse();
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const subtasks = h.subtasks || [];
        if (subtasks.length >= 3) return h;
        const newSubtask = {
          id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: text.trim()
        };
        return {
          ...h,
          subtasks: [...subtasks, newSubtask]
        };
      }
      return h;
    });
    updateHabitsState(updated);
  };

  const handleDeleteSubtask = (habitId: string, subtaskId: string) => {
    triggerHapticImpulse();
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          subtasks: (h.subtasks || []).filter((st) => st.id !== subtaskId)
        };
      }
      return h;
    });
    updateHabitsState(updated);
  };

  const handleToggleSubtask = (subtaskId: string, date: string) => {
    triggerHapticImpulse();
    const key = `${date}_${subtaskId}`;
    const nextVal = !subtaskCompletions[key];
    const updated = {
      ...subtaskCompletions,
      [key]: nextVal
    };
    if (nextVal) {
      setTimeout(() => playChimeSoundOutput(), 10);
    }
    updateSubtaskCompletionsState(updated);
  };

  // Each completed habit is 5 points. Completed tasks get points based on priority: Low=1, Medium=3, High=5
  const getTaskPoints = (priority: 'Low' | 'Medium' | 'High') => {
    if (priority === 'Low') return 1;
    if (priority === 'Medium') return 3;
    if (priority === 'High') return 5;
    return 3;
  };

  const totalEarned = ((completions || []).length * 5) + 
    ((tasks || []).filter((t) => t.status === 'Done').reduce((sum, t) => sum + getTaskPoints(t.priority), 0));

  const walletBalance = Math.max(0, totalEarned - spentAmount);

  // Navigation Items
  const trackerIcons: Record<string, typeof CheckCircle2> = {
    habits: CheckCircle2,
    tasks: CheckSquare,
    mood: Heart,
    insights: Sparkles,
    trends: TrendingUp,
    rewards: Award
  };

  const trackerLabels: Record<string, string> = {
    habits: 'Habits',
    tasks: 'Tasks',
    mood: 'Moods',
    insights: 'Insights',
    trends: 'Trends',
    rewards: 'Rewards'
  };

  const navItems = [
    ...selectedTrackers.map(key => ({
      key: key as ViewType,
      label: trackerLabels[key] || 'Tracker',
      icon: trackerIcons[key] || CheckCircle2
    })),
    { key: 'settings' as ViewType, label: 'Settings', icon: SettingsIcon }
  ];

  // Solid background colors matching user request for soft pastel solid themes
  const bgStyle: React.CSSProperties = {
    backgroundColor: 
      settings.bgTheme === 'light_blue' 
        ? '#e0f2fe' // Solid light blue (sky-100)
        : settings.bgTheme === 'light_pink'
        ? '#fce7f3' // Solid light pink (pink-100)
        : settings.bgTheme === 'light_green'
        ? '#dcfce7' // Solid light green (green-100)
        : '#bebebe', // Solid minimalist plain gray #bebebe
  };

  return (
    <>
      {/* Bulletproof fixed viewport background layer */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-300"
        style={bgStyle}
        id="app-fixed-background"
      />

      <div 
        className="relative z-10 min-h-screen w-full flex flex-col pb-20 md:pb-6 transition-all duration-300 select-none overflow-x-hidden bg-transparent" 
        id="app-root-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40 px-4 py-3 shadow-3xs" id="app-header">
        <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
          {/* Top Row: Logo & App Title + Balance Chip + Hamburger Button */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <img 
                src={LOGO_BASE64} 
                alt="Habit Tracker Logo" 
                className="w-8.5 h-8.5 rounded-xl shadow-xs object-cover shrink-0 select-none"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900 leading-none">Habit Tracker</h1>
                <p className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest mt-0.5 sm:mt-1">Luis's Habit Loop</p>
              </div>
            </div>

            {/* Wallet Balance + Universal Menu Button */}
            <div className="flex items-center gap-2.5">
              {/* Points Wallet Chip */}
              <button 
                onClick={() => handleSetView('rewards')}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl shadow-3xs select-none cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Open Rewards and Points Balance Page"
              >
                <Award className="w-3.5 h-3.5 text-amber-600 animate-pulse text-[13px]" />
                <span className="text-xs font-black tracking-tight">{walletBalance} PTS</span>
              </button>

              {/* Universal menu button (Visible in website/desktop view as well as mobile) */}
              <button
                onClick={() => {
                  triggerHapticImpulse();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-2 rounded-xl border border-neutral-150 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                id="universal-hamburger-btn"
                title="Toggle Menu Drawer"
              >
                {isMenuOpen ? <X className="w-4 h-4 text-neutral-900" /> : <Menu className="w-4 h-4 text-neutral-900" />}
              </button>
            </div>
          </div>

          {/* Bottom Desktop Navigation Tabs Block */}
          <nav className="hidden md:flex items-center justify-center gap-1 bg-neutral-50/70 p-1 rounded-xl border border-neutral-150 w-full" id="desktop-main-navigation-tabs">
            {navItems.map((item) => {
              const active = view === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`desktop-nav-${item.key}`}
                  onClick={() => handleSetView(item.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active 
                      ? 'bg-neutral-900 text-white shadow-3xs' 
                      : 'text-neutral-550 hover:bg-neutral-150 hover:text-neutral-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Hamburger Dropdown Menu Overlay & Box */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Global backdrop click-dismiss shield */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-neutral-900/15 backdrop-blur-[2px] z-30"
                id="menu-overlay-backdrop"
              />
              {/* Menu Card (Absolute dropdown panel) */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-4 right-4 md:left-auto md:right-4 md:w-80 top-[60px] md:top-[68px] bg-white border border-neutral-150 rounded-2xl p-4 shadow-2xl z-40 flex flex-col gap-1.5"
                id="hamburger-dropdown-list"
              >
                <div className="px-2 pb-1.5 mb-1.5 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Hub Navigation</span>
                  <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider bg-neutral-100 py-0.5 px-2 rounded-full">Explore app</span>
                </div>
                {[
                  { key: 'trackers_library', label: 'Trackers Library', icon: Library, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  { key: 'rewards', label: 'Rewards', icon: Award, color: 'text-amber-500 bg-amber-50' },
                  { key: 'help', label: 'Help Guide', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
                  { key: 'request_feature', label: 'Request Feature', icon: Lightbulb, color: 'text-violet-600 bg-violet-50' },
                  { key: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-neutral-500 bg-neutral-100' },
                ].map((item) => {
                  const active = view === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        triggerHapticImpulse();
                        handleSetView(item.key as ViewType);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-1.5 rounded-lg border border-transparent ${active ? 'bg-neutral-800 text-white' : item.color}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.key === 'trackers_library' ? (
                        <div className="flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-sans uppercase">
                          <span>📦 HUB</span>
                        </div>
                      ) : item.key === 'rewards' ? (
                        <div className="flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-sans uppercase">
                          <span>💰 REWARDS</span>
                        </div>
                      ) : item.key === 'help' ? (
                        <div className="flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-sans uppercase">
                          <span>📚 GUIDE</span>
                        </div>
                      ) : item.key === 'request_feature' ? (
                        <div className="flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-sans uppercase">
                          <span>💡 REQUEST</span>
                        </div>
                      ) : active ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                      ) : null}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 md:py-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={pageDirection}>
          <motion.div
            key={view}
            custom={pageDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {view === 'habits' && (
              <HabitsView
                habits={habits}
                completions={completions}
                progress={progress}
                onToggleHabit={handleToggleHabit}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onUpdateProgress={handleUpdateProgress}
                onAddHabit={handleAddHabit}
                userName={settings.userName}
                onClearDayCompletions={handleClearDayCompletions}
                bgTheme={settings.bgTheme}
                subtaskCompletions={subtaskCompletions}
                onAddSubtask={handleAddSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onToggleSubtask={handleToggleSubtask}
                onToggleHabitActiveDate={handleToggleHabitActiveDate}
                settings={settings}
              />
            )}

            {view === 'tasks' && (
              <TasksView
                tasks={tasks}
                onUpdateTasks={updateTasksState}
                bgTheme={settings.bgTheme}
                onPlaySound={playChimeSoundOutput}
              />
            )}
            
            {view === 'mood' && (
              <MoodTrackerView
                moods={moods}
                moodLogs={moodLogs}
                onAddMoodLog={(moodId) => {
                  const matchingMood = moods.find(m => m.id === moodId);
                  setMoodLogs(prev => [
                    ...prev,
                    {
                      id: `log-${Date.now()}`,
                      moodId,
                      timestamp: new Date().toISOString(),
                      moodName: matchingMood?.name,
                      moodEmoji: matchingMood?.emoji
                    }
                  ]);
                }}
                onDeleteMoodLog={(logId) => setMoodLogs(prev => prev.filter(log => log.id !== logId))}
                onUpdateMoodLog={(logId, note) => setMoodLogs(prev => prev.map(log => log.id === logId ? { ...log, note } : log))}
                onAddMood={(newMood) => setMoods(prev => [...prev, { ...newMood, id: `mood-${Date.now()}`, order: prev.length }])}
                onDeleteMood={(id) => setMoods(prev => prev.filter(m => m.id !== id))}
                onUpdateMood={(updatedMood) => setMoods(prev => prev.map(m => m.id === updatedMood.id ? updatedMood : m))}
                onMoveMood={(id, direction) => {
                  setMoods(prev => {
                    const arr = [...prev].sort((a, b) => a.order - b.order);
                    const index = arr.findIndex(m => m.id === id);
                    if (index === -1) return prev;
                    if (direction === 'up' && index > 0) {
                      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                    } else if (direction === 'down' && index < arr.length - 1) {
                      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
                    }
                    return arr.map((m, i) => ({ ...m, order: i }));
                  });
                }}
                bgTheme={settings.bgTheme}
              />
            )}
            
            {view === 'insights' && (
              <InsightsView
                habits={habits}
                completions={completions}
                moods={moods}
                moodLogs={moodLogs}
                tasks={tasks}
                dailyGoal={settings.dailyGoal}
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'trends' && (
              <TrendsView
                habits={habits}
                completions={completions}
                moods={moods}
                moodLogs={moodLogs}
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onNavigateToday={() => handleSetView('habits')}
                onResetAllData={handleResetAllData}
                onAddHabit={handleAddHabit}
                onBackupStore={handleBackupExport}
                onRestoreStore={handleBackupRestore}
              />
            )}

            {view === 'rewards' && (
              <RewardsView
                walletBalance={walletBalance}
                spentAmount={spentAmount}
                onSpendAmount={updateSpentAmountState}
                completionsCount={(completions || []).length}
                totalEarned={totalEarned}
              />
            )}

            {view === 'help' && (
              <HelpView
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'request_feature' && (
              <RequestFeatureView
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'trackers_library' && (
              <TrackersLibraryView
                selectedTrackers={selectedTrackers}
                onToggleTracker={handleToggleTracker}
                bgTheme={settings.bgTheme}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Touch-Optimized Sticky Bottom Nav (Visible only on mobile devices) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-100 px-4 py-2 flex justify-around md:hidden z-40 shadow-xl pb-safe">
        {navItems.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              id={`mobile-nav-${item.key}`}
              onClick={() => {
                triggerHapticImpulse();
                handleSetView(item.key);
              }}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg w-16 transition-all text-[10px] font-bold cursor-pointer outline-hidden ${
                active 
                  ? 'text-neutral-900 bg-neutral-50 scale-102 font-bold' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5px] text-neutral-900' : 'stroke-[2px]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>


    </div>
    </>
  );
}

