import React, { useState, useEffect, useCallback } from 'react';
import Flashcard from './Flashcard';
import FlashcardProgress from './FlashcardProgress';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Trophy,
  Sparkles,
  CheckCircle,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { useReviewFlashcard, useDeleteFlashcard } from '../hooks/useFlashcards';

export default function FlashcardDeck({
  cards = [],
  onGenerateMore,
}) {
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const reviewMutation = useReviewFlashcard();
  const deleteMutation = useDeleteFlashcard();

  // Sync internal deck when input cards change
  useEffect(() => {
    setDeck(cards);
    setIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [cards]);

  const currentCard = deck[index];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (index < deck.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [index, deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  }, [index]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (rating) => {
      if (!currentCard) return;

      // Track session stats
      setSessionStats((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      // Trigger mutation for future spaced-repetition persistence
      reviewMutation.mutate({ id: currentCard.id, rating });

      // Automatically advance to the next card
      handleNext();
    },
    [currentCard, reviewMutation, handleNext]
  );

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleRestart = () => {
    setIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
  };

  const handleDeleteCard = async (cardId) => {
    await deleteMutation.mutateAsync(cardId);
    const updated = deck.filter((c) => c.id !== cardId);
    setDeck(updated);
    if (index >= updated.length && updated.length > 0) {
      setIndex(updated.length - 1);
    }
    setIsFlipped(false);
  };

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid intercepting input fields or modals
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, isFlipped, handleRate]);

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-card border border-border rounded-xl shadow-sm">
        <HelpCircle className="mx-auto text-muted-foreground mb-4" size={36} />
        <h3 className="font-heading text-lg text-foreground font-semibold">No flashcards found</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
          Generate AI-powered flashcards from your uploaded documents to start drilling.
        </p>
        {onGenerateMore && (
          <Button onClick={onGenerateMore} className="mt-5 gap-2">
            <Sparkles size={15} /> Generate Flashcards
          </Button>
        )}
      </div>
    );
  }

  // Deck Completed Screen
  if (isCompleted) {
    const totalReviewed =
      sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const masteryScore =
      totalReviewed > 0
        ? Math.round(
            ((sessionStats.easy * 1.0 + sessionStats.good * 0.75 + sessionStats.hard * 0.5) /
              totalReviewed) *
              100
          )
        : 100;

    return (
      <div className="max-w-xl mx-auto my-8 p-8 text-center bg-card/90 backdrop-blur-sm border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-300">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
          <Trophy size={32} />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          Deck Complete!
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5">
          Great active recall session. Here is your study breakdown:
        </p>

        {/* Score Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <div className="text-overline">Mastery</div>
            <div className="font-heading text-2xl font-bold text-primary mt-1">
              {masteryScore}%
            </div>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <div className="text-overline">Cards Studied</div>
            <div className="font-heading text-2xl font-bold text-foreground mt-1">
              {deck.length}
            </div>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <div className="text-overline text-emerald-600">Easy / Good</div>
            <div className="font-heading text-2xl font-bold text-emerald-600 mt-1">
              {sessionStats.easy + sessionStats.good}
            </div>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <div className="text-overline text-rose-500">Need Review</div>
            <div className="font-heading text-2xl font-bold text-rose-500 mt-1">
              {sessionStats.again + sessionStats.hard}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button variant="outline" onClick={handleRestart} className="gap-2">
            <RotateCcw size={15} /> Restart Deck
          </Button>
          <Button variant="secondary" onClick={handleShuffle} className="gap-2">
            <Shuffle size={15} /> Shuffle & Practice Again
          </Button>
          {onGenerateMore && (
            <Button onClick={onGenerateMore} className="gap-2">
              <Sparkles size={15} /> Generate More Cards
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Progress Header */}
      <FlashcardProgress
        currentIndex={index}
        totalCards={deck.length}
        sessionStats={sessionStats}
      />

      {/* Active Card */}
      <Flashcard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={handleFlip}
        onRate={handleRate}
        onDelete={handleDeleteCard}
        currentIndex={index}
        totalCards={deck.length}
      />

      {/* Deck Controls */}
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            title="Shuffle Deck"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle size={14} />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRestart}
            title="Reset Deck"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={index === 0}
            className="gap-1.5"
            data-testid="prev-card"
          >
            <ChevronLeft size={16} />
            Prev
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="next-card"
          >
            {index === deck.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
