import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";

// All API calls go to the Express backend
axios.defaults.baseURL = "http://localhost:5000";
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
