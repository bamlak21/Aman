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
  token: string;
};

export type RegUser = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type AuthStore = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};
