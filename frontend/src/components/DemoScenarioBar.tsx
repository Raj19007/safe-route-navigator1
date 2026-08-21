import React from 'react';
import { Sparkles, Moon, AlertOctagon, Accessibility, RotateCcw } from 'lucide-react';

interface DemoScenarioBarProps {
  onRunScenario1: () => void;
  onRunScenario2: () => void;
  onRunScenario3: () => void;
  onReset: () => void;
  activeScenario: string | null;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  onRunScenario1,
  onRunScenario2,
  onRunScenario3,
  onReset,
  activeScenario,
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-b border-indigo-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0 text-xs">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold text-[10px] uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Judge Demo Console</span>
        </div>
        <span className="text-slate-300 font-medium hidden md:inline">
          1-Click Live Dynamic Scenarios:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Scenario 1 */}
        <button
          onClick={onRunScenario1}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold border transition-all ${
            activeScenario === 'scenario1'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Shifts time from Day to 11:30 PM Night"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>1. Night Shift (11:30 PM)</span>
        </button>

        {/* Scenario 2 */}
        <button
          onClick={onRunScenario2}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold border transition-all ${
            activeScenario === 'scenario2'
              ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30'
          }`}
          title="Injects Hazard on Route B: Risk jumps & Route C becomes Recommended"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Live Incident on Route B</span>
        </button>

        {/* Scenario 3 */}
        <button
          onClick={onRunScenario3}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold border transition-all ${
            activeScenario === 'scenario3'
              ? 'bg-teal-600 text-white border-teal-400 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Accessibility & Wheelchair Ramp Priority"
        >
          <Accessibility className="w-3.5 h-3.5 text-teal-400" />
          <span>3. Accessibility Mode</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
          title="Reset to Day Baseline"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
