import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, CheckSquare, Heart, Gift, Award, 
  Sparkles, Calendar, Zap, AlertCircle, Sliders, Smile
} from 'lucide-react';

interface HelpViewProps {
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}

export default function HelpView({ bgTheme }: HelpViewProps) {
  const isDarkBg = bgTheme && bgTheme !== 'none';
  
  const getDarkPanelClass = (additional = '') => {
    return `bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg transition-all duration-300 ${additional}`;
  };

  return (
    <div className="space-y-6 animate-fade-in py-2" id="help-view-container">
      {/* Detailed Guides Section */}
      <div className="space-y-4" id="detailed-creation-guides">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono block">
          🔧 Tracker Creation Guides
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Panel 1: Habit Configurator */}
          <div className={getDarkPanelClass("p-5 border-l-4 border-l-violet-500")} id="guide-panel-habit-configurator">
            <div className="flex items-start gap-4">
              <span className="p-2.5 rounded-xl bg-violet-950/40 text-violet-450 border border-violet-900/50 shrink-0">
                <Sliders className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm">Habit Tracker Configurator</h4>
                <p className="text-xs text-neutral-450 font-semibold uppercase tracking-wider font-mono">Setup & goal configuration</p>
                <div className="text-xs text-neutral-300 font-medium leading-relaxed space-y-2 mt-2">
                  <p>
                    The <strong>Habit Configurator</strong> lets you adjust parameters so that tracking feels perfect. Type in an actionable habit name (e.g., <em>Active Running</em> or <em>Drink Water</em>), choose standard or custom categories, and pick one of these distinct tracker types:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 pt-1">
                    <li>
                      <strong className="text-white">TIME Type:</strong> Use this option when duration is required (e.g., gym logs, sleeping, or reading cycles). You can set precise targets in hours and minutes, then complete the card incrementally or checking it off.
                    </li>
                    <li>
                      <strong className="text-white">QUANTITY Type:</strong> Use this option when count metrics are required (e.g., cups of water consumed, book pages read, or water bottles completed). Specify custom helper units and daily numeric goals.
                    </li>
                    <li>
                      <strong className="text-white">ON/OFF Type:</strong> Use this option for simple checklist routines (e.g., taking vitamins, watering plants, or making your bed) that only demand a quick checked or unchecked log.
                    </li>
                  </ul>
                  <p className="text-[11px] text-violet-300 bg-violet-950/60 border border-violet-900/60 p-2.5 rounded-xl font-semibold mt-2">
                    🔥 Completing active slots each day builds your Flame Streak and deposits +5 points directly into your rewards vault!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Task Creation */}
          <div className={getDarkPanelClass("p-5 border-l-4 border-l-indigo-500")} id="guide-panel-task-creation">
            <div className="flex items-start gap-4">
              <span className="p-2.5 rounded-xl bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 shrink-0">
                <CheckSquare className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm">Task & Deadline Manager</h4>
                <p className="text-xs text-neutral-450 font-semibold uppercase tracking-wider font-mono">Setting individual todo achievements</p>
                <div className="text-xs text-neutral-300 font-medium leading-relaxed space-y-2 mt-2">
                  <p>
                    Unlike repeating habits, <strong>Tasks</strong> are individual assignments or milestones. You can organize them using deadlines and priority markers:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 pt-1">
                    <li>
                      <strong className="text-white">Creation:</strong> Go to the Tasks page and fill in the task form. Select an appropriate priority tag (Low, Medium, High). Higher priority tasks yield greater points.
                    </li>
                    <li>
                      <strong className="text-white">Scheduling:</strong> Assign the task to specific dates. You can browse the interactive calendar to see overdue items, pending deadlines, and future schedules.
                    </li>
                    <li>
                      <strong className="text-white">Fulfilling & Points:</strong> Check off any active task on your dashboard to instantly harvest its designated points reward (+1 point for Low, +3 for Medium, +5 for High) and safely move it into the archived log.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Mood Creation */}
          <div className={getDarkPanelClass("p-5 border-l-4 border-l-rose-500")} id="guide-panel-mood-creation">
            <div className="flex items-start gap-4">
              <span className="p-2.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/50 shrink-0">
                <Smile className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm">Mood Creation & Wellness Logs</h4>
                <p className="text-xs text-neutral-450 font-semibold uppercase tracking-wider font-mono">Logging emotional energy & triggers</p>
                <div className="text-xs text-neutral-300 font-medium leading-relaxed space-y-2 mt-2">
                  <p>
                    A comprehensive lifestyle routine relies on healthy mental and emotional energy levels. Use the <strong>Mood Tracker</strong> to logs check-ins and analyze emotional frequencies:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 pt-1">
                    <li>
                      <strong className="text-white">Logging Moods:</strong> Tap any representative emoji to capture your emotional state. You can also append customizable notes to record specific triggers, gratitudes, or details.
                    </li>
                    <li>
                      <strong className="text-white">Customizing Catalog:</strong> Modify the mood scale by creating customized emoji states, defining rating scores, and arranging their ordering hierarchy.
                    </li>
                    <li>
                      <strong className="text-white">Visual Correlations:</strong> Head to the <strong>Insights</strong> and <strong>Trends</strong> views. Explore dynamic scatter plots and trendlines mapping how consistent habit completions boost your emotional frequency!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Graphic component drawing an animated CSS open book
function BookGraphic() {
  return (
    <svg 
      className="w-7 h-7" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2.5}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
      />
    </svg>
  );
}
