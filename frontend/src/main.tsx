import ReactDOM from "react-dom/client";
import App from "@/App";
import { Notification } from "@/components/Notification";

const container = document.getElementById("root");

if (!container) {
  throw new Error('The element with id "root" was not found');
}

const root = ReactDOM.createRoot(container);
root.render(
  <>
    <Notification />
    <App />
  </>
);
