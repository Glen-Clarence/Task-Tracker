import { createContext, useEffect } from "react";
import useUserStore from "../store/useUserStore";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  picture: string;
  streak: number;
  maxStreak: number;
  // Add other relevant fields as necessary
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { profile, loading, error, setProfile, token } = useUserStore();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getProfile(),
    refetchOnWindowFocus: "always",
    enabled: !!token,
  });

  useEffect(() => {
    if (!isLoading && userProfile) {
      setProfile(userProfile as UserProfile);
    }
  }, [isLoading, userProfile, setProfile]);

  const contextValue = { profile, loading, error };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
