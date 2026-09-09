import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Plus, Trash2, Sparkles, Clock, CalendarDays } from 'lucide-react';
import { Checkbox } from '../../../components/ui/checkbox';

const DAYS_LIST = [
  { id: 'MONDAY', label: 'Mon' },
  { id: 'TUESDAY', label: 'Tue' },
  { id: 'WEDNESDAY', label: 'Wed' },
  { id: 'THURSDAY', label: 'Thu' },
  { id: 'FRIDAY', label: 'Fri' },
  { id: 'SATURDAY', label: 'Sat' },
  { id: 'SUNDAY', label: 'Sun' },
];

const ALL_DAY_IDS = DAYS_LIST.map((d) => d.id);
const WEEKDAY_IDS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const WEEKEND_IDS = ['SATURDAY', 'SUNDAY'];

const PRESET_TEMPLATES = [
  {
    name: 'Placement Season Grind',
    description: 'Balanced daily routine for software engineering prep: LeetCode medium/hard, workouts, and coursework',
    tasks: [
      { title: 'Morning Wakeup & Hydrate', startTime: '06:00', endTime: '06:30', category: 'health', daysOfWeek: ALL_DAY_IDS },
      { title: 'LeetCode Daily Challenge & 2 Problems', startTime: '06:30', endTime: '08:00', category: 'coding', daysOfWeek: ALL_DAY_IDS },
      { title: 'Gym & Physical Fitness', startTime: '08:00', endTime: '09:00', category: 'fitness', daysOfWeek: ALL_DAY_IDS },
      { title: 'College Classes / Work', startTime: '09:30', endTime: '16:30', category: 'college', daysOfWeek: WEEKDAY_IDS },
      { title: 'System Design & Core Subjects', startTime: '18:00', endTime: '20:00', category: 'study', daysOfWeek: ALL_DAY_IDS },
    ],
  },
  {
    name: 'Weekend Contest & Building',
    description: 'Focused weekend schedule for contests, open source, and full stack projects',
    tasks: [
      { title: 'Biweekly / Weekly Contest', startTime: '10:00', endTime: '12:00', category: 'coding', daysOfWeek: WEEKEND_IDS },
      { title: 'Full Stack Project Development', startTime: '14:00', endTime: '18:00', category: 'work', daysOfWeek: WEEKEND_IDS },
      { title: 'Mock Interview & DSA Review', startTime: '19:00', endTime: '20:30', category: 'study', daysOfWeek: WEEKEND_IDS },
    ],
  },
];

const DEFAULT_TASKS = [
  {
    title: 'Morning Wakeup',
    startTime: '06:00',
    endTime: '06:30',
    category: 'health',
    daysOfWeek: ALL_DAY_IDS,
  },
  {
    title: 'LeetCode Practice',
    startTime: '06:30',
    endTime: '08:00',
    category: 'coding',
    daysOfWeek: ALL_DAY_IDS,
  },
];

export function CreateRoutineDialog({ isOpen, onClose, onCreateRoutine, isSubmitting = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIsActive(true);
      setTasks(DEFAULT_TASKS);
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setDescription(preset.description);
    setTasks(
      preset.tasks.map((t) => ({
        ...t,
        daysOfWeek: [...(t.daysOfWeek || ALL_DAY_IDS)],
      }))
    );
    setErrorMsg('');
  };

  const addTaskRow = () => {
    setTasks([
      ...tasks,
      {
        title: '',
        startTime: '08:30',
        endTime: '09:30',
        category: 'study',
        daysOfWeek: ALL_DAY_IDS,
      },
    ]);
  };

  const updateTaskField = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const toggleTaskDay = (taskIndex, dayId) => {
    const task = tasks[taskIndex];
    const currentDays = task.daysOfWeek || ALL_DAY_IDS;
    let newDays;
    if (currentDays.includes(dayId)) {
      if (currentDays.length === 1) return; // Keep at least one day
      newDays = currentDays.filter((d) => d !== dayId);
    } else {
      newDays = [...currentDays, dayId];
    }
    updateTaskField(taskIndex, 'daysOfWeek', newDays);
  };

  const setTaskPresetDays = (taskIndex, presetType) => {
    let days = ALL_DAY_IDS;
    if (presetType === 'weekdays') days = WEEKDAY_IDS;
    if (presetType === 'weekends') days = WEEKEND_IDS;
    updateTaskField(taskIndex, 'daysOfWeek', days);
  };

  const removeTaskRow = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '08:00';
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const h = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
      const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
      return `${h}:${m}`;
    }
    return timeStr;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a routine name');
      return;
    }

    // Format & validate tasks
    const validTasks = tasks
      .filter((t) => t.title && t.title.trim())
      .map((t, idx) => ({
        title: t.title.trim(),
        description: t.description?.trim() || null,
        startTime: normalizeTime(t.startTime),
        endTime: normalizeTime(t.endTime),
        category: t.category || 'general',
        daysOfWeek: t.daysOfWeek && t.daysOfWeek.length > 0 ? t.daysOfWeek : ALL_DAY_IDS,
        priority: idx + 1,
      }));

    onCreateRoutine({
      name: name.trim(),
      description: description.trim() || null,
      isActive,
      tasks: validTasks,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">
            Create New Routine
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Design a structured daily habit routine. You can activate it now or save it for later.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="bg-muted/40 border border-border rounded-md p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Quick Start with a Template:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs border-border bg-background hover:bg-muted text-foreground h-7"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="routine-name" className="text-xs text-foreground font-medium">
              Routine Name *
            </Label>
            <Input
              id="routine-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Placement Season Sprint, Morning Routine, Weekend Sprint"
              className="bg-background border-input text-foreground h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="routine-desc" className="text-xs text-foreground font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="routine-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Focuses on daily LeetCode medium problems, DSA revision, and coursework"
              className="bg-background border-input text-foreground min-h-[55px] text-xs resize-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-0.5">
            <Checkbox
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="is-active"
              className="text-xs font-medium leading-none text-foreground cursor-pointer"
            >
              Set as my active daily routine immediately
            </label>
          </div>

          {/* Initial Tasks List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Routine Habits & Tasks</h4>
                <p className="text-[11px] text-muted-foreground">
                  Add the habits and time blocks for this routine ({tasks.length} configured)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTaskRow}
                className="text-xs border-border bg-background hover:bg-muted text-foreground gap-1.5 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </Button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-md">
                  No tasks added yet. Click &quot;Add Habit&quot; above to create one.
                </div>
              ) : (
                tasks.map((task, index) => {
                  const taskDays = task.daysOfWeek || ALL_DAY_IDS;
                  return (
                    <div
                      key={index}
                      className="bg-muted/40 border border-border p-3 rounded-md space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Habit title (e.g. LeetCode, Gym, Study)"
                          value={task.title}
                          onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                          className="bg-background border-input text-xs h-8 text-foreground flex-1"
                        />
                        <select
                          value={task.category}
                          onChange={(e) => updateTaskField(index, 'category', e.target.value)}
                          className="bg-background border border-input rounded-md text-xs text-foreground px-2 h-8"
                        >
                          <option value="coding">Coding</option>
                          <option value="study">Study</option>
                          <option value="fitness">Fitness</option>
                          <option value="health">Health</option>
                          <option value="college">College</option>
                          <option value="work">Work</option>
                          <option value="personal">Personal</option>
                          <option value="general">General</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTaskRow(index)}
                          className="text-muted-foreground hover:text-destructive hover:bg-muted h-8 w-8 rounded-md shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                        {/* Time pickers */}
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono-display">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="time"
                            value={task.startTime}
                            onChange={(e) => updateTaskField(index, 'startTime', e.target.value)}
                            className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={task.endTime}
                            onChange={(e) => updateTaskField(index, 'endTime', e.target.value)}
                            className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                          />
                        </div>

                        {/* Repeating days */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1 font-mono-display">
                            <CalendarDays className="w-3 h-3" />
                            Days:
                          </span>
                          {DAYS_LIST.map((d) => {
                            const isSelected = taskDays.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => toggleTaskDay(index, d.id)}
                                className={`w-5 h-5 rounded text-[10px] font-mono-display flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                                }`}
                                title={d.id}
                              >
                                {d.label.slice(0, 1)}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() =>
                              setTaskPresetDays(
                                index,
                                taskDays.length === 7 ? 'weekdays' : 'all'
                              )
                            }
                            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
                          >
                            {taskDays.length === 7 ? 'Wkdays' : 'All'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs h-9"
            >
              {isSubmitting ? 'Creating...' : 'Create Routine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
