import React from 'react';
import { Eye, RotateCw, Trash2, FileText, CheckCircle2, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  hard: {
    label: 'Hard',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
};

export default function Flashcard({
  card,
  isFlipped,
  onFlip,
  onRate,
  onDelete,
  currentIndex = 0,
  totalCards = 1,
}) {
  if (!card) return null;

  const diff = DIFFICULTY_CONFIG[card.difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.medium;
  const docTitle = card.document?.title || card.document?.filename || 'Document';

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      {/* 3D Perspective Container */}
      <div
        className="relative min-h-[380px] md:min-h-[420px] w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]"
        onClick={onFlip}
        data-testid="flashcard-interactive"
      >
        {/* Card Frame */}
        <div
          className={`w-full h-full min-h-[380px] md:min-h-[420px] rounded-xl border bg-card/95 backdrop-blur-sm p-6 md:p-8 flex flex-col justify-between shadow-lg transition-all duration-300 ${
            isFlipped
              ? 'border-primary/40 shadow-primary/5 ring-1 ring-primary/20'
              : 'border-border hover:border-primary/30 hover:shadow-xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-overline font-semibold text-primary">
                Card {currentIndex + 1} of {totalCards}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${diff.badgeClass}`}
              >
                {diff.label}
              </span>
              {card.sourceChunk !== null && card.sourceChunk !== undefined && (
                <span className="text-[10px] font-mono-display text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Chunk #{card.sourceChunk}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this flashcard?')) {
                      onDelete(card.id);
                    }
                  }}
                  title="Delete Flashcard"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono-display ml-1">
                <RotateCw size={12} className="animate-pulse" />
                <span>Flip</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 text-center px-2">
            {!isFlipped ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                  <HelpCircle size={14} className="text-primary" />
                  <span>QUESTION</span>
                </div>
                <h3 className="font-heading text-xl md:text-2xl text-foreground font-semibold leading-relaxed tracking-tight max-w-xl">
                  {card.question}
                </h3>
              </div>
            ) : (
              <div className="space-y-4 text-left w-full animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    <CheckCircle2 size={14} />
                    <span>ANSWER</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[200px] flex items-center gap-1">
                    <FileText size={12} />
                    <span>{docTitle}</span>
                  </div>
                </div>
                <div className="text-base md:text-lg leading-relaxed text-foreground/90 font-normal whitespace-pre-line py-1">
                  {card.answer}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Area */}
          <div className="pt-4 border-t border-border/60">
            {!isFlipped ? (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 truncate max-w-[280px]">
                  <FileText size={13} className="shrink-0 text-primary" />
                  <span className="truncate">{docTitle}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlip();
                  }}
                  className="gap-2 text-primary font-medium hover:bg-primary/10"
                  data-testid="reveal-btn"
                >
                  <Eye size={14} />
                  Reveal Answer
                  <kbd className="hidden sm:inline-block text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">
                    Space
                  </kbd>
                </Button>
              </div>
            ) : (
              <div
                className="space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] text-muted-foreground text-center font-mono-display uppercase tracking-wider">
                  How well did you know this?
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRate('again')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors"
                  >
                    <span className="font-semibold">Again</span>
                    <span className="text-[10px] opacity-70 font-mono-display">1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRate('hard')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors"
                  >
                    <span className="font-semibold">Hard</span>
                    <span className="text-[10px] opacity-70 font-mono-display">2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRate('good')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                  >
                    <span className="font-semibold">Good</span>
                    <span className="text-[10px] opacity-70 font-mono-display">3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRate('easy')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium transition-colors"
                  >
                    <span className="font-semibold">Easy</span>
                    <span className="text-[10px] opacity-70 font-mono-display">4</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
