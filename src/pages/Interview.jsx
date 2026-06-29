import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useMockInterviews, useSaveMockInterview, useUpdateMockInterview } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import {
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

const PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9`,
    starterCode: `function twoSum(nums, target) {
  // Your code here

}`,
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example:
Input: s = "()[]{}"
Output: true`,
    starterCode: `function isValid(s) {
  // Your code here

}`,
    testCases: [
      { input: ['()'], expected: true },
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
    ],
  },
  {
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    starterCode: `function mergeTwoLists(list1, list2) {
  // Your code here
  // Assume list nodes have .val and .next properties

}`,
    testCases: [
      { input: [null, null], expected: null },
    ],
  },
];

export default function MockInterview() {
  const { user } = useAuth();
  const [currentProblem, setCurrentProblem] = useState(PROBLEMS[0]);
  const [code, setCode] = useState('');
  const [language] = useState('javascript');
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [currentInterviewId, setCurrentInterviewId] = useState(null);

  const { data: interviews = [] } = useMockInterviews();
  const saveMockInterview = useSaveMockInterview();
  const updateMockInterview = useUpdateMockInterview();

  useEffect(() => {
    if (PROBLEMS[selectedProblem]) {
      setCurrentProblem(PROBLEMS[selectedProblem]);
      setCode(PROBLEMS[selectedProblem].starterCode);
    }
  }, [selectedProblem]);

  const startInterview = async () => {
    if (!user || !currentProblem) return;
    setStatus('running');
    setTimeLeft(duration * 60);

    try {
      const result = await saveMockInterview.mutateAsync({
        type: 'coding',
        problem_title: currentProblem.title,
        problem_description: currentProblem.description,
        starter_code: currentProblem.starterCode,
        language,
        duration_minutes: duration,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
      setCurrentInterviewId(result.id);
    } catch (e) {
      console.error('Error starting interview:', e);
    }
  };

  const finishInterview = async (abandoned = false) => {
    setStatus(abandoned ? 'abandoned' : 'completed');
    const passed = testResults.filter((t) => t.passed).length;
    const total = testResults.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    if (currentInterviewId) {
      try {
        await updateMockInterview.mutateAsync({
          id: currentInterviewId,
          updates: {
            status: abandoned ? 'abandoned' : 'completed',
            code,
            score,
            feedback: {
              passed,
              total,
              testResults,
            },
            completed_at: new Date().toISOString(),
          },
        });
        toast.success(abandoned ? 'Interview ended' : `Interview completed! Score: ${score}%`);
      } catch (e) {
        console.error('Error finishing interview:', e);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (status === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishInterview(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const runTests = () => {
    if (!currentProblem?.testCases) return;

    const results = [];

    for (const tc of currentProblem.testCases) {
      try {
        const func = new Function(`return ${code}`)();
        const result = func(...tc.input);
        const passed = JSON.stringify(result) === JSON.stringify(tc.expected);
        results.push({
          passed,
          input: tc.input,
          expected: tc.expected,
          output: result,
        });
      } catch (e) {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
        });
      }
    }

    setTestResults(results);
  };

  const resetInterview = () => {
    setStatus('idle');
    setTimeLeft(0);
    setTestResults([]);
    setCurrentInterviewId(null);
    if (currentProblem) {
      setCode(currentProblem.starterCode);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-overline">M5 - Mock Interview</p>
              <h1 className="font-heading text-3xl lg:text-4xl tracking-tight text-foreground mt-2">
                Practice under pressure.
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Timed coding rounds with real LeetCode-style problems. Get instant feedback on your solutions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field w-32"
                disabled={status === 'running'}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 mt-8">
            <aside className="lg:col-span-1">
              <div className="ps-card-soft p-4">
                <p className="text-overline mb-3">Problems</p>
                <div className="space-y-2">
                  {PROBLEMS.map((p, i) => (
                    <button
                      key={p.title}
                      onClick={() => setSelectedProblem(i)}
                      className={`w-full text-left p-3 rounded-md flex items-center gap-2 transition-colors ${
                        selectedProblem === i
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <ChevronRight size={14} />
                      <div>
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs opacity-70">{p.difficulty}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 ps-card-soft p-4">
                <p className="text-overline mb-3">Recent Sessions</p>
                <div className="space-y-2">
                  {interviews.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No sessions yet.</p>
                  ) : (
                    interviews.slice(0, 5).map((int) => (
                      <div key={int.id} className="p-2 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{int.problem_title}</span>
                          {int.status === 'completed' ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={14} className="text-amber-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {int.score !== null && `Score: ${int.score}%`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-3">
              {status === 'idle' ? (
                <div className="ps-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading text-xl text-foreground">
                        {currentProblem?.title}
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          currentProblem?.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : currentProblem?.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}
                      >
                        {currentProblem?.difficulty}
                      </span>
                    </div>
                    <Button onClick={startInterview} className="bg-primary text-primary-foreground">
                      <Play size={14} /> Start Interview
                    </Button>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                    <pre className="whitespace-pre-wrap text-muted-foreground bg-muted p-4 rounded-md">
                      {currentProblem?.description}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="ps-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Timer size={18} className={timeLeft < 300 ? 'text-rose-500' : 'text-muted-foreground'} />
                        <span
                          className={`font-mono-display text-xl ${
                            timeLeft < 300 ? 'text-rose-500' : 'text-foreground'
                          }`}
                        >
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-sm font-medium text-foreground">
                        {currentProblem?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={runTests} variant="outline" size="sm">
                        Run Tests
                      </Button>
                      <Button
                        onClick={() => finishInterview(true)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Square size={14} /> End
                      </Button>
                    </div>
                  </div>

                  <div className="ps-card p-0 overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-mono-display text-muted-foreground">{language}</span>
                    </div>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-[400px] p-4 font-mono text-sm bg-background text-foreground resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>

                  {testResults.length > 0 && (
                    <div className="ps-card p-4">
                      <p className="text-overline mb-3">Test Results</p>
                      <div className="space-y-2">
                        {testResults.map((t, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-md flex items-center gap-3 ${
                              t.passed ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
                            }`}
                          >
                            {t.passed ? (
                              <CheckCircle size={16} className="text-emerald-500" />
                            ) : (
                              <AlertCircle size={16} className="text-rose-500" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                Test Case {i + 1}: {t.passed ? 'Passed' : 'Failed'}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Input: {JSON.stringify(t.input)}
                              </div>
                              {!t.passed && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  Expected: {JSON.stringify(t.expected)}, Got: {JSON.stringify(t.output)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {status === 'completed' && (
                <div className="ps-card p-8 text-center">
                  <Trophy size={40} className="mx-auto text-amber-500 mb-4" />
                  <h2 className="font-heading text-2xl text-foreground mb-2">Session Complete!</h2>
                  <p className="text-muted-foreground mb-6">
                    You completed {testResults.filter((t) => t.passed).length}/{testResults.length} test cases.
                  </p>
                  <Button onClick={resetInterview} className="bg-primary text-primary-foreground">
                    <RotateCcw size={14} /> Try Another
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
