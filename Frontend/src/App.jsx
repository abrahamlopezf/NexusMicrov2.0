import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import NewSale from "./pages/sales/NewSale";
import PendingOrders from "./pages/sales/PendingOrders";
import Deliveries from "./pages/sales/Deliveries";
import QuickQuote from "./pages/sales/QuickQuote";
import CostsSettings from "./pages/admin/CostsSettings";
import SalesHistory from "./pages/sales/SalesHistory";
import InventoryAlerts from "./pages/inventory/InventoryAlerts";
import ProductCatalog from "./pages/admin/ProductCatalog";
import StockRegister from "./pages/inventory/StockRegister";

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
        {/* Modulos de Ventas (Rutas Específicas POS) */}
        <Route path="/sales/new" element={<ProtectedRoute><MainLayout><NewSale /></MainLayout></ProtectedRoute>} />
        <Route path="/sales/pending" element={<ProtectedRoute><MainLayout><PendingOrders /></MainLayout></ProtectedRoute>} />
        <Route path="/sales/deliveries" element={<ProtectedRoute><MainLayout><Deliveries /></MainLayout></ProtectedRoute>} />
        <Route path="/quotes/new" element={<ProtectedRoute><MainLayout><QuickQuote /></MainLayout></ProtectedRoute>} />
        
        {/* Modulo de Configuración ERP */}
        <Route path="/admin/settings" element={<ProtectedRoute><MainLayout><CostsSettings /></MainLayout></ProtectedRoute>} />
        
        {/* Master Data & Inventory */}
        <Route path="/products" element={<ProtectedRoute><MainLayout><ProductCatalog /></MainLayout></ProtectedRoute>} />
        <Route path="/inventory/register" element={<ProtectedRoute><MainLayout><StockRegister /></MainLayout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><MainLayout><InventoryAlerts /></MainLayout></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute><MainLayout><div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">Módulo de Producción Próximamente</div></MainLayout></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><MainLayout><div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">Módulo de Nómina Próximamente</div></MainLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><MainLayout><div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">Módulo de Reportes Próximamente</div></MainLayout></ProtectedRoute>} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
