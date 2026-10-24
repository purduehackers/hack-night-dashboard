"use client";

import { useUpdateChecker } from "@/hooks/use-update-checker";

export function ConfigRefresh({ hash }: { hash: string }) {
    useUpdateChecker(hash);
    return null;
}
