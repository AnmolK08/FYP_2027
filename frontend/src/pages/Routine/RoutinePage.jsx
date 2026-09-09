import React, { useState } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import {
  CalendarCheck,
  Plus,
  Flame,
  Calendar as CalendarIcon,
  Layers,
  BarChart3,
  CheckCircle2,
  Clock,
  MoreVertical,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Hooks
import {
  useRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useArchiveRoutine,
  useActivateRoutine,
  useAddRoutineTask,
  useUpdateRoutineTask,
  useRemoveRoutineTask,
} from '../../features/routine/hooks/useRoutines';
import { useTodayRoutine, useUpdateTaskLog } from '../../features/routine/hooks/useTodayRoutine';
import {
  useWeeklyAnalytics,
  useMonthlyAnalytics,
  useRoutineSuggestions,
} from '../../features/routine/hooks/useRoutineAnalytics';

// Components
import { RoutineTaskItem } from '../../features/routine/components/RoutineTaskItem';
import { RoutineProgressRing } from '../../features/routine/components/RoutineProgressRing';
import { CreateRoutineDialog } from '../../features/routine/components/CreateRoutineDialog';
import { EditRoutineDialog } from '../../features/routine/components/EditRoutineDialog';
import { TaskFormDialog } from '../../features/routine/components/TaskFormDialog';
import { WeeklyChart } from '../../features/routine/components/WeeklyChart';
import { MonthlyCalendar } from '../../features/routine/components/MonthlyCalendar';
import { SuggestionsPanel } from '../../features/routine/components/SuggestionsPanel';

export default function RoutinePage() {
  const [activeTab, setActiveTab] = useState('today');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditRoutineOpen, setIsEditRoutineOpen] = useState(false);
  const [selectedRoutineForEdit, setSelectedRoutineForEdit] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormRoutineId, setTaskFormRoutineId] = useState(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);

  // Month navigation for analytics
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getUTCMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(now.getUTCFullYear());

  // Queries
  const { data: routines = [], isLoading: isLoadingRoutines } = useRoutines();
  const { data: todayData, isLoading: isLoadingToday } = useTodayRoutine();
  const { data: weeklyStats } = useWeeklyAnalytics();
  const { data: monthlyStats } = useMonthlyAnalytics({
    month: calendarMonth,
    year: calendarYear,
  });
  const { data: suggestionsData } = useRoutineSuggestions();

  // Mutations
  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();
  const archiveRoutineMutation = useArchiveRoutine();
  const activateRoutineMutation = useActivateRoutine();
  const addTaskMutation = useAddRoutineTask();
  const updateTaskMutation = useUpdateRoutineTask();
  const removeTaskMutation = useRemoveRoutineTask();
  const updateTaskLogMutation = useUpdateTaskLog();

  const activeRoutine = todayData?.activeRoutine || routines.find((r) => r.isActive);
  const routineDay = todayData?.routineDay;
  const taskLogs = routineDay?.taskLogs || [];

  const handleTaskStatusChange = (taskLogId, status) => {
    if (!routineDay) return;
    updateTaskLogMutation.mutate({
      dayId: routineDay.id,
      taskLogId,
      status,
    });
  };

  const handleCreateRoutineSubmit = (data) => {
    createRoutineMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  const handleOpenEditRoutine = (routine) => {
    setSelectedRoutineForEdit(routine);
    setIsEditRoutineOpen(true);
  };

  const handleOpenAddTask = (routineId) => {
    setTaskFormRoutineId(routineId);
    setSelectedTaskForEdit(null);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTask = (task, routineId) => {
    setTaskFormRoutineId(routineId);
    setSelectedTaskForEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormSubmit = (taskData) => {
    if (selectedTaskForEdit) {
      updateTaskMutation.mutate(
        { taskId: selectedTaskForEdit.id, data: taskData },
        {
          onSuccess: () => {
            setIsTaskFormOpen(false);
            setSelectedTaskForEdit(null);
          },
        }
      );
    } else if (taskFormRoutineId) {
      addTaskMutation.mutate(
        { routineId: taskFormRoutineId, data: taskData },
        {
          onSuccess: () => {
            setIsTaskFormOpen(false);
          },
        }
      );
    }
  };

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14 space-y-8">
          {/* Header Section matching Dashboard & Streaks */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 pb-2">
            <div>
              <div className="text-overline">Consistency Engine</div>
              <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                Habit & Routine Tracker
              </h1>
              <p className="text-muted-foreground mt-2 text-sm flex items-center gap-2">
                <span>{currentDateFormatted}</span>
                {activeRoutine && (
                  <>
                    <span>-</span>
                    <span className="text-foreground font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Active: {activeRoutine.name}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Plus size={15} />
                New Routine
              </Button>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted border border-border p-1 rounded-md">
              <TabsTrigger
                value="today"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm gap-2"
              >
                <CheckCircle2 size={15} />
                Today&apos;s Plan
              </TabsTrigger>
              <TabsTrigger
                value="routines"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm gap-2"
              >
                <Layers size={15} />
                My Routines ({routines.length})
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-sm gap-2"
              >
                <BarChart3 size={15} />
                Analytics & Insights
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: TODAY */}
            <TabsContent value="today" className="space-y-6 focus:outline-none">
              {!activeRoutine ? (
                <div className="ps-card text-center py-12">
                  <div className="max-w-md mx-auto space-y-4">
                    <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto" />
                    <h3 className="font-heading text-lg text-foreground">No Active Routine</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven&apos;t activated a daily routine yet. Create a new routine or activate an existing one to begin checking off habits.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-primary text-primary-foreground"
                      >
                        Create Routine
                      </Button>
                      {routines.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('routines')}
                          className="border-border text-foreground hover:bg-muted"
                        >
                          Choose Existing
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Radial Progress Ring */}
                  <RoutineProgressRing
                    percentage={routineDay?.completionPercentage || 0}
                    completedCount={routineDay?.completedTasks || 0}
                    totalCount={routineDay?.totalTasks || 0}
                  />

                  {/* Daily Tasks Checklist */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h2 className="font-heading text-xl text-foreground">Today&apos;s Schedule</h2>
                        <p className="text-xs text-muted-foreground">
                          Check off each habit as you complete it
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddTask(activeRoutine.id)}
                        className="text-xs border-border bg-background hover:bg-muted text-foreground gap-1.5 h-8"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Habit Today
                      </Button>
                    </div>

                    {isLoadingToday ? (
                      <div className="space-y-2 py-4">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-16 rounded-md bg-muted/40 border border-border animate-pulse"
                          />
                        ))}
                      </div>
                    ) : taskLogs.length === 0 ? (
                      <div className="ps-card text-center py-10 space-y-3">
                        <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                        <p className="font-heading text-base text-foreground">
                          No habits scheduled for today in &quot;{activeRoutine.name}&quot;
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Tasks in this routine might be configured for other days of the week.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditRoutine(activeRoutine)}
                          className="border-border bg-background hover:bg-muted text-foreground text-xs"
                        >
                          Edit Schedule
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {taskLogs.map((log) => (
                          <RoutineTaskItem
                            key={log.id}
                            taskLog={log}
                            onStatusChange={handleTaskStatusChange}
                            isUpdating={updateTaskLogMutation.isPending}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB 2: MY ROUTINES */}
            <TabsContent value="routines" className="space-y-6 focus:outline-none">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl text-foreground">Your Routine Library</h2>
                  <p className="text-xs text-muted-foreground">
                    Create routines for weekdays, weekends, exams, or projects. Only one routine is active at a time.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Routine
                </Button>
              </div>

              {isLoadingRoutines ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-48 rounded-md bg-muted/40 border border-border animate-pulse"
                    />
                  ))}
                </div>
              ) : routines.length === 0 ? (
                <div className="ps-card text-center py-12 space-y-3">
                  <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h3 className="font-heading text-base text-foreground">No Routines Created</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Routines let you structure your day into achievable habit blocks like LeetCode practice, workouts, and study sessions.
                  </p>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary text-primary-foreground text-xs mt-2"
                  >
                    Create Your First Routine
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {routines.map((routine) => {
                    const isCurrentActive = routine.isActive;
                    const tasks = routine.tasks || [];

                    return (
                      <div
                        key={routine.id}
                        className={`ps-card flex flex-col justify-between space-y-4 transition-colors ${
                          isCurrentActive
                            ? 'border-2 border-primary/70 shadow-sm'
                            : 'hover:border-border/80'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-heading text-lg text-foreground">
                                  {routine.name}
                                </h3>
                                {isCurrentActive && (
                                  <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-semibold">
                                    Active Routine
                                  </Badge>
                                )}
                              </div>
                              {routine.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {routine.description}
                                </p>
                              )}
                            </div>

                            {/* Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-popover border-border text-popover-foreground">
                                {!isCurrentActive && (
                                  <DropdownMenuItem
                                    onClick={() => activateRoutineMutation.mutate(routine.id)}
                                    className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                                  >
                                    Set as Active Routine
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditRoutine(routine)}
                                  className="cursor-pointer"
                                >
                                  Edit Routine & Tasks
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenAddTask(routine.id)}
                                  className="cursor-pointer"
                                >
                                  Add New Task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => archiveRoutineMutation.mutate(routine.id)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  Archive Routine
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Tasks Preview */}
                          <div className="space-y-1.5 pt-1">
                            <div className="text-overline">
                              Scheduled Habits ({tasks.length})
                            </div>

                            {tasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic py-2">
                                No tasks added yet. Click &quot;Add Task&quot; to configure.
                              </p>
                            ) : (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-muted/40 border border-border"
                                  >
                                    <span className="font-medium text-foreground truncate">
                                      {task.title}
                                    </span>
                                    <span className="font-mono-display text-muted-foreground text-[11px]">
                                      {task.startTime} - {task.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditRoutine(routine)}
                            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                          >
                            Manage Tasks
                          </Button>

                          {isCurrentActive ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Currently Active
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateRoutineMutation.mutate(routine.id)}
                              disabled={activateRoutineMutation.isPending}
                              className="border-border bg-background hover:bg-muted text-foreground text-xs h-8"
                            >
                              Activate Routine
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: ANALYTICS */}
            <TabsContent value="analytics" className="space-y-8 focus:outline-none">
              {/* Suggestions Panel */}
              <SuggestionsPanel
                suggestions={suggestionsData?.suggestions || []}
                metrics={suggestionsData?.metrics || {}}
              />

              {/* Weekly Chart Card */}
              <div className="ps-card">
                <div className="mb-4">
                  <div className="font-heading text-lg text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span>Weekly Routine Completion</span>
                  </div>
                  <div className="text-overline mt-0.5">
                    Completion rate across the last 7 days
                  </div>
                </div>
                <WeeklyChart
                  days={weeklyStats?.days || []}
                  summary={weeklyStats?.summary || {}}
                />
              </div>

              {/* Monthly Calendar Card */}
              <div className="ps-card">
                <div className="mb-4">
                  <div className="font-heading text-lg text-foreground flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span>Monthly Consistency Heatmap</span>
                  </div>
                  <div className="text-overline mt-0.5">
                    Daily completion tracking and streak streaks
                  </div>
                </div>
                <MonthlyCalendar
                  year={calendarYear}
                  month={calendarMonth}
                  calendar={monthlyStats?.calendar || []}
                  summary={monthlyStats?.summary || {}}
                  onMonthChange={(m, y) => {
                    setCalendarMonth(m);
                    setCalendarYear(y);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Dialog Modals */}
          <CreateRoutineDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreateRoutine={handleCreateRoutineSubmit}
            isSubmitting={createRoutineMutation.isPending}
          />

          <EditRoutineDialog
            isOpen={isEditRoutineOpen}
            onClose={() => {
              setIsEditRoutineOpen(false);
              setSelectedRoutineForEdit(null);
            }}
            routine={selectedRoutineForEdit}
            onUpdateRoutine={(data) => {
              if (selectedRoutineForEdit) {
                updateRoutineMutation.mutate({
                  routineId: selectedRoutineForEdit.id,
                  data,
                });
              }
            }}
            onAddTask={() => {
              if (selectedRoutineForEdit) {
                handleOpenAddTask(selectedRoutineForEdit.id);
              }
            }}
            onEditTask={(task) => {
              if (selectedRoutineForEdit) {
                handleOpenEditTask(task, selectedRoutineForEdit.id);
              }
            }}
            onRemoveTask={(taskId) => {
              removeTaskMutation.mutate(taskId);
            }}
            isUpdating={updateRoutineMutation.isPending}
          />

          <TaskFormDialog
            isOpen={isTaskFormOpen}
            onClose={() => {
              setIsTaskFormOpen(false);
              setSelectedTaskForEdit(null);
            }}
            onSubmit={handleTaskFormSubmit}
            initialData={selectedTaskForEdit}
            isSubmitting={addTaskMutation.isPending || updateTaskMutation.isPending}
            title={selectedTaskForEdit ? 'Edit Habit Task' : 'Add Habit Task'}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
