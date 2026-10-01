import { create } from 'zustand';

type SessionState = {
  isAuthed: boolean;
  userName: string;
  signIn: (userName: string) => void;
  signOut: () => void;
};

// Dummy session. Replaced by the real token/permission store when the API is wired in.
export const useSession = create<SessionState>((set) => ({
  isAuthed: false,
  userName: 'Admin',
  signIn: (userName) => set({ isAuthed: true, userName }),
  signOut: () => set({ isAuthed: false }),
}));
