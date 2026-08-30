import React, { useState, useMemo } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useFlashcards, useDeleteFlashcard } from '../../features/flashcards/hooks/useFlashcards';
import { useGenerateFlashcards } from '../../features/flashcards/hooks/useGenerateFlashcards';
import { useKbDocs } from '../../features/knowledge/hooks/useKnowledge';
import FlashcardDeck from '../../features/flashcards/components/FlashcardDeck';
import GenerateFlashcardsModal from '../../features/flashcards/components/GenerateFlashcardsModal';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Sparkles,
  Layers,
  BookOpen,
  Filter,
  Search,
  Trash2,
  HelpCircle,
  CheckCircle2,
  FileText,
  Loader2,
  LayoutGrid,
  Play,
  RotateCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function FlashCardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDocParam = searchParams.get('documentId') || '';

  const [selectedDocId, setSelectedDocId] = useState(initialDocParam);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('study'); // 'study' | 'browse'
  const [searchQuery, setSearchQuery] = useState('');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [modalInitialDocId, setModalInitialDocId] = useState(null);

  const { data: docs = [], isLoading: docsLoading } = useKbDocs();
  const {
    data: flashcards = [],
    isLoading: loadingCards,
    refetch,
  } = useFlashcards(
    selectedDocId || undefined,
    selectedDifficulty !== 'all' ? selectedDifficulty : undefined
  );
  const deleteMutation = useDeleteFlashcard();
  const generateMutation = useGenerateFlashcards();

  // Filter cards in browse mode by search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return flashcards;
    const q = searchQuery.toLowerCase();
    return flashcards.filter(
      (c) =>
        c.question.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        c.document?.title?.toLowerCase().includes(q)
    );
  }, [flashcards, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = flashcards.length;
    const easy = flashcards.filter((c) => c.difficulty === 'easy').length;
    const medium = flashcards.filter((c) => c.difficulty === 'medium').length;
    const hard = flashcards.filter((c) => c.difficulty === 'hard').length;
    const uniqueDocs = new Set(flashcards.map((c) => c.documentId)).size;
    return { total, easy, medium, hard, uniqueDocs };
  }, [flashcards]);

  const handleOpenGenerate = (docId = null) => {
    setModalInitialDocId(docId || selectedDocId || (docs.length > 0 ? docs[0].id : null));
    setGenerateModalOpen(true);
  };

  const handleQuickGenerate = async (docId = null) => {
    const targetDocId = docId || selectedDocId || (docs.length > 0 ? docs[0].id : null);
    if (!targetDocId) {
      handleOpenGenerate();
      return;
    }

    try {
      await generateMutation.mutateAsync({
        documentId: targetDocId,
        count: 10,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : 'mixed',
      });
      if (selectedDocId && selectedDocId !== targetDocId) {
        setSelectedDocId(targetDocId);
      }
      refetch();
    } catch (err) {
      // Toast notification is handled in mutation hook
    }
  };

  const handleDocFilterChange = (docId) => {
    setSelectedDocId(docId);
    if (docId) {
      setSearchParams({ documentId: docId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background pb-16">
        {/* Header Container */}
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 text-overline text-primary">
                <Zap size={14} className="text-primary fill-primary/20" />
                <span>ACTIVE RECALL DRILLS</span>
              </div>
              <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight text-foreground mt-1">
                Flashcard Decks
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
                Synthesize high-yield study cards directly from your uploaded notes and test your retention with spaced repetition.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleOpenGenerate()}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                data-testid="open-generate-modal"
              >
                <Sparkles size={16} />
                Generate Flashcards
              </Button>
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="ps-card p-4">
              <div className="text-overline">Total Flashcards</div>
              <div className="font-heading text-2xl font-bold text-foreground mt-1 font-mono-display">
                {stats.total}
              </div>
            </div>
            <div className="ps-card p-4">
              <div className="text-overline">Documents Covered</div>
              <div className="font-heading text-2xl font-bold text-foreground mt-1 font-mono-display">
                {stats.uniqueDocs}
              </div>
            </div>
            <div className="ps-card p-4">
              <div className="text-overline text-emerald-600">Fundamental (Easy)</div>
              <div className="font-heading text-2xl font-bold text-emerald-600 mt-1 font-mono-display">
                {stats.easy}
              </div>
            </div>
            <div className="ps-card p-4">
              <div className="text-overline text-rose-500">Complex (Hard)</div>
              <div className="font-heading text-2xl font-bold text-rose-500 mt-1 font-mono-display">
                {stats.hard}
              </div>
            </div>
          </div>

          {/* Controls Bar: Filters + View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-3 mb-8">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Document Filter */}
              <div className="flex items-center gap-1.5 min-w-[180px]">
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <select
                  value={selectedDocId}
                  onChange={(e) => handleDocFilterChange(e.target.value)}
                  className="bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                >
                  <option value="">All Documents ({docs.length})</option>
                  {docs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-muted-foreground shrink-0" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="hard">Hard Only</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('study')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'study'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Play size={13} />
                Study Mode
              </button>
              <button
                type="button"
                onClick={() => setViewMode('browse')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'browse'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid size={13} />
                Browse All ({flashcards.length})
              </button>
            </div>
          </div>

          {/* Inline Generating State Indicator */}
          {generateMutation.isPending && (
            <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Synthesizing AI Flashcards with Gemini...
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Analyzing document context chunks and creating active recall drills.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          {loadingCards ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground font-mono-display text-xs gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span>Loading flashcard deck...</span>
            </div>
          ) : flashcards.length === 0 ? (
            <div className="max-w-xl mx-auto my-12 p-8 text-center bg-card border border-border rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {selectedDocId ? 'No flashcards for this document' : 'No flashcards generated yet'}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                {docs.length === 0
                  ? 'Upload study notes in your Knowledge Library first, then generate flashcards with Gemini.'
                  : 'Generate your first deck of AI flashcards from your uploaded documents.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                {docs.length === 0 ? (
                  <Button asChild>
                    <a href="/knowledge" className="gap-2">
                      <BookOpen size={15} /> Upload Documents
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleQuickGenerate(selectedDocId)}
                      disabled={generateMutation.isPending}
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap size={15} />
                          Generate Deck
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenGenerate(selectedDocId)}
                      disabled={generateMutation.isPending}
                      className="gap-2"
                    >
                      <SlidersHorizontal size={15} /> Options & Count
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : viewMode === 'study' ? (
            /* Study Deck Mode */
            <FlashcardDeck
              cards={flashcards}
              onGenerateMore={() => handleOpenGenerate(selectedDocId)}
            />
          ) : (
            /* Browse All Library Mode */
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions, answers, or documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 h-9 text-xs"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                {filteredCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-overline font-semibold text-primary">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] uppercase font-mono-display px-2 py-0.5 rounded-full border ${
                              card.difficulty === 'easy'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                : card.difficulty === 'hard'
                                ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                            }`}
                          >
                            {card.difficulty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this flashcard?')) {
                                deleteMutation.mutate(card.id);
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                            title="Delete card"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-heading text-base font-semibold text-foreground mb-2">
                        {card.question}
                      </h4>

                      <div className="p-3 bg-muted/40 rounded-lg text-xs leading-relaxed text-muted-foreground mt-3 border border-border/50">
                        <span className="font-semibold text-foreground mr-1.5">Answer:</span>
                        {card.answer}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-4 mt-3 border-t border-border/40 font-mono-display">
                      <span className="truncate max-w-[200px]">
                        {card.document?.title || 'Document'}
                      </span>
                      {card.sourceChunk !== null && card.sourceChunk !== undefined && (
                        <span>Chunk #{card.sourceChunk}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate Modal */}
        <GenerateFlashcardsModal
          open={generateModalOpen}
          onOpenChange={setGenerateModalOpen}
          initialDocumentId={modalInitialDocId}
          onSuccess={() => {
            refetch();
          }}
        />
      </main>
    </ProtectedRoute>
  );
}
