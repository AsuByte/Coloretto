import { Toaster } from "react-hot-toast";

export function Notification() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 5000,
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid #5cff67",
          borderRadius: "12px",
        },
        success: {
          duration: 5000,
          iconTheme: {
            primary: "#5cff67",
            secondary: "#000",
          },
        },
        error: {
          duration: 5000,
          style: {
            border: "1px solid #ef4444",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#000",
          },
        },
        blank: {
          duration: 5000,
          style: {
            border: "1px solid #3b82f6",
          },
          iconTheme: {
            primary: "#3b82f6",
            secondary: "#000",
          },
        },
      }}
    />
  );
}
