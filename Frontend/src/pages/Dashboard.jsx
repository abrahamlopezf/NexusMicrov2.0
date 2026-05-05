import { useAuthStore } from "../store/authStore";
import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./sales/SalesDashboard";

const Dashboard = () => {
    const user = useAuthStore(state => state.user);
    
    const role = user?.role?.toUpperCase();
    const isEmployee = role === 'EMPLOYEE';

    return isEmployee ? <SalesDashboard /> : <AdminDashboard />;
};

export default Dashboard;
