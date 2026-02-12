import { z } from "zod";
import { Session } from "./payload-types";

export type HydratedSession = Session & {
    host: { discordName?: string; avatarHash?: string | null };
};

export const CMSSessionsResponseSchema = z.object({
    // We don't have a Zod schema for sessions but we do have a TypeScript type
    docs: z.array(z.unknown().transform((v) => v as Session)),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
    limit: z.number().positive(),
    nextPage: z.number().nullable(),
    page: z.number().positive(),
    pagingCounter: z.number().positive(),
    prevPage: z.number().nullable(),
    totalDocs: z.number().positive(),
    totalPages: z.number().positive(),
});

export const SessionsAPIResponseSchema = CMSSessionsResponseSchema.extend({
    docs: z.array(z.unknown().transform((v) => v as HydratedSession)),
});
