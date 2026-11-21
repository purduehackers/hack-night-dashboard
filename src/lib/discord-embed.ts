import { z } from "zod";

// Discord escapes Markdown punctuation in link previews, including ordinary tweet text.
const text = z
    .string()
    .transform((value) =>
        value.replace(/\\([\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e])/g, "$1"),
    );
const webUrl = z
    .url({ protocol: /^https?$/ })
    .optional()
    .catch(undefined);

const embedMediaSchema = z.object({
    url: webUrl,
    proxy_url: webUrl,
    content_type: z.string().optional(),
    description: text.optional(),
});

const embedNameSchema = z.object({ name: text.optional() });

export const discordEmbedSchema = z.object({
    type: z.string().optional(),
    url: webUrl,
    title: text.optional(),
    description: text.optional(),
    color: z.int().min(0).max(0xffffff).optional(),
    author: embedNameSchema.optional(),
    provider: embedNameSchema.optional(),
    footer: z.object({ text }).optional(),
    fields: z.array(z.object({ name: text, value: text })).optional(),
    image: embedMediaSchema.optional(),
    thumbnail: embedMediaSchema.optional(),
    video: embedMediaSchema.optional(),
});

export type DiscordEmbed = z.infer<typeof discordEmbedSchema>;
