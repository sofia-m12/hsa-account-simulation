import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AccountPage } from "./pages/AccountPage";
import { HomePage } from "./pages/HomePage";
import { TransactionsPage } from "./pages/TransactionsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="accounts/:accountId" element={<AccountPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
