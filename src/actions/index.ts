import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  LanguageProfiles,
  VocabularyItems,
  PracticeSessions,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createLanguageProfile: defineAction({
    input: z.object({
      targetLanguage: z.string().min(1),
      nativeLanguage: z.string().optional(),
      proficiencyLevel: z.string().optional(),
      goals: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();
      const id = crypto.randomUUID();

      await db.insert(LanguageProfiles).values({
        id,
        userId: user.id,
        targetLanguage: input.targetLanguage,
        nativeLanguage: input.nativeLanguage,
        proficiencyLevel: input.proficiencyLevel,
        goals: input.goals,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        data: {
          profile: {
            id,
            userId: user.id,
            targetLanguage: input.targetLanguage,
            nativeLanguage: input.nativeLanguage,
            proficiencyLevel: input.proficiencyLevel,
            goals: input.goals,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        },
      };
    },
  }),

  updateLanguageProfile: defineAction({
    input: z.object({
      id: z.string().min(1),
      targetLanguage: z.string().optional(),
      nativeLanguage: z.string().optional(),
      proficiencyLevel: z.string().optional(),
      goals: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [existing] = await db
        .select()
        .from(LanguageProfiles)
        .where(
          and(eq(LanguageProfiles.id, input.id), eq(LanguageProfiles.userId, user.id))
        );

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Language profile not found.",
        });
      }

      const updatedAt = new Date();

      await db
        .update(LanguageProfiles)
        .set({
          targetLanguage: input.targetLanguage ?? existing.targetLanguage,
          nativeLanguage: input.nativeLanguage ?? existing.nativeLanguage,
          proficiencyLevel: input.proficiencyLevel ?? existing.proficiencyLevel,
          goals: input.goals ?? existing.goals,
          isActive: input.isActive ?? existing.isActive,
          updatedAt,
        })
        .where(
          and(eq(LanguageProfiles.id, input.id), eq(LanguageProfiles.userId, user.id))
        );

      return {
        success: true,
        data: {
          profile: {
            ...existing,
            ...input,
            targetLanguage: input.targetLanguage ?? existing.targetLanguage,
            nativeLanguage: input.nativeLanguage ?? existing.nativeLanguage,
            proficiencyLevel: input.proficiencyLevel ?? existing.proficiencyLevel,
            goals: input.goals ?? existing.goals,
            isActive: input.isActive ?? existing.isActive,
            updatedAt,
          },
        },
      };
    },
  }),

  listMyLanguageProfiles: defineAction({
    input: z.object({
      includeInactive: z.boolean().default(false),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const profiles = await db
        .select()
        .from(LanguageProfiles)
        .where(
          input.includeInactive
            ? eq(LanguageProfiles.userId, user.id)
            : and(eq(LanguageProfiles.userId, user.id), eq(LanguageProfiles.isActive, true))
        );

      return {
        success: true,
        data: {
          items: profiles,
          total: profiles.length,
        },
      };
    },
  }),

  upsertVocabularyItem: defineAction({
    input: z.object({
      id: z.string().optional(),
      languageProfileId: z.string().min(1),
      term: z.string().min(1),
      translation: z.string().optional(),
      partOfSpeech: z.string().optional(),
      exampleSentence: z.string().optional(),
      exampleTranslation: z.string().optional(),
      difficulty: z.string().optional(),
      tags: z.string().optional(),
      lastReviewedAt: z.date().optional(),
      nextReviewAt: z.date().optional(),
      successStreak: z.number().int().optional(),
      totalReviews: z.number().int().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [profile] = await db
        .select()
        .from(LanguageProfiles)
        .where(
          and(
            eq(LanguageProfiles.id, input.languageProfileId),
            eq(LanguageProfiles.userId, user.id)
          )
        );

      if (!profile) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Language profile not found.",
        });
      }

      const now = new Date();

      if (input.id) {
        const [existing] = await db
          .select()
          .from(VocabularyItems)
          .where(
            and(
              eq(VocabularyItems.id, input.id),
              eq(VocabularyItems.userId, user.id)
            )
          );

        if (!existing) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Vocabulary item not found.",
          });
        }

        await db
          .update(VocabularyItems)
          .set({
            languageProfileId: input.languageProfileId,
            term: input.term,
            translation: input.translation,
            partOfSpeech: input.partOfSpeech,
            exampleSentence: input.exampleSentence,
            exampleTranslation: input.exampleTranslation,
            difficulty: input.difficulty,
            tags: input.tags,
            lastReviewedAt: input.lastReviewedAt,
            nextReviewAt: input.nextReviewAt,
            successStreak: input.successStreak,
            totalReviews: input.totalReviews,
            updatedAt: now,
          })
          .where(
            and(
              eq(VocabularyItems.id, input.id),
              eq(VocabularyItems.userId, user.id)
            )
          );

        return {
          success: true,
          data: {
            item: {
              ...existing,
              ...input,
              updatedAt: now,
              userId: user.id,
            },
          },
        };
      }

      const id = crypto.randomUUID();

      await db.insert(VocabularyItems).values({
        id,
        languageProfileId: input.languageProfileId,
        userId: user.id,
        term: input.term,
        translation: input.translation,
        partOfSpeech: input.partOfSpeech,
        exampleSentence: input.exampleSentence,
        exampleTranslation: input.exampleTranslation,
        difficulty: input.difficulty,
        tags: input.tags,
        lastReviewedAt: input.lastReviewedAt,
        nextReviewAt: input.nextReviewAt,
        successStreak: input.successStreak,
        totalReviews: input.totalReviews,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        data: {
          item: {
            id,
            languageProfileId: input.languageProfileId,
            userId: user.id,
            term: input.term,
            translation: input.translation,
            partOfSpeech: input.partOfSpeech,
            exampleSentence: input.exampleSentence,
            exampleTranslation: input.exampleTranslation,
            difficulty: input.difficulty,
            tags: input.tags,
            lastReviewedAt: input.lastReviewedAt,
            nextReviewAt: input.nextReviewAt,
            successStreak: input.successStreak,
            totalReviews: input.totalReviews,
            createdAt: now,
            updatedAt: now,
          },
        },
      };
    },
  }),

  deleteVocabularyItem: defineAction({
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const result = await db
        .delete(VocabularyItems)
        .where(
          and(
            eq(VocabularyItems.id, input.id),
            eq(VocabularyItems.userId, user.id)
          )
        );

      if (result.rowsAffected === 0) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Vocabulary item not found.",
        });
      }

      return {
        success: true,
      };
    },
  }),

  listVocabularyItems: defineAction({
    input: z.object({
      languageProfileId: z.string().min(1),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const offset = (input.page - 1) * input.pageSize;

      const items = await db
        .select()
        .from(VocabularyItems)
        .where(
          and(
            eq(VocabularyItems.languageProfileId, input.languageProfileId),
            eq(VocabularyItems.userId, user.id)
          )
        )
        .limit(input.pageSize)
        .offset(offset);

      return {
        success: true,
        data: {
          items,
          total: items.length,
          page: input.page,
          pageSize: input.pageSize,
        },
      };
    },
  }),

  startPracticeSession: defineAction({
    input: z.object({
      languageProfileId: z.string().min(1),
      mode: z.string().optional(),
      totalQuestions: z.number().int().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [profile] = await db
        .select()
        .from(LanguageProfiles)
        .where(
          and(
            eq(LanguageProfiles.id, input.languageProfileId),
            eq(LanguageProfiles.userId, user.id)
          )
        );

      if (!profile) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Language profile not found.",
        });
      }

      const id = crypto.randomUUID();
      const startedAt = new Date();

      await db.insert(PracticeSessions).values({
        id,
        languageProfileId: input.languageProfileId,
        userId: user.id,
        mode: input.mode,
        startedAt,
        endedAt: null,
        totalQuestions: input.totalQuestions,
        correctAnswers: null,
        notes: input.notes,
        createdAt: startedAt,
      });

      return {
        success: true,
        data: {
          session: {
            id,
            languageProfileId: input.languageProfileId,
            userId: user.id,
            mode: input.mode,
            startedAt,
            endedAt: null,
            totalQuestions: input.totalQuestions,
            correctAnswers: null,
            notes: input.notes,
            createdAt: startedAt,
          },
        },
      };
    },
  }),

  completePracticeSession: defineAction({
    input: z.object({
      id: z.string().min(1),
      totalQuestions: z.number().int().optional(),
      correctAnswers: z.number().int().optional(),
      notes: z.string().optional(),
      endedAt: z.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [session] = await db
        .select()
        .from(PracticeSessions)
        .where(
          and(
            eq(PracticeSessions.id, input.id),
            eq(PracticeSessions.userId, user.id)
          )
        );

      if (!session) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Practice session not found.",
        });
      }

      const endedAt = input.endedAt ?? new Date();

      await db
        .update(PracticeSessions)
        .set({
          totalQuestions: input.totalQuestions ?? session.totalQuestions,
          correctAnswers: input.correctAnswers ?? session.correctAnswers,
          notes: input.notes ?? session.notes,
          endedAt,
        })
        .where(
          and(
            eq(PracticeSessions.id, input.id),
            eq(PracticeSessions.userId, user.id)
          )
        );

      return {
        success: true,
        data: {
          session: {
            ...session,
            totalQuestions: input.totalQuestions ?? session.totalQuestions,
            correctAnswers: input.correctAnswers ?? session.correctAnswers,
            notes: input.notes ?? session.notes,
            endedAt,
          },
        },
      };
    },
  }),

  listPracticeSessions: defineAction({
    input: z.object({
      languageProfileId: z.string().min(1),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const offset = (input.page - 1) * input.pageSize;

      const sessions = await db
        .select()
        .from(PracticeSessions)
        .where(
          and(
            eq(PracticeSessions.languageProfileId, input.languageProfileId),
            eq(PracticeSessions.userId, user.id)
          )
        )
        .limit(input.pageSize)
        .offset(offset);

      return {
        success: true,
        data: {
          items: sessions,
          total: sessions.length,
          page: input.page,
          pageSize: input.pageSize,
        },
      };
    },
  }),
};
