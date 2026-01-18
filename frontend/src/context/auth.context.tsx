import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
import { Message, UserProfile, AuthUser, User } from "@/types/types";
import { AuthContext } from "@/constants/data";
import { useParams } from "react-router-dom";
import {
  registerRequest,
  loginRequest,
  verifyToken,
  removeToken,
  getAllUsernames,
  profileUser,
  removeAccount,
  updateProfilePicture,
  updateEmail,
  updatePassword,
  getConnectionTime,
  getAllMessages,
  getAllMessagesGame,
} from "@/api/auth";
import { useLanguageStore } from "@/context/store/LanguageStore";
import Cookies from "js-cookie";

export interface AuthContextType {
  signUp: (user: UserProfile) => Promise<boolean>;
  signIn: (user: UserProfile) => Promise<boolean>;
  logout: () => Promise<void>;
  authenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  users: string[];
  fetchUserProfile: (username: string) => Promise<void>;
  fetchAllUsernames: () => Promise<void>;
  handleUpdateProfilePicture: (username: string, file: File) => Promise<void>;
  handleUpdateEmail: (
    username: string,
    password: string,
    newEmail: string,
  ) => Promise<void>;
  handleUpdatePassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
    verifyPassword: string,
  ) => Promise<void>;
  deleteUserAccount: (username: string) => Promise<void>;
  connectionTime: string | null;
  fetchConnectionTime: (username: string) => Promise<void>;
  messages: Message[];
  fetchAllMessages: () => Promise<void>;
  fetchAllMessagesGame: (gameName: string) => Promise<void>;
  error: string | null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [connectionTime, setConnectionTime] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const { username: paramUsername } = useParams();
  const { gameName } = useParams();
  const t = useLanguageStore((state) => state.t);
  const clearError = useCallback(() => setError(null), []);

  const signUp = useCallback(
    async (userData: UserProfile) => {
      try {
        clearError();
        const res = await registerRequest(userData);
        setUser(res.data.user);
        setAuthenticated(false);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Registration error";
        setError(errorMessage);
        throw error;
      }
    },
    [clearError],
  );

  const signIn = useCallback(
    async (userData: UserProfile) => {
      try {
        clearError();
        const res = await loginRequest(userData);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        Cookies.set("token", res.data.token, {
          expires: 7,
          path: "/",
        });

        const authUser: AuthUser = {
          _id: res.data.user._id,
          username: res.data.user.username,
          email: res.data.user.email,
          profile: {
            _id: res.data.user._id,
            fullname: res.data.user.fullname,
            username: res.data.user.username,
            email: res.data.user.email,
            profilePicture: res.data.user.profilePicture,
            gamesPlayed: res.data.user.gamesPlayed,
            gamesWon: res.data.user.gamesWon,
            gamesLost: res.data.user.gamesLost,
            lastSeen: res.data.user.lastSeen,
            isOnline: res.data.user.isOnline,
            connectionStartTime: res.data.user.connectionStartTime,
          },
        };

        setUser(authUser);
        setAuthenticated(true);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login error";
        setError(errorMessage);
        throw error;
      }
    },
    [clearError],
  );

  const fetchAllUsernames = useCallback(async () => {
    try {
      const response = await getAllUsernames();
      setUsers(response.data);
    } catch {
      const message = t("authContext.errorFetchUsernames");
      setError(message);
    }
  }, [t]);

  const fetchUserProfile = useCallback(
    async (username: string) => {
      try {
        if (!username) return;
        const res = await profileUser(username);
        const profileData = res.data;

        if (profileData) {
          setUser((prevUser) => {
            if (!prevUser) {
              return {
                _id: profileData._id,
                username: profileData.username,
                email: profileData.email,
                profile: profileData,
              };
            }

            if (
              prevUser.profile &&
              JSON.stringify(prevUser.profile) === JSON.stringify(profileData)
            ) {
              return prevUser;
            }

            return {
              ...prevUser,
              profile: profileData,
            };
          });
        }
      } catch (error) {
        const message = t("authContext.errorFetchProfile");
        console.error("Error fetching profile:", error);
        setError(message);
      }
    },
    [t],
  );

  const fetchConnectionTime = useCallback(
    async (username: string) => {
      try {
        if (!username) return;

        const time = await getConnectionTime(username);
        setConnectionTime(time.data.connectionTime);
      } catch {
        const message = t("authContext.errorTime");
        setError(message);
      }
    },
    [t],
  );

  const username = user?.username;

  useEffect(() => {
    if (username && authenticated) {
      fetchUserProfile(username);
      fetchConnectionTime(username);
    }
  }, [username, authenticated, fetchUserProfile, fetchConnectionTime]);

  useEffect(() => {
    async function checkLogin() {
      const localToken = localStorage.getItem("token");
      const cookieToken = Cookies.get("token");
      const token = localToken || cookieToken;

      if (!token) {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const recoverSession = () => {
        const backupUser = localStorage.getItem("user");
        if (backupUser) {
          try {
            const parsedUser = JSON.parse(backupUser) as User;
            if (parsedUser && parsedUser._id) {
              setAuthenticated(true);
              setUser(parsedUser);
              return true;
            }
          } catch {
            return false;
          }
        }
        return false;
      };

      try {
        const res = await verifyToken();
        if (!res.data) {
          const recovered = recoverSession();
          if (!recovered) setAuthenticated(false);
          return;
        }
        const serverData = (res.data.user || res.data) as User;
        if (serverData && serverData._id) {
          setAuthenticated(true);
          setUser({
            _id: serverData._id,
            username: serverData.username,
            email: serverData.email,
            profile: serverData,
          });
        } else {
          const recovered = recoverSession();
          if (!recovered) setAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checkLogin:", error);
        if (isAxiosError(error)) {
          if (error.response?.status === 401) {
            setAuthenticated(false);
            setUser(null);
            Cookies.remove("token");
            localStorage.removeItem("token");
          } else {
            const recovered = recoverSession();
            if (!recovered) setAuthenticated(false);
          }
        } else {
          const recovered = recoverSession();
          if (!recovered) setAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    }

    checkLogin();
  }, []);

  useEffect(() => {
    fetchAllUsernames();
  }, [fetchAllUsernames]);

  useEffect(() => {
    if (paramUsername) {
      fetchUserProfile(paramUsername);
    }
  }, [paramUsername, fetchUserProfile]);

  const handleUpdateProfilePicture = async (username: string, file: File) => {
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("username", username);

    try {
      await updateProfilePicture(username, formData);

      await fetchUserProfile(username);
    } catch {
      const message = t("authContext.errorProfilePicture");
      setError(message);
    }
  };

  const handleUpdateEmail = async (
    username: string,
    password: string,
    newEmail: string,
  ) => {
    const userResponse = await profileUser(username);
    const user = userResponse.data;

    if (user && user.password === password) {
      if (user.email !== newEmail) {
        await updateEmail(username, password, newEmail);
        await fetchUserProfile(username);
      } else {
        const message = t("authContext.errorUpdateEmail");
        throw new Error(message);
      }
    } else {
      const message = t("authContext.errorUpdateEmailTwo");
      throw new Error(message);
    }
  };

  const handleUpdatePassword = async (
    username: string,
    currentPassword: string,
    newPassword: string,
    verifyPassword: string,
  ) => {
    const userResponse = await profileUser(username);
    const user = userResponse.data;

    if (user && user.password === currentPassword) {
      if (newPassword !== currentPassword) {
        if (newPassword === verifyPassword) {
          await updatePassword(
            username,
            currentPassword,
            newPassword,
            verifyPassword,
          );
          await fetchUserProfile(username);
        } else {
          const message = t("authContext.errorUpdatePassword");
          throw new Error(message);
        }
      } else {
        const message = t("authContext.errorUpdatePasswordTwo");
        throw new Error(message);
      }
    } else {
      const message = t("authContext.errorUpdatePasswordThree");
      throw new Error(message);
    }
  };

  const deleteUserAccount = async (username: string) => {
    try {
      const res = await removeAccount(username);
      setUser(null);
      setAuthenticated(false);
      alert(res.data.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error deleting account",
      );
    }
  };

  const logout = async () => {
    try {
      await removeToken();

      Cookies.remove("token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setTimeout(() => {
        setAuthenticated(false);
        setUser(null);
      }, 300);
    } catch (error) {
      console.error("Error during logout:", error);
      Cookies.remove("token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthenticated(false);
      setUser(null);
    }
  };

  const fetchAllMessages = useCallback(async () => {
    try {
      const response = await getAllMessages();
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const fetchAllMessagesGame = useCallback(async (gameName: string) => {
    try {
      const response = await getAllMessagesGame(gameName);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching games messages:", error);
    }
  }, []);

  useEffect(() => {
    if (gameName) {
      fetchAllMessagesGame(gameName);
    }
  }, [gameName, fetchAllMessages, fetchAllMessagesGame]);

  const contextValue: AuthContextType = {
    signUp,
    signIn,
    logout,
    authenticated,
    loading,
    user,
    users,
    fetchUserProfile,
    fetchAllUsernames,
    handleUpdateProfilePicture,
    handleUpdateEmail,
    handleUpdatePassword,
    deleteUserAccount,
    connectionTime,
    fetchConnectionTime,
    messages,
    fetchAllMessages,
    fetchAllMessagesGame,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
