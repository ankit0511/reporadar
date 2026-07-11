import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PreferenceProvider } from "./context/PreferenceContext";

// Pages
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferenceProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              {/* <Route path="/preferences" element={<Preferences />} />
              <Route path="/dashboard" element={<Dashboard />} /> */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </PreferenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
