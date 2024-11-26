import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./components/LoginComponent";
import RegisterPage from './components/RegistrationComponent';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
      </div>
    </Router>
  );
}

export default App;
