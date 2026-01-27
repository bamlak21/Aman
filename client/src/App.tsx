import "./App.css";
import Test from "./pages/Test";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./layout/Layout";
import { Routes, Route } from "react-router-dom";
import Transactions from "./pages/Transactions";
import CreateEscrow from "./pages/CreateEscrow";

function App() {
  return (
    <>
      <Routes>
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        <Route path="/" element={<Test />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/create-escrow" element={<CreateEscrow />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
