import React from 'react';
import { Check, Clock, MoreVertical, XCircle, RotateCcw } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';

const CATEGORY_STYLES = {
  coding: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  study: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  fitness: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  health: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  college: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  work: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700',
  personal: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  general: 'bg-muted text-muted-foreground border-border',
};

export function RoutineTaskItem({ taskLog, onStatusChange, isUpdating }) {
  const isCompleted = taskLog.status === 'COMPLETED';
  const isSkipped = taskLog.status === 'SKIPPED';
  const isPending = taskLog.status === 'PENDING';

  const category = taskLog.routineTask?.category?.toLowerCase() || 'general';
  const categoryClass = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;

  const handleToggle = () => {
    if (isCompleted) {
      onStatusChange(taskLog.id, 'PENDING');
    } else {
      onStatusChange(taskLog.id, 'COMPLETED');
    }
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-4 rounded-md border transition-colors ${
        isCompleted
          ? 'bg-emerald-500/[0.05] border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/30'
          : isSkipped
          ? 'bg-muted/30 border-border/60 opacity-60'
          : 'bg-card border-border hover:bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Checkbox Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isUpdating}
          className={`flex items-center justify-center w-5 h-5 rounded border transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:border-emerald-500'
              : isSkipped
              ? 'border-border bg-muted text-muted-foreground'
              : 'border-input bg-background hover:bg-muted text-transparent'
          }`}
          aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          {isSkipped && <XCircle className="w-3.5 h-3.5" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium transition-colors truncate ${
                isCompleted
                  ? 'line-through text-muted-foreground'
                  : isSkipped
                  ? 'line-through text-muted-foreground italic'
                  : 'text-foreground'
              }`}
            >
              {taskLog.taskTitleSnapshot}
            </span>

            <span
              className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono-display tracking-wider ${categoryClass}`}
            >
              {category}
            </span>

            {isCompleted && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Done
              </span>
            )}
            {isSkipped && (
              <span className="text-[11px] text-muted-foreground font-medium">
                Skipped
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono-display">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {taskLog.startTimeSnapshot} - {taskLog.endTimeSnapshot}
            </span>
            {taskLog.completedAt && (
              <span className="text-[11px] font-mono-display">
                Completed at{' '}
                {new Date(taskLog.completedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md ml-2"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-popover border-border text-popover-foreground">
          {!isCompleted && (
            <DropdownMenuItem
              onClick={() => onStatusChange(taskLog.id, 'COMPLETED')}
              className="flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
            >
              <Check className="w-4 h-4" />
              Complete
            </DropdownMenuItem>
          )}
          {!isPending && (
            <DropdownMenuItem
              onClick={() => onStatusChange(taskLog.id, 'PENDING')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Pending
            </DropdownMenuItem>
          )}
          {!isSkipped && (
            <DropdownMenuItem
              onClick={() => onStatusChange(taskLog.id, 'SKIPPED')}
              className="flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400"
            >
              <XCircle className="w-4 h-4" />
              Skip Task
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
