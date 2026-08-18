import { useState, useRef } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useKbDocs, useUploadKbDoc, useDeleteKbDoc, useAskKb } from '../../features/knowledge/hooks/useKnowledge';
import { Upload, FileText, Trash2, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function MD({ text }) {
  const html = (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(\d+)\]/g, '<sup class="font-mono text-primary">[$1]</sup>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function KnowledgePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const inputRef = useRef(null);

  const { data: docs = [] } = useKbDocs();
  const uploadKbDoc = useUploadKbDoc();
  const deleteKbDoc = useDeleteKbDoc();
  const askKb = useAskKb();

  const upload = async (file) => {
    if (!file) return;
    setUploadMsg(`Uploading ${file.name}...`);
    try {
      await uploadKbDoc.mutateAsync(file);
      setUploadMsg('Indexed successfully!');
      setTimeout(() => setUploadMsg(''), 2000);
    } catch (e) {
      setUploadMsg('Upload failed');
    }
  };

  const remove = async (id) => {
    try {
      await deleteKbDoc.mutateAsync(id);
      toast.success('Document deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const ask = async () => {
    if (!question.trim() || askKb.isPending) return;
    try {
      const result = await askKb.mutateAsync(question);
      setAnswer(result);
    } catch (e) {
      setAnswer({ error: 'Failed to get answer' });
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <p className="text-overline">M8 - Private Knowledge</p>
            <h1 className="font-heading text-3xl mt-1 text-foreground">Your notes. Cited answers.</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Upload PDF, DOCX, TXT, or MD. AI answers only from your material - with citations.
            </p>

            <label
              data-testid="upload-zone"
              className="block mt-6 p-6 border-2 border-dashed rounded-md text-center cursor-pointer hover:bg-muted/50 transition"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => e.target.files && e.target.files[0] && upload(e.target.files[0])}
                disabled={uploadKbDoc.isPending}
              />
              <Upload className="mx-auto text-muted-foreground" size={20} />
              <p className="mt-3 text-sm text-foreground">Drop a file or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF - DOCX - TXT - MD - max 8MB</p>
            </label>
            {uploadMsg && (
              <p data-testid="upload-msg" className="text-xs mt-3 font-mono-display text-muted-foreground">
                {uploadMsg}
              </p>
            )}

            <div className="mt-8">
              <p className="text-overline">Indexed documents</p>
              <div className="mt-3 space-y-2">
                {docs.length === 0 && (
                  <p className="text-xs text-muted-foreground">No documents yet.</p>
                )}
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className="ps-card-soft p-3 flex items-center justify-between gap-3"
                    data-testid={`doc-${d.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-sm truncate text-foreground">{d.title}</div>
                        <div className="text-[10px] font-mono-display text-muted-foreground">
                          {d.n_chunks || 0} chunks - {((d.size || 0) / 1024).toFixed(0)}KB
                        </div>
                      </div>
                    </div>
                    <button
                      data-testid={`delete-${d.id}`}
                      onClick={() => remove(d.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main area */}
          <div className="lg:col-span-8">
            <div className="ps-card p-6">
              <p className="text-overline">Ask your library</p>
              <div className="mt-4 flex gap-3">
                <input
                  data-testid="rag-question"
                  className="input-field flex-1"
                  placeholder="e.g. Summarize key algorithms from chapter 3"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') ask();
                  }}
                />
                <button
                  data-testid="rag-ask"
                  disabled={askKb.isPending}
                  onClick={ask}
                  className="btn-primary flex items-center gap-2"
                >
                  {askKb.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{' '}
                  {askKb.isPending ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </div>

            {answer && (
              <div className="ps-card p-6 mt-4" data-testid="rag-answer">
                {answer.error ? (
                  <p className="text-destructive">{answer.error}</p>
                ) : (
                  <>
                    <p className="text-overline">Answer</p>
                    <div className="mt-3 leading-relaxed">
                      <MD text={answer.answer || ''} />
                    </div>
                    {answer.citations && answer.citations.length > 0 && (
                      <div className="mt-6 border-t border-border pt-4">
                        <p className="text-overline">Sources</p>
                        <ol className="mt-2 text-sm text-muted-foreground space-y-1">
                          {answer.citations.map((c) => (
                            <li key={c.n}>
                              <span className="font-mono text-primary">[{c.n}]</span> {c.title} - chunk {c.chunk}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
