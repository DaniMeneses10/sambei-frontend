  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface RegisterRequest {
    email: string;
    password: string;
    userName: string;
  }

  export interface AuthResponse {
    token: string;
    email: string;
    userName: string;
  }

  export interface ForgotPasswordRequest {
    email: string;
  }

  export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
  }