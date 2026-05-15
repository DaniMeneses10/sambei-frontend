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