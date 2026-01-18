import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { useAuth } from "@/constants/data";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { Message } from "@/types/types";
import Emoticon from "@/components/chat/Emoticon";
import ReactionPicker from "@/components/chat/Reaction";
import "@/css/chats/Chat.css";

interface User {
  name: string;
  isConnected: boolean;
}

const Chat: React.FC = () => {
  const { gameName } = useParams<{ gameName: string }>();
  const {
    user,
    fetchAllMessages,
    fetchAllMessagesGame,
    messages: contextMessages,
  } = useAuth();
  const t = useLanguageStore((state) => state.t);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [userProfilePictures, setUserProfilePictures] = useState<{
    [username: string]: string;
  }>({});
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const [reactionToMessageId, setReactionToMessageId] = useState<string | null>(
    null,
  );
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingGameUsers, setTypingGameUsers] = useState<string[]>([]);

  const emoticonPickerRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const formatMessageText = useCallback((text: string): React.ReactNode => {
    const mentionPattern = /@(\w+)/g;
    const parts = text.split(mentionPattern);

    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <a key={index} href={`/users/profile/${part}`} className="mention">
          @{part}
        </a>
      ) : (
        part
      ),
    );
  }, []);

  useEffect(() => {
    if (!contextMessages || contextMessages.length === 0) {
      setMessages([]);
      return;
    }

    const relevantMessages = contextMessages.filter((msg) => {
      if (gameName) {
        return msg.gameName === gameName;
      } else {
        return !msg.gameName;
      }
    });

    if (relevantMessages?.length > 0) {
      const formattedMessages = relevantMessages.map((msg: Message) => {
        let timestamp: number;

        if (msg.timestamp && !isNaN(Number(msg.timestamp))) {
          timestamp = Number(msg.timestamp);
        } else {
          timestamp = Date.now();
        }

        return {
          messageId: msg.messageId || "",
          sender: msg.sender,
          text: msg.text || "",
          timestamp: timestamp,
          formattedText: formatMessageText(msg.text || ""),
          reactions: msg.reactions,
        };
      });

      setTimeout(() => {
        setMessages(formattedMessages);
      }, 0);
    }
  }, [contextMessages, formatMessageText, gameName]);

  useEffect(() => {
    if (!user?.username) return;

    if (!socketRef.current) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      socketRef.current = io(`${BACKEND_URL}`, {
        query: { userName: user.username, gameName },
        withCredentials: true,
      });
    }

    const socket = socketRef.current;

    const handleNewMessage = (message: Message) => {
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || Date.now(),
        formattedText: formatMessageText(message.text),
      };

      setMessages((prevMessages) => [...prevMessages, messageWithTimestamp]);
    };

    socket.on("message", handleNewMessage);
    socket.on("general", handleNewMessage);

    socket.on("users-updated", (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    socket.on("reaction-updated", (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.messageId === updatedMessage.messageId
            ? { ...msg, reactions: updatedMessage.reactions }
            : msg,
        ),
      );
    });

    socket.on("reaction-removed", (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.messageId === updatedMessage.messageId
            ? { ...msg, reactions: updatedMessage.reactions }
            : msg,
        ),
      );
    });

    socket.on("typing", (usersTyping: string[]) => {
      setTypingUsers(usersTyping);
    });

    socket.on("stop-typing", (usersTyping: string[]) => {
      setTypingUsers(usersTyping);
    });

    socket.on("typingGame", (usersTyping: string[]) => {
      setTypingGameUsers(usersTyping);
    });

    socket.on("stop-typingGame", (usersTyping: string[]) => {
      setTypingGameUsers(usersTyping);
    });

    socket.emit("user-connected", { userName: user.username });

    return () => {
      socket.off("message");
      socket.off("general");
      socket.off("users-updated");
      socket.off("reaction-updated");
      socket.off("reaction-removed");
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("typingGame");
      socket.off("stop-typingGame");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.username, gameName, formatMessageText]);

  const fetchAllMessagesRef = useRef(fetchAllMessages);
  const fetchAllMessagesGameRef = useRef(fetchAllMessagesGame);

  useEffect(() => {
    fetchAllMessagesRef.current = fetchAllMessages;
    fetchAllMessagesGameRef.current = fetchAllMessagesGame;
  }, [fetchAllMessages, fetchAllMessagesGame]);

  useEffect(() => {
    if (!user?.username) return;

    const fetchMessages = async () => {
      if (gameName) {
        await fetchAllMessagesGameRef.current(gameName);
      } else {
        await fetchAllMessagesRef.current();
      }
    };
    fetchMessages();
  }, [user, gameName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emoticonPickerRef.current &&
        !emoticonPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmoticonPicker(false);
      }
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUserProfilePicture = useCallback(
    async (username: string) => {
      if (userProfilePictures[username]) return;

      const defaultAvatar = `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=40`;

      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        const response = await fetch(`${BACKEND_URL}users/profile/${username}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();

        if (!responseText) {
          setUserProfilePictures((prev) => ({
            ...prev,
            [username]: defaultAvatar,
          }));
          return;
        }

        const userData = JSON.parse(responseText);

        if (userData.profilePicture) {
          setUserProfilePictures((prev) => ({
            ...prev,
            [username]: userData.profilePicture,
          }));
        } else {
          setUserProfilePictures((prev) => ({
            ...prev,
            [username]: defaultAvatar,
          }));
        }
      } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error);
        setUserProfilePictures((prev) => ({
          ...prev,
          [username]: defaultAvatar,
        }));
      }
    },
    [userProfilePictures],
  );

  const getProfilePicture = (username: string) => {
    if (username === user?.username) {
      return (
        user.profile?.profilePicture ||
        "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=40"
      );
    }

    const picture = userProfilePictures[username];

    if (!picture) {
      return `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=40`;
    }

    return picture;
  };

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.sender && !userProfilePictures[msg.sender]) {
        fetchUserProfilePicture(msg.sender);
      }
    });
  }, [messages, fetchUserProfilePicture, userProfilePictures]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const timestamp = Date.now();
      socketRef.current?.emit("message", {
        sender: user?.username,
        text: input,
        timestamp,
        gameName,
      });

      if (gameName) {
        socketRef.current?.emit("stop-typingGame", {
          user: user?.username,
          gameName,
        });
      } else {
        socketRef.current?.emit("stop-typing", { user: user?.username });
      }
      setInput("");
    }
  };

  const handleEmoticonClick = (emoticon: string) => {
    setInput(input + emoticon);
    setShowEmoticonPicker(false);
  };

  const handleReactionClick = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (reactionToMessageId === messageId && showReactionPicker) {
      setShowReactionPicker(false);
      setReactionToMessageId(null);
    } else {
      setReactionToMessageId(messageId);
      setReactionPickerPosition({ x: e.clientX, y: e.clientY });
      setShowReactionPicker(true);
    }
  };

  const handleReactionSelect = (emoji: string) => {
    if (reactionToMessageId && socketRef.current && user) {
      const message = messages.find(
        (msg) => msg.messageId === reactionToMessageId,
      );
      const userHasReacted = message?.reactions?.[emoji]?.includes(
        user.username,
      );

      if (userHasReacted) {
        socketRef.current.emit("remove-reaction", {
          messageId: reactionToMessageId,
          emoji,
          user: user.username,
        });
      } else {
        const currentReactions = message?.reactions || {};
        const newReactions = {
          ...currentReactions,
          [emoji]: [user.username],
        };
        socketRef.current.emit("reaction", {
          messageId: reactionToMessageId,
          emoji,
          user: user.username,
          reactions: newReactions,
        });
      }

      setReactionToMessageId(null);
      setShowReactionPicker(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (e.target.value) {
      if (gameName) {
        socketRef.current?.emit("typingGame", {
          user: user?.username,
          gameName,
        });
      } else {
        socketRef.current?.emit("typing", { user: user?.username });
      }
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      if (gameName) {
        socketRef.current?.emit("stop-typingGame", {
          user: user?.username,
          gameName,
        });
      } else {
        socketRef.current?.emit("stop-typing", { user: user?.username });
      }
    }, 3000);
  };

  return (
    <div className="chat-container">
      <div className="messages-and-users">
        <div className="messages-section">
          <div className="message-list">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <li
                  key={msg.messageId}
                  className="message-item"
                  onMouseEnter={() => setHoveredMessageId(msg.messageId)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className="message-text">
                    <div className="message-header">
                      <img
                        className="profile-pic"
                        src={getProfilePicture(msg.sender)}
                        aria-hidden="true"
                      />
                      <span className="message-sender">{msg.sender}</span>
                      <span className="message-time">
                        {msg.timestamp ? formatTime(msg.timestamp) : ""}
                      </span>
                    </div>
                    <div className="message-content">{msg.formattedText}</div>
                  </div>

                  {hoveredMessageId === msg.messageId && (
                    <button
                      className="reaction-button"
                      onClick={(e) => handleReactionClick(msg.messageId, e)}
                    >
                      <i className="fas fa-comment-dots"></i>
                    </button>
                  )}

                  {showReactionPicker &&
                    reactionToMessageId === msg.messageId && (
                      <ReactionPicker
                        onSelect={handleReactionSelect}
                        ref={reactionPickerRef}
                      />
                    )}
                  <div className="message-reactions">
                    {msg.reactions &&
                      Object.entries(msg.reactions).map(([emoji, users]) => (
                        <div key={emoji} className="reaction">
                          <span>{emoji}</span>
                          <span>({users.length})</span>
                        </div>
                      ))}
                  </div>
                </li>
              ))
            ) : (
              <li></li>
            )}
          </div>
          <div
            className={`typing-indicator ${
              typingGameUsers.length > 0 || typingUsers.length > 0
                ? "visible"
                : ""
            }`}
          >
            {gameName
              ? typingGameUsers.length > 0
                ? `${typingGameUsers.join(", ")} ${t("chatPage.typing")}`
                : null
              : typingUsers.length > 0
                ? `${typingUsers.join(", ")} ${t("chatPage.typing")}`
                : null}
          </div>
        </div>

        <aside className="connected-users-panel">
          <h2>{t("chatPage.users")}</h2>
          <ul>
            {users.length === 0 ? (
              <li>{t("chatPage.loadingUsers")}</li>
            ) : (
              users.map((userItem, idx) => (
                <li key={idx} className="user-item">
                  <span
                    className={`status-indicator ${
                      userItem.isConnected ? "online" : "offline"
                    }`}
                  ></span>
                  {userItem.name}
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <div className="input-container">
          <input
            id="messageInput"
            type="text"
            className="chatInput"
            value={input}
            onChange={handleInputChange}
            placeholder={t("chatPage.typeMessage")}
          />
          <button
            type="button"
            className="emoticon-button"
            onClick={() => setShowEmoticonPicker(!showEmoticonPicker)}
          >
            <i className="fas fa-smile"></i>
          </button>
        </div>
        <button className="submitChat" type="submit">
          {t("chatPage.send")}
        </button>
        {showEmoticonPicker && (
          <div className="emoticon-picker" ref={emoticonPickerRef}>
            <Emoticon onSelect={handleEmoticonClick} />
          </div>
        )}
      </form>
    </div>
  );
};

export default Chat;
