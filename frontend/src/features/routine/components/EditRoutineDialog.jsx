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
import { Plus, Trash2, Edit2, Clock, Check, X, CalendarDays } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

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

export function EditRoutineDialog({
  isOpen,
  onClose,
  routine,
  onUpdateRoutine,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  isUpdating = false,
  isAddingTask = false,
  isUpdatingTask = false,
  isRemovingTask = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Inline "New Task" form state
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('coding');
  const [newTaskStartTime, setNewTaskStartTime] = useState('07:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('08:00');
  const [newTaskDays, setNewTaskDays] = useState(ALL_DAY_IDS);
  const [newTaskPriority, setNewTaskPriority] = useState(1);

  // Inline "Edit Task" state (id of currently editing task)
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('coding');
  const [editTaskStartTime, setEditTaskStartTime] = useState('07:00');
  const [editTaskEndTime, setEditTaskEndTime] = useState('08:00');
  const [editTaskDays, setEditTaskDays] = useState(ALL_DAY_IDS);
  const [editTaskPriority, setEditTaskPriority] = useState(1);

  useEffect(() => {
    if (routine) {
      setName(routine.name || '');
      setDescription(routine.description || '');
    }
  }, [routine, isOpen]);

  if (!routine) return null;

  const handleSaveRoutineDetails = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateRoutine({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  // Toggle days for new task
  const toggleNewTaskDay = (dayId) => {
    if (newTaskDays.includes(dayId)) {
      if (newTaskDays.length === 1) return;
      setNewTaskDays(newTaskDays.filter((d) => d !== dayId));
    } else {
      setNewTaskDays([...newTaskDays, dayId]);
    }
  };

  // Toggle days for edited task
  const toggleEditTaskDay = (dayId) => {
    if (editTaskDays.includes(dayId)) {
      if (editTaskDays.length === 1) return;
      setEditTaskDays(editTaskDays.filter((d) => d !== dayId));
    } else {
      setEditTaskDays([...editTaskDays, dayId]);
    }
  };

  const handleSaveNewTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      startTime: normalizeTime(newTaskStartTime),
      endTime: normalizeTime(newTaskEndTime),
      daysOfWeek: newTaskDays,
      priority: parseInt(newTaskPriority, 10) || 1,
    });

    // Reset inline new task form
    setNewTaskTitle('');
    setNewTaskCategory('coding');
    setNewTaskStartTime('07:00');
    setNewTaskEndTime('08:00');
    setNewTaskDays(ALL_DAY_IDS);
    setNewTaskPriority(1);
    setIsAddingNewTask(false);
  };

  const handleStartEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title || '');
    setEditTaskCategory(task.category || 'coding');
    setEditTaskStartTime(task.startTime || '07:00');
    setEditTaskEndTime(task.endTime || '08:00');
    setEditTaskDays(task.daysOfWeek || ALL_DAY_IDS);
    setEditTaskPriority(task.priority || 1);
  };

  const handleSaveEditedTask = (e) => {
    e.preventDefault();
    if (!editTaskTitle.trim() || !editingTaskId) return;

    onUpdateTask(editingTaskId, {
      title: editTaskTitle.trim(),
      category: editTaskCategory,
      startTime: normalizeTime(editTaskStartTime),
      endTime: normalizeTime(editTaskEndTime),
      daysOfWeek: editTaskDays,
      priority: parseInt(editTaskPriority, 10) || 1,
    });

    setEditingTaskId(null);
  };

  const tasks = routine.tasks || [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsAddingNewTask(false);
          setEditingTaskId(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center justify-between">
            <span>Manage Routine: {routine.name}</span>
            {routine.isActive && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                Active Routine
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Update routine name, description, and manage the scheduled habit tasks.
          </DialogDescription>
        </DialogHeader>

        {/* Routine Details Form */}
        <form onSubmit={handleSaveRoutineDetails} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs text-foreground font-medium">
              Routine Name *
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-input text-foreground h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc" className="text-xs text-foreground font-medium">
              Description
            </Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-input text-foreground min-h-[50px] text-xs resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8"
            >
              {isUpdating ? 'Saving...' : 'Save Routine Details'}
            </Button>
          </div>
        </form>

        {/* Task Management Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Routine Habits ({tasks.length})</h4>
              <p className="text-[11px] text-muted-foreground">
                Add, edit, or delete individual habits inside this schedule
              </p>
            </div>
            {!isAddingNewTask && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNewTask(true)}
                className="text-xs border-border bg-background hover:bg-muted text-foreground gap-1.5 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </Button>
            )}
          </div>

          {/* INLINE ADD TASK FORM */}
          {isAddingNewTask && (
            <form
              onSubmit={handleSaveNewTask}
              className="bg-muted/50 border-2 border-primary/30 rounded-md p-3.5 space-y-3 animate-in fade-in-50 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  New Habit Task
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingNewTask(false)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Task title (e.g. LeetCode Practice, Gym)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-background border-input text-xs h-8 text-foreground flex-1"
                  autoFocus
                  required
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="bg-background border border-input rounded-md text-xs text-foreground px-2 h-8"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Time */}
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono-display">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="time"
                    value={newTaskStartTime}
                    onChange={(e) => setNewTaskStartTime(e.target.value)}
                    className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                    required
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={newTaskEndTime}
                    onChange={(e) => setNewTaskEndTime(e.target.value)}
                    className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                    required
                  />
                </div>

                {/* Days of week */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1 font-mono-display">
                    <CalendarDays className="w-3 h-3" />
                    Days:
                  </span>
                  {DAYS_LIST.map((d) => {
                    const isSelected = newTaskDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleNewTaskDay(d.id)}
                        className={`w-5 h-5 rounded text-[10px] font-mono-display flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                      setNewTaskDays(
                        newTaskDays.length === 7 ? WEEKDAY_IDS : ALL_DAY_IDS
                      )
                    }
                    className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
                  >
                    {newTaskDays.length === 7 ? 'Wkdays' : 'All'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNewTask(false)}
                  className="text-xs h-7 px-2 text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingTask || !newTaskTitle.trim()}
                  className="bg-primary text-primary-foreground text-xs h-7 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAddingTask ? 'Adding...' : 'Add Habit'}
                </Button>
              </div>
            </form>
          )}

          {/* TASKS LIST */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-md">
                No habits in this routine yet. Click &quot;Add Habit&quot; above to configure your schedule.
              </div>
            ) : (
              tasks.map((task) => {
                const isEditingThis = editingTaskId === task.id;
                const taskDays = task.daysOfWeek || ALL_DAY_IDS;

                if (isEditingThis) {
                  return (
                    <form
                      key={task.id}
                      onSubmit={handleSaveEditedTask}
                      className="bg-card border-2 border-primary/50 rounded-md p-3 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-primary" />
                          Editing Habit
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTaskId(null)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="bg-background border-input text-xs h-8 text-foreground flex-1"
                          required
                          autoFocus
                        />
                        <select
                          value={editTaskCategory}
                          onChange={(e) => setEditTaskCategory(e.target.value)}
                          className="bg-background border border-input rounded-md text-xs text-foreground px-2 h-8"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono-display">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="time"
                            value={editTaskStartTime}
                            onChange={(e) => setEditTaskStartTime(e.target.value)}
                            className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                            required
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={editTaskEndTime}
                            onChange={(e) => setEditTaskEndTime(e.target.value)}
                            className="bg-background border border-input rounded px-1.5 py-0.5 text-xs text-foreground font-mono-display"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          {DAYS_LIST.map((d) => {
                            const isSelected = editTaskDays.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => toggleEditTaskDay(d.id)}
                                className={`w-5 h-5 rounded text-[10px] font-mono-display flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                                title={d.id}
                              >
                                {d.label.slice(0, 1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTaskId(null)}
                          className="text-xs h-7 px-2 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isUpdatingTask || !editTaskTitle.trim()}
                          className="bg-primary text-primary-foreground text-xs h-7 gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isUpdatingTask ? 'Updating...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono-display px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
                          {task.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-display">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {task.startTime} - {task.endTime}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] font-sans">
                          {taskDays.length === 7
                            ? 'Every day'
                            : `${taskDays.length} days/wk`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEditTask(task)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isRemovingTask}
                        onClick={() => onRemoveTask(task.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
