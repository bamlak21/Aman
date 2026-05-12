import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./layout/Layout";
import { Routes, Route, Navigate } from "react-router-dom";
import Transactions from "./pages/Transactions";
import CreateEscrow from "./pages/CreateEscrow";
import FundEscrow from "./pages/FundEscrow";
import ReleaseFunds from "./pages/ReleaseFunds";
import Dispute from "./pages/Dispute";
import Report from "./pages/Report";
import Protected from "./utils/Protected";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/create-escrow" element={<CreateEscrow />} />
            <Route path="/fund-escrow" element={<FundEscrow />} />
            <Route path="/release-funds" element={<ReleaseFunds />} />
            <Route path="/disputes" element={<Dispute />} />
            <Route path="/report" element={<Report />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
