export interface SubTask {
  id: string;
  text: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., 'Fitness', 'Mind', 'Health', 'Productivity', 'Finance'
  frequency: 'daily' | 'weekly';
  createdAt: string; // ISO date string
  color: string; // e.g., 'violet', 'teal', 'amber', 'rose', 'sky'
  icon: string; // Lucide icon name
  habitType: 'time' | 'quantity' | 'on_off';
  timeGoal?: number; // total target minutes
  quantityGoal?: number; // target counter value
  quantityUnit?: string; // e.g., 'cups', 'pages', 'km'
  rewardAmount?: number; // fake money in $ users earn for completing
  subtasks?: SubTask[];
  activeDates?: string[]; // Array of YYYY-MM-DD formats where this habit is added
  isClone?: boolean;
  parentHabitId?: string;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // Format: YYYY-MM-DD
}

export interface HabitProgress {
  habitId: string;
  date: string; // Format: YYYY-MM-DD
  value: number; // current progress (minutes for time, count for quantity)
}

export interface Mood {
  id: string;
  name: string;
  emoji: string;
  color: string; // e.g., 'rose', 'violet'
  order: number;
}

export interface MoodLog {
  id: string;
  moodId: string;
  timestamp: string; // ISO date string
  note?: string;
  moodName?: string;
  moodEmoji?: string;
}

export interface AppSettings {
  userName: string;
  dailyGoal: number; // Percentage, e.g. 80 for 80%
  reminderTime: string; // HH:MM
  soundEnabled: boolean;
  hapticFeedback: boolean;
  bgTheme?: 'none' | 'light_blue' | 'light_pink' | 'light_green';
  pwaSplashEnabled?: boolean;
}

export type ViewType = 'habits' | 'insights' | 'trends' | 'settings' | 'mood' | 'tasks' | 'rewards' | 'help' | 'request_feature' | 'trackers_library';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'TO-DO' | 'In Progress' | 'Blocked' | 'Review' | 'Done';

export interface Task {
  id: string;
  name: string;
  description: string; // detail goals
  priority: TaskPriority;
  status: TaskStatus;
  date: string; // YYYY-MM-DD format
  rewardPoints?: number;
}

