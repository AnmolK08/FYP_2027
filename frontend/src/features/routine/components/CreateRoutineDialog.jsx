import React, { useState } from 'react';
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
import { Plus, Trash2, Sparkles, Clock } from 'lucide-react';
import { Checkbox } from '../../../components/ui/checkbox';

const PRESET_TEMPLATES = [
  {
    name: 'College & DSA Grind',
    description: 'Balanced daily schedule for college students targeting technical placements',
    tasks: [
      { title: 'Wake up & Hydrate', startTime: '05:30', endTime: '06:00', category: 'health', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
      { title: 'LeetCode Practice (2 Problems)', startTime: '06:00', endTime: '07:30', category: 'coding', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
      { title: 'Gym & Workout', startTime: '07:30', endTime: '08:30', category: 'fitness', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
      { title: 'College Classes', startTime: '09:00', endTime: '16:00', category: 'college', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
      { title: 'DSA & System Design Revision', startTime: '18:00', endTime: '20:00', category: 'study', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    ],
  },
  {
    name: 'Weekend Contest & Projects',
    description: 'Contest preparation and full-stack project development for weekends',
    tasks: [
      { title: 'Weekly Biweekly Contest', startTime: '10:30', endTime: '12:00', category: 'coding', daysOfWeek: ['SATURDAY', 'SUNDAY'] },
      { title: 'Full Stack Project Development', startTime: '14:00', endTime: '18:00', category: 'work', daysOfWeek: ['SATURDAY', 'SUNDAY'] },
      { title: 'Mock Interview Practice', startTime: '19:00', endTime: '20:30', category: 'coding', daysOfWeek: ['SATURDAY', 'SUNDAY'] },
    ],
  },
];

export function CreateRoutineDialog({ isOpen, onClose, onCreateRoutine, isSubmitting = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [tasks, setTasks] = useState([
    {
      title: 'Wake up',
      startTime: '06:00',
      endTime: '06:30',
      category: 'health',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    },
    {
      title: 'LeetCode Practice',
      startTime: '06:30',
      endTime: '08:00',
      category: 'coding',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    },
  ]);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setDescription(preset.description);
    setTasks(preset.tasks);
  };

  const addTaskRow = () => {
    setTasks([
      ...tasks,
      {
        title: '',
        startTime: '09:00',
        endTime: '10:00',
        category: 'study',
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      },
    ]);
  };

  const updateTaskField = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const removeTaskRow = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validTasks = tasks.filter((t) => t.title && t.title.trim());

    onCreateRoutine({
      name: name.trim(),
      description: description.trim() || null,
      isActive,
      tasks: validTasks,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground p-6 shadow-lg">
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
                className="text-xs border-border bg-background hover:bg-muted text-foreground"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="routine-name" className="text-xs text-foreground font-medium">
              Routine Name *
            </Label>
            <Input
              id="routine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Routine A: Placement Season Sprint"
              className="bg-background border-input text-foreground"
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
              placeholder="e.g. Focuses on daily LeetCode medium problems and college coursework"
              className="bg-background border-input text-foreground min-h-[60px] text-xs resize-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
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
                <h4 className="text-sm font-semibold text-foreground">Routine Tasks</h4>
                <p className="text-[11px] text-muted-foreground">
                  Add the habits and time blocks for this routine
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTaskRow}
                className="text-xs border-border bg-background hover:bg-muted text-foreground gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </Button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/40 border border-border p-3 rounded-md"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Task title (e.g. LeetCode)"
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
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-display">
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
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTaskRow(index)}
                    className="text-muted-foreground hover:text-destructive hover:bg-muted h-8 w-8 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isSubmitting ? 'Creating...' : 'Create Routine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
