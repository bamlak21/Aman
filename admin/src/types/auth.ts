export type Admin= {
    id:string,
    name:string,
    email:string,
    role:string,
}
export type LoginResponse={
    success:string,
    message:string,
    admin:Admin,
    accessToken:string
}
export type adminLogin= {
    email:string,
    password:string
}

export type AuthStore= {
  admin:Admin|null,
  token:string|null,
  login: (user:Admin,token:string|null)=> void
  logout:()=> void
}
export type userRegData={
  name:string,
  role:string,
  email:string,
  password:string
}
