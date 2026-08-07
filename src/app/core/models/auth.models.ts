  export interface LoginRequest {
      email: string;
      password: string;
  }

  export interface RegisterRequest {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
  }

  export interface AuthResponse {
      token: string;
      email: string;
      expiresAt: string;
  }

  export interface ForgotPasswordRequest {
      email: string;
  }

  export interface ResetPasswordRequest {
      email: string;
      token: string;
      newPassword: string;
  }

  // GET /api/auth/me — isAdmin/isPlus/isActive frescos de la DB (no del JWT, que puede durar
  // hasta 24hs sin revalidarse). Gatea los tabs Watcher/Admin del dashboard.
  export interface UserStatus {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      isAdmin: boolean;
      isPlus: boolean;
      isActive: boolean;
  }