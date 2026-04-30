import { signal } from "@preact/signals";

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    [key: string]: any;
}

export const userProfile = signal<UserProfile | null>(null);
