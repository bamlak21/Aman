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
};

export type RegUser = {
  name: string;
  email: string;
  password: string;
  role: string;
};
