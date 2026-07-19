// Author: Lucas Mohler
// React application entry point: mounts App into the #root DOM node.
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
