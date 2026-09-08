import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import CategorySelect from "./pages/CategorySelect";
import Trivia from "./pages/Trivia";
import Result from "./pages/Result";
import Ranking from "./pages/Ranking";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/categorias" element={<CategorySelect />} />
      <Route path="/trivia/:category" element={<Trivia />} />
      <Route path="/resultado" element={<Result />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
