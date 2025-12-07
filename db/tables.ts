/**
 * Language Learning Buddy - practice vocabulary, phrases, and sessions.
 *
 * Design goals:
 * - Support multiple target languages per user.
 * - Maintain vocab items with progress (SRS-friendly later).
 * - Session logs (practice sessions) for history and stats.
 */

import { defineTable, column, NOW } from "astro:db";

export const LanguageProfiles = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    targetLanguage: column.text(),                   // "en", "ta", "es", etc.
    nativeLanguage: column.text({ optional: true }), // "ta", "en", etc.

    proficiencyLevel: column.text({ optional: true }), // "beginner", "intermediate", "advanced"
    goals: column.text({ optional: true }),          // "travel", "exam", "business"

    isActive: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const VocabularyItems = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    languageProfileId: column.text({
      references: () => LanguageProfiles.columns.id,
    }),
    userId: column.text(),

    term: column.text(),                              // word/phrase in target language
    translation: column.text({ optional: true }),     // translation in native language
    partOfSpeech: column.text({ optional: true }),    // "noun", "verb", etc.
    exampleSentence: column.text({ optional: true }),
    exampleTranslation: column.text({ optional: true }),

    difficulty: column.text({ optional: true }),      // "easy", "medium", "hard"
    tags: column.text({ optional: true }),            // "food", "travel", etc.

    // simple spaced repetition fields (can expand later)
    lastReviewedAt: column.date({ optional: true }),
    nextReviewAt: column.date({ optional: true }),
    successStreak: column.number({ optional: true }), // consecutive correct answers
    totalReviews: column.number({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const PracticeSessions = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    languageProfileId: column.text({
      references: () => LanguageProfiles.columns.id,
    }),
    userId: column.text(),

    mode: column.text({ optional: true }),            // "flashcards", "quiz", "conversation"
    startedAt: column.date({ default: NOW }),
    endedAt: column.date({ optional: true }),

    totalQuestions: column.number({ optional: true }),
    correctAnswers: column.number({ optional: true }),
    notes: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  LanguageProfiles,
  VocabularyItems,
  PracticeSessions,
} as const;
