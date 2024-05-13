import "./pages/App.css";
import Todo from "./pages/dashboard.jsx";
import Login from './pages/login.jsx';
import Account from "./pages/account.jsx";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import axios from 'axios'

// axios.defaults.withCredentials = false

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} exact />
        <Route path="/todo" element={<Todo />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Router>
  );
}

export default App;
export const API_URL = "https://wads-week9-be.vercel.app";
// export const API_URL = "https://127.0.0.1:8000";
