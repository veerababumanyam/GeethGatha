import React, { useState, useEffect } from "react";
import { Activity, Loader2, Clock, CheckCircle } from "lucide-react";
import { AgentStatus } from "../types";
import { AGENT_SUBTASKS } from "../config";

export const WorkflowStatus = ({ status }: { status: AgentStatus }) => {
  const [elapsed, setElapsed] = useState(0);
  const [subtaskIndex, setSubtaskIndex] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    setElapsed(0);
    setSubtaskIndex(0);
    setProgress(5);
  }, [status.currentAgent]);

  useEffect(() => {
    if (!status.active) return;

    const interval = setInterval(() => {
      setElapsed(prev => prev + 0.1);
      setProgress(prev => {
        const remaining = 98 - prev;
        return prev + (remaining * 0.02);
      });

      const now = Date.now();
      const subtaskList = AGENT_SUBTASKS[status.currentAgent] || [];
      if (subtaskList.length > 0) {
        const newIndex = Math.floor(now / 1500) % subtaskList.length;
        setSubtaskIndex(newIndex);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status.active, status.currentAgent]);

  const subtasks = AGENT_SUBTASKS[status.currentAgent] || ["Processing..."];
  const currentSubtask = subtasks[subtaskIndex % subtasks.length] || "Thinking...";

  return (
    <div className="flex gap-4 message-enter">
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
        <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
      </div>
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none w-full max-w-md backdrop-blur-sm shadow-2xl overflow-hidden transition-colors duration-300">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />
            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs tracking-wider uppercase">
              {status.currentAgent} Agent
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-mono">
            <Clock className="w-3 h-3" />
            <span>{elapsed.toFixed(1)}s</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              <span>Status</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 dark:from-amber-600 dark:to-amber-400 transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-200/80 font-medium italic animate-pulse">
              {currentSubtask}
            </p>
          </div>

          {/* Scrollable steps list */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/50 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
            {status.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                  {step.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                  )}
                  {step.status === 'active' && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
                <span className={`text-xs transition-all duration-300 ${
                  step.status === 'active' ? 'text-slate-900 dark:text-slate-200 font-medium scale-105 origin-left' : 
                  step.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700' : 
                  'text-slate-500 dark:text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};