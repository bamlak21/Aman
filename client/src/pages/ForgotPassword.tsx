import axios from "axios";
import {  KeyRoundIcon } from "lucide-react";
import {  useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { auth } from "../api/auth.api";
import type { userEmail } from "../api/user.api";



const ForgetPassword = () => {
  
  const nav = useNavigate();
  const [email, setEmail] = useState<string | undefined>()
  const fetch = async (input:userEmail) => {
    try {
      const data = await auth.fetchByemail(input);
      if (data) {
        nav(`/reset-password?email=${email}`);
      }
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message??error.message)
       console.error(error.message);
      }
     
    }
  };
  
  return (
    <div className="flex justify-center items-center m-20">
      <div className="flex flex-col p-5 w-105 border border-gray-500 rounded-2xl">
        <div className="flex justify-center items-center  ">
          <div className="flex items-center justify-center h-15 w-15 rounded-full p-3 bg-[hsl(var(--accent))] text-white">
            <KeyRoundIcon className="h-5 w-5" />
          </div>
        </div>
        <h1 className="text-3xl text-center font-bold mt-5">Forget Password</h1>
        <p className="text-2sm text-center mt-1">
          Enter your email to receive an OTP
        </p>
        <div className="relative flex flex-col mt-7">
          <form onSubmit={(e) => {
            e.preventDefault()
            fetch({email:email?.trim()??""})
          }}>
            {/* <input
            id="input-email"
            type="email"
            className="peer px-3 py-3 rounded-xl border-black border-2 focus:outline-none placeholder-transparent"
            placeholder="Enter your email"
          />
          <label
            htmlFor="input-email"
            className="absolute left-4 top-2 text-gray-400 px-1 transition-all duration-200 pointer-events-none text-base bg-transparent
               peer-focus:-top-5 peer-focus:left-3 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:block
               peer-placeholder-shown:top-2 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base 
               peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:left-3 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:block"
          >
            email
          </label> */}
            <input
              type="email"
              id="email-input"
              className="peer py-2 px-4 w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900  focus:outline-none  transition-all duration-200 placeholder-transparent focus:placeholder-gray-400"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email||""}
            />

            <label
              htmlFor="email-input"
              className="absolute left-4 top-2 text-gray-700 px-1 transition-all duration-200 pointer-events-none text-base bg-transparent
               peer-focus:-top-5 peer-focus:left-3 peer-focus:text-sm peer-focus:block
               peer-placeholder-shown:top-2 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base 
               peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:left-3 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:block"
            >
              Email
            </label>
            <button type="submit" className="w-full px-3 py-3 p-1 rounded-3xl bg-[hsl(var(--accent))] text-white mt-8">
               Send
          </button>
          </form>
        
        </div>
       
        <div className="flex justify-center mt-5">
          <span className="inline-flex gap-1 text-md">
            Remember your password?
            <a
              className="underline text-[hsl(var(--accent))]"
              onClick={() => nav("/sign-in")}
            >
              Sign in
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
