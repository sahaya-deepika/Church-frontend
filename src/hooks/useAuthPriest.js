import { apiGet } from "@/services/axios";
import { createContext, useContext, useEffect, useState } from "react";

const AuthPriestContext = createContext();

export function AuthPriestProvider({children}) {
  const [loggedInPriest, setLoggedInPriest] = useState(null);
  useEffect(() => {
    fetchLoggedInPriest();
  },[]);

  const fetchLoggedInPriest = async  () => {
    try {
      const res = await apiGet("/auth/priest/me");
      if(res?.status === "success") {
        setLoggedInPriest(res?.data);
      }
    } catch(err) {
      console.log(err);
      // do nothing
    }
  }

  return (
    <AuthPriestContext.Provider value={{loggedInPriest, setLoggedInPriest}}>
      {children}
    </AuthPriestContext.Provider>
  );
}

export const useAuthPriest = () => {
  return useContext(AuthPriestContext);
}

