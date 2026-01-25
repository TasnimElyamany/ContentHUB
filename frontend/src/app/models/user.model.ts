export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  aiCredits: {
    total: number;
    used: number;
    resetDate: Date;
  };
  preferences: {
    theme: 'light' | 'dark';
    editorFont: string;
    defaultTone: string;
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
