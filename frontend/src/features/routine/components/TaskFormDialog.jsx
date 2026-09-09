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

const ALL_DAYS = [
  { id: 'MONDAY', label: 'Mon' },
  { id: 'TUESDAY', label: 'Tue' },
  { id: 'WEDNESDAY', label: 'Wed' },
  { id: 'THURSDAY', label: 'Thu' },
  { id: 'FRIDAY', label: 'Fri' },
  { id: 'SATURDAY', label: 'Sat' },
  { id: 'SUNDAY', label: 'Sun' },
];

const CATEGORIES = [
  { value: 'coding', label: 'Coding / LeetCode' },
  { value: 'study', label: 'Study & Academics' },
  { value: 'fitness', label: 'Fitness & Gym' },
  { value: 'health', label: 'Health & Nutrition' },
  { value: 'college', label: 'College / Classes' },
  { value: 'work', label: 'Work & Projects' },
  { value: 'personal', label: 'Personal & Habits' },
  { value: 'general', label: 'General' },
];

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

export function TaskFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
  title = 'Add New Task',
}) {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [category, setCategory] = useState('coding');
  const [daysOfWeek, setDaysOfWeek] = useState(ALL_DAYS.map((d) => d.id));
  const [priority, setPriority] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTaskTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setStartTime(initialData.startTime || '07:00');
        setEndTime(initialData.endTime || '08:00');
        setCategory(initialData.category || 'coding');
        setDaysOfWeek(initialData.daysOfWeek || ALL_DAYS.map((d) => d.id));
        setPriority(initialData.priority || 1);
      } else {
        setTaskTitle('');
        setDescription('');
        setStartTime('07:00');
        setEndTime('08:00');
        setCategory('coding');
        setDaysOfWeek(ALL_DAYS.map((d) => d.id));
        setPriority(1);
      }
    }
  }, [initialData, isOpen]);

  const toggleDay = (dayId) => {
    if (daysOfWeek.includes(dayId)) {
      if (daysOfWeek.length === 1) return;
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayId));
    } else {
      setDaysOfWeek([...daysOfWeek, dayId]);
    }
  };

  const selectAllDays = () => setDaysOfWeek(ALL_DAYS.map((d) => d.id));
  const selectWeekdays = () =>
    setDaysOfWeek(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const selectWeekends = () => setDaysOfWeek(['SATURDAY', 'SUNDAY']);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onSubmit({
      title: taskTitle.trim(),
      description: description.trim() || null,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      category,
      daysOfWeek,
      priority: parseInt(priority, 10) || 1,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md bg-card border border-border text-card-foreground shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Configure schedule, category, and repeating days for this task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs text-foreground">
              Task Name *
            </Label>
            <Input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. LeetCode Practice, Gym, DSA Review"
              className="bg-background border-input text-foreground text-sm"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time" className="text-xs text-foreground">
                Start Time *
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-background border-input text-foreground font-mono-display text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time" className="text-xs text-foreground">
                End Time *
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-background border-input text-foreground font-mono-display text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-category" className="text-xs text-foreground">
                Category
              </Label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-input rounded-md text-xs text-foreground px-2.5 h-10"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority" className="text-xs text-foreground">
                Priority
              </Label>
              <select
                id="task-priority"
                value={String(priority)}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="w-full bg-background border border-input rounded-md text-xs text-foreground px-2.5 h-10"
              >
                <option value="1">High Priority (1)</option>
                <option value="2">Medium Priority (2)</option>
                <option value="3">Normal Priority (3)</option>
              </select>
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground">Repeating Days</Label>
              <div className="flex gap-2 text-[10px] text-muted-foreground font-mono-display">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  Weekdays
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={selectWeekends}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1">
              {ALL_DAYS.map((d) => {
                const selected = daysOfWeek.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-mono-display border transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary font-medium'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3">
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
              disabled={isSubmitting || !taskTitle.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
