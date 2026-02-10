import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./layout/Layout";
import { Routes, Route } from "react-router-dom";
import Transactions from "./pages/Transactions";
import CreateEscrow from "./pages/CreateEscrow";
import FundEscrow from "./pages/FundEscrow";
import ReleaseFunds from "./pages/ReleaseFunds";
import Protected from "./utils/Protected";

function App() {
  return (
    <>
      <Routes>
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/create-escrow" element={<CreateEscrow />} />
            <Route path="/fund-escrow" element={<FundEscrow />} />
            <Route path="/release-funds" element={<ReleaseFunds />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
