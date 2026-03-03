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
