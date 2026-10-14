import { KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  useEffect(() => {
    console.log(email);
  },[])
  const handleSubmit = async () => {
     
    } 
  return (
    <div className="flex justify-center items-center mt-20 ">
      <div className="flex flex-col justify-center p-3 bg-gray-100 w-105 h-65 rounded-xl">
        <div className="flex justify-center items-center gap-1">
          <div className="flex w-8 h-8 rounded-full bg-gray-300 items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
              </div>
              <p className="text-center text-xl">Reset Your Password</p>
              <form onSubmit={handleSubmit} >
                  <label htmlFor="otp" className="uppercase text-md">otp</label>
          <input type="text" id="otp" className="w-full inset-shadow-sm inset-shadow-gray-500 py-2 bg-white rounded-lg placeholder:font-bold text-2xl uppercase border-white text-center "
           
          maxLength={6}/>   
                  <div className="flex justify-center items-center">
                  <button type="submit" className="w-full rounded-lg bg-sky-400 mt-5 p-2">Verify</button>
                  </div>
              </form>
          
      </div>
    </div>
  );
};

export default ResetPassword;
