import { atom } from "jotai";

export const authAtom = atom<{ email: string; role: string } | null>(null);
export const pageAtom = atom<string>("Executive");
export const toastAtom = atom<string | null>(null);
