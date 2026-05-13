import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import SalesPage from "./pages/sales/SalesPage";
import QuotesPage from "./pages/sales/QuotesPage";
import CostsSettings from "./pages/admin/CostsSettings";
import InventoryLayout from "./pages/inventory/InventoryLayout";
import ProductionLayout from "./pages/production/ProductionLayout";
import SuppliersPage from "./pages/suppliers/SuppliersPage";
import PurchasesPage from "./pages/purchases/PurchasesPage";
import ClientsPage from "./pages/sales/ClientsPage";
import FinanceDashboard from "./pages/finance/FinanceDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected ERP Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Modulos de Ventas e Ingresos */}
        <Route path="/sales" element={<ProtectedRoute><MainLayout><SalesPage /></MainLayout></ProtectedRoute>} />
        <Route path="/quotes" element={<ProtectedRoute><MainLayout><QuotesPage /></MainLayout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><MainLayout><ClientsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><MainLayout><FinanceDashboard /></MainLayout></ProtectedRoute>} />
        
        {/* Modulo de Configuración ERP */}
        <Route path="/admin/settings" element={<ProtectedRoute><MainLayout><CostsSettings /></MainLayout></ProtectedRoute>} />
        
        <Route path="/inventory" element={<ProtectedRoute><MainLayout><InventoryLayout /></MainLayout></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><MainLayout><SuppliersPage /></MainLayout></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><MainLayout><PurchasesPage /></MainLayout></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute><MainLayout><ProductionLayout /></MainLayout></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><MainLayout><div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">Módulo de Nómina Próximamente</div></MainLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><MainLayout><div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">Módulo de Reportes Próximamente</div></MainLayout></ProtectedRoute>} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
