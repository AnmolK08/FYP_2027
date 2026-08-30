import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKbDocs } from '../../knowledge/hooks/useKnowledge';
import { useGenerateFlashcards } from '../hooks/useGenerateFlashcards';
import { Sparkles, FileText, Loader2, BookOpen, Layers, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const COUNT_OPTIONS = [5, 10, 15, 20];
const DIFFICULTY_OPTIONS = [
  { value: 'mixed', label: 'Mixed (Balanced)' },
  { value: 'easy', label: 'Easy (Core definitions)' },
  { value: 'medium', label: 'Medium (Mechanics & Concepts)' },
  { value: 'hard', label: 'Hard (Edge cases & Deep Dive)' },
];

export default function GenerateFlashcardsModal({
  open,
  onOpenChange,
  initialDocumentId = null,
  onSuccess,
}) {
  const { data: docs = [], isLoading: docsLoading } = useKbDocs();
  const generateMutation = useGenerateFlashcards();

  const [documentId, setDocumentId] = useState(initialDocumentId || '');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [generationStep, setGenerationStep] = useState(0);

  // Sync documentId whenever the modal opens or docs list updates
  useEffect(() => {
    if (open && docs.length > 0) {
      if (initialDocumentId && docs.some((d) => d.id === initialDocumentId)) {
        setDocumentId(initialDocumentId);
      } else if (!documentId || !docs.some((d) => d.id === documentId)) {
        setDocumentId(docs[0].id);
      }
    }
  }, [open, initialDocumentId, docs]);

  // Loading animation simulation for educational polish
  useEffect(() => {
    let timer;
    if (generateMutation.isPending) {
      setGenerationStep(0);
      timer = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1800);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(timer);
  }, [generateMutation.isPending]);

  const handleGenerate = async () => {
    const targetDocId = documentId || (initialDocumentId && docs.some((d) => d.id === initialDocumentId) ? initialDocumentId : (docs.length > 0 ? docs[0].id : null));
    
    if (!targetDocId) {
      toast.error('Please select a valid document to generate flashcards.');
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        documentId: targetDocId,
        count,
        difficulty,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled in useGenerateFlashcards toast
    }
  };

  const effectiveDocId = documentId || (docs.length > 0 ? docs[0].id : '');
  const selectedDoc = docs.find((d) => d.id === effectiveDocId);

  const stepLabels = [
    'Preparing document context...',
    'Analyzing semantic chunks & relations...',
    'Extracting high-yield concepts & formulas...',
    'Generating structured flashcards via Gemini AI...',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <span>AI Flashcard Generator</span>
          </div>
          <DialogTitle className="font-heading text-xl md:text-2xl">
            Generate Flashcards from Notes
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Gemini reads your uploaded document and synthesizes precise active-recall flashcards.
          </DialogDescription>
        </DialogHeader>

        {docsLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground font-mono-display text-xs gap-2">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span>Loading your knowledge library...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-6 text-center">
            <div className="p-3 bg-muted/50 rounded-full inline-flex text-muted-foreground mb-3">
              <BookOpen size={24} />
            </div>
            <h4 className="font-heading font-medium text-foreground">No documents uploaded yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              You need to upload at least one PDF, DOCX, TXT, or MD note before generating cards.
            </p>
            <Link to="/knowledge" onClick={() => onOpenChange(false)}>
              <Button className="mt-4 gap-2" size="sm">
                <BookOpen size={14} /> Go to Knowledge Library
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Document Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Source Document
              </label>
              <select
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={effectiveDocId}
                onChange={(e) => setDocumentId(e.target.value)}
                disabled={generateMutation.isPending}
              >
                {docs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.nChunks ?? doc.n_chunks ?? 0} chunks)
                  </option>
                ))}
              </select>

              {selectedDoc && (
                <div className="text-[11px] font-mono-display text-muted-foreground flex items-center gap-2 pt-0.5">
                  <FileText size={12} className="text-primary" />
                  <span>
                    {((selectedDoc.size || 0) / 1024).toFixed(0)} KB ·{' '}
                    {selectedDoc.nChunks ?? selectedDoc.n_chunks ?? 0} indexed chunks
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Number of Cards
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COUNT_OPTIONS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={generateMutation.isPending}
                    onClick={() => setCount(num)}
                    className={`py-2 text-xs font-medium rounded-md border transition-all ${
                      count === num
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    {num} Cards
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Target Difficulty
              </label>
              <select
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={generateMutation.isPending}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading / Generating Indicator */}
            {generateMutation.isPending && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span>{stepLabels[generationStep]}</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${Math.min(95, (generationStep + 1) * 25)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          {docs.length > 0 && (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!effectiveDocId || generateMutation.isPending}
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
                  Generate {count} Cards
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
