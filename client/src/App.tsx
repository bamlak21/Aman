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
// import ChatRoom from "./pages/ChatRoom";
import ChatInbox from "./pages/ChatInbox";
import Protected from "./utils/Protected";
import ForgetPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />
        <Route path="/forget" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/create-escrow" element={<CreateEscrow />} />
            <Route path="/fund-escrow" element={<FundEscrow />} />
            <Route path="/release-funds" element={<ReleaseFunds />} />
            <Route path="/disputes" element={<Dispute />} />
            <Route path="/report" element={<Report />} />
            {/* <Route path="/disputes/:disputeId/chat" element={<ChatRoom />} /> */}
            <Route path="/chat" element={<ChatInbox />} />
            <Route path="/chat/:disputeId" element={<ChatInbox />} />
            <Route path="/disputes/:disputeId/chat" element={<ChatInbox />} />
            
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
