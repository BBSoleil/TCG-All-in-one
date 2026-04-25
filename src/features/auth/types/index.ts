export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  /** Echoed back to repopulate the form on validation/auth error. Never include passwords. */
  email?: string;
  name?: string;
}
