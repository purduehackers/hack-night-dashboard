import { get } from "@vercel/edge-config";

/**
 * Default values for all possible configuration keys
 */
const defaults = {
    title: "Hack Night Dashboard",
    version: "v0.00",
    maintainer: "an Organizer",
    description: "A dashboard for Hack Night, Purdue Hackers' weekly meet-up",
} as const satisfies Readonly<Record<string, string>>;

export type ConfigKey = keyof typeof defaults;

/**
 * Gets the value of the given configuration key.
 * @param key the key to resolve
 * @returns the resolved value from Vercel Edge Config, or the default if not configured
 */
export async function getConfig(key: ConfigKey): Promise<string> {
    return (await get(key)) ?? defaults[key];
}

/**
 * Gets the values of several configuration keys.
 * @see {@link getConfig}
 * @param keys the keys to look up
 * @returns an object mapping the given keys to their resolved values
 */
export async function getConfigs<const K extends readonly ConfigKey[]>(
    ...keys: K
): Promise<{ [P in K[number]]: string }> {
    const entries = await Promise.all(
        keys.map(async (key) => [key, await getConfig(key)]),
    );
    return Object.fromEntries(entries);
}
