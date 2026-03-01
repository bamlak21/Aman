export type UserLogin = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  success: string;
  user: User;
  accessToken: string;
  message?: string;
};

export type RegResponse = {
  success: string;
  user: User;
  accessToken: string;
};

export type RegUser = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type AuthStore = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
};
