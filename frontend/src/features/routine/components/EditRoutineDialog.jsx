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
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

export function EditRoutineDialog({
  isOpen,
  onClose,
  routine,
  onUpdateRoutine,
  onAddTask,
  onEditTask,
  onRemoveTask,
  isUpdating = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (routine) {
      setName(routine.name || '');
      setDescription(routine.description || '');
    }
  }, [routine, isOpen]);

  if (!routine) return null;

  const handleSaveMetadata = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateRoutine({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  const tasks = routine.tasks || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center justify-between">
            <span>Edit Routine: {routine.name}</span>
            {routine.isActive && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                Active Routine
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Update routine details or manage the list of tasks included in this schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveMetadata} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs text-foreground font-medium">
              Routine Name *
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-input text-foreground"
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
              className="bg-background border-input text-foreground min-h-[60px] text-xs resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              {isUpdating ? 'Saving...' : 'Save Name & Description'}
            </Button>
          </div>
        </form>

        {/* Task Management Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Routine Tasks ({tasks.length})</h4>
              <p className="text-[11px] text-muted-foreground">
                Manage individual tasks inside this routine
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddTask}
              className="text-xs border-border bg-background hover:bg-muted text-foreground gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border rounded-md">
                No tasks in this routine yet. Click "Add Task" to get started.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{task.title}</span>
                      <span className="text-[10px] uppercase font-mono-display px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
                        {task.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-display">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>
                        {task.startTime} - {task.endTime}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-[11px] font-sans">
                        {task.daysOfWeek?.length === 7
                          ? 'Every day'
                          : `${task.daysOfWeek?.length || 0} days/week`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTask(task)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveTask(task.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
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
