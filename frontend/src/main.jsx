import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import 'remixicon/fonts/remixicon.css';
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);
