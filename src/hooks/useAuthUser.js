"use client";
import { apiGet } from "@/services/axios";
import { createContext, useContext, useEffect, useState } from "react";


const AuthUserContext = createContext();

export const AuthUserProvider = ({children}) => {

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchLoggedInUser();
  },[]);

  const fetchLoggedInUser = async () => {
    try {
      const res = await apiGet("/auth/user/me");
      if(res?.status === "success") {
        setUser(res?.data);
      } else {
        throw new Error(res?.message);
      } 

    } catch(err) {
      // toast.error();
      console.log(err);
    }
  }

  return (
    <AuthUserContext.Provider value={{user, setUser}} >
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () => {
  return useContext(AuthUserContext);
}