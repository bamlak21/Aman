import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Navigate, Outlet } from "react-router-dom";
import { user } from "../api/user.api";

const Protected = () => {
  // const [isLoading, setIsLoading] = useState(true);
  const { user: u, login, token } = useAuthStore();
  const isLoading = !!token && !u?.id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await user.me(token ?? "");
        login(data, token ?? "");
      } catch (error) {
        console.log(error);
      }
    };

    if (token && !u?.id) {
      fetchUser();
    }
  }, [u, token, login]);

  if (isLoading) return <div className="loader"></div>;
  if (!token) return <Navigate to="/sign-in" />;
  return <Outlet />;
};

export default Protected;
