import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
	id: string;
	profile_picture: string | null;
	username: string;
}

interface AuthState {
	activeJobId: string | null;
	logout: () => void;
	setActiveJobId: (id: string | null) => void;
	setAuth: (user: User, token: string) => void;
	token: string | null;
	user: User | null;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			activeJobId: null,
			setAuth: (user, token) => set({ user, token }),
			logout: () => set({ user: null, token: null }),
			setActiveJobId: (id) => set({ activeJobId: id }),
		}),
		{
			name: "auth-storage", // name of the item in the storage (must be unique)
		}
	)
);
