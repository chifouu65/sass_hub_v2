export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}
