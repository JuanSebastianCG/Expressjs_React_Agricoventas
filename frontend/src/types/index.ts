export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
