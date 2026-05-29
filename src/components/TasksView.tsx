import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, 
  Trash2, X, AlertCircle, CheckCircle2, Circle, Clock, CheckSquare, Calendar, Pencil, LayoutGrid,
  Sparkles, Check, Trophy
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onUpdateTasks: (newTasks: Task[]) => void;
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
  onPlaySound?: () => void;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const STATUSES: TaskStatus[] = ['TO-DO', 'In Progress', 'Blocked', 'Review', 'Done'];

const STATUS_CONFIGS: Record<TaskStatus, { bg: string; text: string; border: string; dot: string; icon: any }> = {
  'TO-DO': { bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-200', dot: 'bg-neutral-400', icon: Circle },
  'In Progress': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', icon: Clock },
  'Blocked': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', icon: AlertCircle },
  'Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', icon: LayoutGrid },
  'Done': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
};

const PRIORITY_CONFIGS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  'Low': { bg: 'bg-[#f5f5f5]', text: 'text-neutral-600', border: 'border-neutral-200' },
  'Medium': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  'High': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
};

const getPointsByPriority = (p: TaskPriority): number => {
  switch (p) {
    case 'Low': return 1;
    case 'Medium': return 3;
    case 'High': return 5;
    default: return 3;
  }
};

export default function TasksView({ tasks, onUpdateTasks, bgTheme, onPlaySound }: TasksViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'insights'>('tracker');
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // State for pop window (modal)
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // format: YYYY-MM-DD
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // States for new task form input
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('TO-DO');
  const [taskReward, setTaskReward] = useState<number>(5);

  // State for editing task tracker fields
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TO-DO');
  const [editReward, setEditReward] = useState<number>(5);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate Year
  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  // Navigate Month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleResetToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Calendar logic calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthOffset = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startOffset = getFirstDayOfMonthOffset(currentYear, currentMonth);

  // Helper to format Date string
  const formatDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !selectedDate) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: taskName,
      description: description,
      priority: priority,
      status: status,
      date: selectedDate,
      rewardPoints: getPointsByPriority(priority)
    };

    onUpdateTasks([...tasks, newTask]);

    // reset task inputs
    setTaskName('');
    setDescription('');
    setPriority('Medium');
    setStatus('TO-DO');
    setTaskReward(3);
    setIsAddingNew(false);
  };

  // Edit Task
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditName(task.name);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditReward(task.rewardPoints !== undefined ? task.rewardPoints : 5);
  };

  const handleToggleTaskDone = (taskId: string) => {
    let playedSound = false;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = (t.status === 'Done' ? 'TO-DO' : 'Done') as TaskStatus;
        if (nextStatus === 'Done') {
          playedSound = true;
        }
        return {
          ...t,
          status: nextStatus,
          rewardPoints: getPointsByPriority(t.priority)
        };
      }
      return t;
    });
    onUpdateTasks(updated);
    if (playedSound && onPlaySound) {
      onPlaySound();
    }
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editName.trim()) return;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          name: editName,
          description: editDesc,
          priority: editPriority,
          status: editStatus,
          rewardPoints: getPointsByPriority(editPriority)
        };
      }
      return t;
    });

    onUpdateTasks(updated);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== taskId));
  };

  // Open Modal
  const handleDayClick = (dayStr: string) => {
    setSelectedDate(dayStr);
    setIsAddingNew(false);
    setEditingTaskId(null);
  };

  const getPanelClass = (additional = '') => {
    const isDarkBg = bgTheme && bgTheme !== 'none';
    return `backdrop-blur-md rounded-2xl border transition-all duration-300 ${
      isDarkBg
        ? 'bg-white/80 border-white/50 shadow-lg'
        : 'bg-white border-neutral-150 shadow-xs'
    } ${additional}`;
  };

  // Task Insight Calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'Done').length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Status breakdown
  const statusCounts = STATUSES.map(s => {
    const count = tasks.filter(t => t.status === s).length;
    const percentage = totalTasksCount > 0 ? Math.round((count / totalTasksCount) * 100) : 0;
    return { status: s, count, percentage };
  });

  // Recent completed tasks list
  const recentCompletedTasks = tasks.filter(t => t.status === 'Done').slice(-8).reverse();

  return (
    <div className="space-y-6" id="tasks-view-container">
      {/* Segment switcher tab */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/85 border border-neutral-200/50 max-w-xs shadow-3xs" id="tasks-subtab-bar">
        <button
          type="button"
          onClick={() => setActiveSubTab('tracker')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tracker'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="tasks-tab-calendar"
        >
          📅 Tasks
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('insights')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'insights'
              ? 'bg-neutral-950 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
          }`}
          id="tasks-tab-insights"
        >
          📊 Insights & Trends
        </button>
      </div>

      {activeSubTab === 'tracker' ? (
        <div className="space-y-6">
          {/* Welcome & Tracker Advice Guide Banner */}
      <div className={getPanelClass("p-5 relative overflow-hidden flex flex-col md:flex-row items-start gap-4 md:gap-5")}>
        {/* Background ambient accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-sky-50/50 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />

        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 text-indigo-600 border border-indigo-200 shrink-0 self-start shadow-3xs">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
        </div>

        <div className="relative space-y-1 max-w-2xl">
          <h3 className="text-sm font-extrabold tracking-tight text-neutral-900">
            What’s on your mind?
          </h3>
          <p className="text-xs font-medium text-neutral-600 leading-relaxed">
            Keep track of your daily flow here. Create to-dos, set priorities for what matters most, block out time for focus, and monitor your progress as you move tasks to done. Stay on top of your game effortlessly.
          </p>
        </div>
      </div>

      {/* Calendar Header / Navigation */}
      <div className={getPanelClass("p-5")}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Task Calendar</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-extrabold text-xl text-neutral-900 tracking-tight">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year navigation buttons */}
            <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
              <button 
                onClick={handlePrevYear}
                className="p-1.5 hover:bg-white rounded-md text-neutral-700 transition font-bold"
                title="Previous Year"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <div className="px-2.5 flex items-center justify-center text-xs font-black text-neutral-800">
                YEAR
              </div>
              <button 
                onClick={handleNextYear}
                className="p-1.5 hover:bg-white rounded-md text-neutral-700 transition font-bold"
                title="Next Year"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month Navigation buttons */}
            <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-md text-neutral-700 transition font-bold"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 flex items-center justify-center text-xs font-black text-neutral-800">
                MONTH
              </div>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-md text-neutral-700 transition font-bold"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleResetToToday}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition shadow-3xs"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="mt-6 border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/50">
          {/* Day of Week Headings */}
          <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-100/60">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center py-2.5 text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest border-r last:border-r-0 border-neutral-100">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Days */}
          <div className="grid grid-cols-7 bg-white">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="min-h-[85px] sm:min-h-[110px] bg-neutral-50/40 border-b border-r border-neutral-100"
              />
            ))}

            {/* Actual Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateString(dayNum);
              const dayTasks = tasks.filter(t => t.date === dateStr);
              
              const isDateToday = 
                today.getDate() === dayNum && 
                today.getMonth() === currentMonth && 
                today.getFullYear() === currentYear;

              // Calculate completions
              const completedTasksCount = dayTasks.filter(t => t.status === 'Done').length;
              const totalTasksCount = dayTasks.length;
              const progressPercentage = totalTasksCount > 0 
                ? Math.round((completedTasksCount / totalTasksCount) * 100) 
                : 0;

              const hasHigh = dayTasks.some(t => t.priority === 'High');
              const hasMedium = dayTasks.some(t => t.priority === 'Medium');
              const hasLow = dayTasks.some(t => t.priority === 'Low');

              let dayBgStyle = 'bg-white hover:bg-neutral-50/50 border-neutral-100';
              if (hasHigh) {
                dayBgStyle = 'bg-red-50/80 hover:bg-red-100/90 border-red-200';
              } else if (hasMedium) {
                dayBgStyle = 'bg-sky-50 hover:bg-sky-100/90 border-sky-200';
              } else if (hasLow) {
                dayBgStyle = 'bg-white hover:bg-neutral-50/60 border-neutral-100';
              }

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleDayClick(dateStr)}
                  className={`min-h-[85px] sm:min-h-[110px] border-b border-r last:border-r ${dayBgStyle} transition-all cursor-pointer p-1.5 flex flex-col justify-between group relative overflow-hidden`}
                >
                  {/* Day top indicator */}
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-xs font-bold transition-all ${
                        isDateToday 
                          ? 'bg-neutral-900 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] shadow-3xs font-black' 
                          : 'text-neutral-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Progress fraction if there are tasks */}
                    {totalTasksCount > 0 && (
                      <span className="text-[9px] font-black text-neutral-400 bg-neutral-100 px-1 py-0.5 rounded-sm">
                        {completedTasksCount}/{totalTasksCount}
                      </span>
                    )}
                  </div>

                  {/* Daily Task List (Micro status indicator row on mobile, small titles on desktop) */}
                  <div className="flex-1 my-1 flex flex-col justify-end space-y-1 overflow-hidden">
                    {/* Desktop detailed items (hidden on small screen) */}
                    <div className="hidden sm:block space-y-1">
                      {dayTasks.slice(0, 2).map(task => {
                        const config = STATUS_CONFIGS[task.status];
                        return (
                          <div 
                            key={task.id} 
                            style={{ fontSize: '16.625px' }}
                            className={`px-1 py-0.5 rounded-xs border leading-none font-medium truncate flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}
                          >
                            <span className={`w-1 h-1 rounded-full shrink-0 ${config.dot}`} />
                            <span className="truncate">{task.name}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[8px] text-neutral-400 font-bold pl-1">
                          + {dayTasks.length - 2} more...
                        </div>
                      )}
                    </div>

                    {/* Mobile visual status dot/indicator flex (visible only on mobile) */}
                    <div className="flex sm:hidden flex-wrap gap-1 items-center justify-start max-h-[22px] overflow-hidden">
                      {dayTasks.map(task => (
                        <span 
                          key={task.id} 
                          title={`${task.name}: ${task.status}`}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_CONFIGS[task.status].dot}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Task progress bar at bottom of the day block */}
                  {totalTasksCount > 0 && (
                    <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden mt-1 shrink-0">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          progressPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${progressPercentage}%` }} 
                      />
                    </div>
                  )}

                  {/* Hover effect highlight */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-250" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Pop Window / Overlay Modal inside the component */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="task-modal-backdrop"
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-neutral-150 shadow-2xl w-full max-w-xl overflow-hidden focus:outline-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Title Banner */}
              <div className="bg-neutral-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-400 leading-none">Schedule Details</h3>
                    <p className="text-xs text-neutral-200 mt-1 font-bold">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Workspace */}
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                
                {/* Active Tasks list matching that day */}
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-3">
                    <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider">
                      Tasks ({tasks.filter(t => t.date === selectedDate).length})
                    </h4>
                    {!isAddingNew && (
                      <button
                        onClick={() => setIsAddingNew(true)}
                        className="flex items-center gap-1 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ADD TASK
                      </button>
                    )}
                  </div>

                  {/* List of current Tasks for selected date */}
                  <div className="space-y-3">
                    {tasks.filter(t => t.date === selectedDate).length === 0 ? (
                      <div className="py-6 text-center text-neutral-400">
                        <CheckSquare className="w-8 h-8 mx-auto stroke-[1.5px] mb-2" />
                        <p className="text-xs font-medium">No tasks logged for this day yet.</p>
                      </div>
                    ) : (
                      tasks.filter(t => t.date === selectedDate).map(task => {
                        const isEditing = editingTaskId === task.id;
                        const statusConfig = STATUS_CONFIGS[task.status];
                        const priorityConfig = PRIORITY_CONFIGS[task.priority];

                        return (
                          <div 
                            key={task.id} 
                            style={{ contentVisibility: 'auto' }}
                            className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 space-y-3"
                          >
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
                                    Task Name
                                  </label>
                                  <input 
                                    type="text" 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
                                    Description & Goals
                                  </label>
                                  <textarea 
                                    rows={2}
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    className="w-full text-xs p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800 focus:outline-hidden"
                                    placeholder="Detail specific task goals..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
                                      Priority
                                    </label>
                                    <select 
                                      value={editPriority}
                                      onChange={e => setEditPriority(e.target.value as TaskPriority)}
                                      className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800"
                                    >
                                      {PRIORITIES.map(p => (
                                        <option key={p} value={p}>{p} Priority</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
                                      Status
                                    </label>
                                    <select 
                                      value={editStatus}
                                      onChange={e => setEditStatus(e.target.value as TaskStatus)}
                                      className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800"
                                    >
                                      {STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
                                    Completion Point Reward (Fixed by Priority)
                                  </label>
                                  <div className="text-xs font-extrabold text-amber-700 bg-amber-50/70 px-2.5 py-2 rounded-md border border-amber-100 flex items-center gap-1.5 w-fit">
                                    <span>⭐</span>
                                    <span>+{getPointsByPriority(editPriority)} PTS will be earned upon Done status ({editPriority} Priority)</span>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    className="px-2.5 py-1.5 border border-neutral-250 bg-white rounded-md text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(task.id)}
                                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-900 text-white rounded-md text-xs font-bold transition"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTaskDone(task.id)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer mt-0.5 ${
                                    task.status === 'Done'
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-neutral-300 hover:border-neutral-400 bg-white text-transparent'
                                  }`}
                                  title={task.status === 'Done' ? "Mark as TO-DO" : "Mark as Done"}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className={`text-xs font-bold leading-tight ${task.status === 'Done' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                                        {task.name}
                                      </h5>
                                      {task.description ? (
                                        <p className="text-xs text-neutral-500 mt-1 pl-0.5 leading-relaxed font-normal">
                                          {task.description}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-neutral-400 italic mt-1 font-normal">No goals description added.</p>
                                      )}
                                    </div>

                                    {/* Badges and controls */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {task.status === 'Done' && (
                                        <motion.div
                                          animate={{
                                            scale: [1, 1.25, 1],
                                            rotate: [0, -10, 10, -10, 10, 0]
                                          }}
                                          transition={{
                                            duration: 0.5,
                                            ease: "easeInOut"
                                          }}
                                          className="text-amber-550 mr-1 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.3)]"
                                          title="Task Completed! 🏆"
                                        >
                                          <Trophy className="w-5 h-5 fill-amber-300 stroke-[2]" />
                                        </motion.div>
                                      )}
                                      <button
                                        onClick={() => handleStartEdit(task)}
                                        className="p-1 hover:bg-neutral-200 rounded text-neutral-550 transition"
                                        title="Edit Task Settings"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-1 hover:bg-rose-100 rounded text-rose-500 transition"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase text-left tracking-wider border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                      {task.priority} Priority
                                    </span>

                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border leading-none flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                      <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
                                      {task.status}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 leading-none flex items-center gap-1">
                                      <span>⭐</span>
                                      <span>+{getPointsByPriority(task.priority)} PTS</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Adding New Task Form Overlay Component */}
                {isAddingNew && (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddTask}
                    className="bg-neutral-100 border border-neutral-200/80 rounded-xl p-4 mt-4 space-y-4 shadow-inner"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                      <h4 className="text-xs font-black uppercase text-neutral-600 tracking-wider">New Task Log</h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
                        Task Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={taskName}
                        onChange={e => setTaskName(e.target.value)}
                        placeholder="e.g. Finish chemistry project"
                        className="w-full text-xs font-bold p-2.5 bg-white rounded-lg border border-neutral-250 text-neutral-800 placeholder-neutral-400 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
                        Description & Specific goals
                      </label>
                      <textarea 
                        rows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detail exact goals and targets..."
                        className="w-full text-xs p-2.5 bg-white rounded-lg border border-neutral-250 text-neutral-800 placeholder-neutral-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
                          Priority Level
                        </label>
                        <select 
                          value={priority}
                          onChange={e => setPriority(e.target.value as TaskPriority)}
                          className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800"
                        >
                          {PRIORITIES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
                          Current status
                        </label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value as TaskStatus)}
                          className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-neutral-250 text-neutral-800"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-1">
                        Completion Point Reward (Fixed by Priority)
                      </label>
                      <div className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-2.5 rounded-md border border-amber-100 flex items-center gap-1 w-fit">
                        <span>⭐</span>
                        <span>+{getPointsByPriority(priority)} PTS will be earned upon Done status ({priority} Priority)</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="px-3 py-1.5 bg-white border border-neutral-250 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-3xs"
                      >
                        Save Task
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>

              {/* Modal controls */}
              <div className="bg-neutral-50 px-5 py-4 border-t border-neutral-150 flex justify-end">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-bold transition shadow-3xs"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      ) : (
        <div className="space-y-6" id="tasks-insights-tab-content">
          {/* KPI Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={getPanelClass("p-5")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Tasks Logged</span>
              <div className="mt-2 text-3xl font-black text-neutral-800">{totalTasksCount}</div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Sum total created to-dos</p>
            </div>
            <div className={getPanelClass("p-5")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Tasks Completed</span>
              <div className="mt-2 text-3xl font-black text-emerald-700">{completedTasksCount}</div>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">✓ Done and dusted</p>
            </div>
            <div className={getPanelClass("p-5")}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 font-mono">Achievement Rate</span>
              <div className="mt-2 text-3xl font-black text-indigo-700">{taskCompletionRate}%</div>
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Average checklist velocity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className={getPanelClass("p-5 space-y-4")}>
              <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Workflow Status Breakdown</h4>
              <div className="space-y-4">
                {statusCounts.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-neutral-700">{item.status}</span>
                      <span className="text-neutral-500">{item.count} items ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-150/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          item.status === 'Done' ? 'bg-emerald-500' :
                          item.status === 'Review' ? 'bg-amber-400' :
                          item.status === 'Blocked' ? 'bg-rose-500' :
                          item.status === 'In Progress' ? 'bg-sky-500' :
                          'bg-neutral-400'
                        }`} 
                        style={{ width: `${item.percentage}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Accomplished Task List */}
            <div className={getPanelClass("p-5 space-y-4")}>
              <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider font-mono">Recent Accomplishments</h4>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {recentCompletedTasks.length > 0 ? (
                  recentCompletedTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-150/60 flex items-center justify-between text-xs font-bold gap-3">
                      <div className="min-w-0">
                        <span className="text-neutral-800 text-xs truncate block">{task.name}</span>
                        {task.description ? (
                          <span className="text-[10px] text-neutral-500 block truncate">{task.description}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">⭐ +{task.rewardPoints || 3}</span>
                        <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-3xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-extrabold text-neutral-400 py-3 text-center">Complete created to-dos to populate task accomplishment logs.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
