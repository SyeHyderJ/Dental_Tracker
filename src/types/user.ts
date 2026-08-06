// src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  // add other fields as needed
}

export interface AuthState {
  user: User | null;
  token: string | null;
}