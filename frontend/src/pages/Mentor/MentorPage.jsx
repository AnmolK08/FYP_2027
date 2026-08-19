import { useState, useRef, useEffect } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useChatSessions, useChatMessages, useSendChatMessage, useGenerateWeaknessPlan } from '../../features/mentor/hooks/useMentor';
import { Send, Sparkles, History, Plus, Loader2 } from 'lucide-react';

function MD({ text }) {
  const html = (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, (_, c) => `<pre class="font-mono text-sm p-3 my-2 rounded-md bg-muted overflow-auto">${c}</pre>`)
    .replace(/`([^`]+)`/g, '<code class="font-mono px-1 rounded bg-muted">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="font-heading text-lg mt-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-heading text-xl mt-4">$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul class="list-disc pl-5 my-2">$1</ul>')
    .replace(/`/g, '<br/>');
  return <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function MentorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [plan, setPlan] = useState(null);
  const endRef = useRef(null);

  const { data: sessions = [] } = useChatSessions();
  const sendChatMessage = useSendChatMessage();
  const generatePlan = useGenerateWeaknessPlan();
  const { data: sessionHistory } = useChatMessages(sessionId);

  useEffect(() => {
    if (sessionHistory) {
      setMessages(sessionHistory.map((m) => ({ role: m.role, content: m.content })));
    }
  }, [sessionHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newChat = () => {
    setSessionId(null);
    setMessages([]);
  };

  const openSession = async (sid) => {
    setSessionId(sid);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sendChatMessage.isPending) return;
    setInput('');

    const sId = sessionId || crypto.randomUUID();
    if (!sessionId) setSessionId(sId);

    const newMsgs = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(newMsgs);

    try {
      const response = await sendChatMessage.mutateAsync({ message: text, sessionId: sId });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: response.response || response.answer || response };
        return copy;
      });
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: 'Error talking to mentor.' };
        return copy;
      });
    }
  };

  const handleGeneratePlan = async () => {
    try {
      const result = await generatePlan.mutateAsync();
      setPlan(result);
    } catch (e) {
      setPlan({ error: 'Failed to generate plan. Sync LeetCode first.' });
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3 ps-card-soft p-4 h-fit">
            <button
              data-testid="mentor-new-chat"
              onClick={newChat}
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <Plus size={14} /> New chat
            </button>
            <div className="mt-6">
              <p className="text-overline flex items-center gap-2">
                <History size={12} /> History
              </p>
              <div className="mt-3 space-y-1 max-h-[40vh] overflow-y-auto">
                {sessions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No previous conversations.</p>
                )}
                {sessions.map((s) => (
                  <button
                    data-testid={`session-${s.session_id}`}
                    key={s.session_id}
                    onClick={() => openSession(s.session_id)}
                    className={`w-full text-left p-2 rounded text-sm ${
                      sessionId === s.session_id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="truncate">{s.preview || 'Conversation'}</div>
                    <div className="text-[10px] font-mono-display text-muted-foreground">
                      {new Date(s.ts).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 border-t border-border pt-5">
              <p className="text-overline">Weakness Engine</p>
              <button
                data-testid="generate-plan"
                onClick={handleGeneratePlan}
                disabled={generatePlan.isPending}
                className="btn-primary mt-3 w-full flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> {generatePlan.isPending ? 'Analyzing...' : 'Generate weekly plan'}
              </button>
            </div>
          </aside>

          {/* Main chat area */}
          <div className="lg:col-span-9 grid grid-rows-[auto_1fr_auto] gap-4 min-h-[70vh]">
            <div>
              <p className="text-overline">M3 - AI Mentor</p>
              <h1 className="font-heading text-3xl mt-1 text-foreground">Your Claude-powered coach.</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Context-aware. Knows your LeetCode profile. Provides personalized guidance.
              </p>
            </div>

            {/* Plan card */}
            {plan && (
              <div data-testid="plan-card" className="ps-card">
                {plan.error ? (
                  <p className="text-destructive text-sm">{plan.error}</p>
                ) : (
                  <>
                    <p className="text-overline">Weekly Focus Plan</p>
                    <MD text={plan.plan || ''} />
                    {plan.weak_tags && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Weakest tags: {plan.weak_tags.map((t) => `${t.tag}(${t.solved})`).join(' - ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="ps-card p-6 overflow-y-auto" style={{ maxHeight: '50vh' }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                  <p className="font-heading text-2xl text-foreground">Ask anything.</p>
                  <p className="text-sm mt-2">
                    Try: "What's my weakest topic?" - "Plan tomorrow for me" - "Explain DP optimization in 5 lines"
                  </p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`mb-5 ${m.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={m.role === 'user' ? 'px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%] bg-muted' : 'max-w-[88%]'}
                    >
                      {m.role === 'assistant' ? <MD text={m.content} /> : <p className="text-sm">{m.content}</p>}
                    </div>
                  </div>
                ))
              )}
              {sendChatMessage.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-3"
            >
              <input
                data-testid="mentor-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor..."
                className="input-field flex-1"
              />
              <button
                data-testid="mentor-send"
                disabled={sendChatMessage.isPending || !input.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Send size={14} /> {sendChatMessage.isPending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
