import { useAuthStore } from "../store/authStore";
import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./sales/SalesDashboard";

const Dashboard = () => {
    const user = useAuthStore(state => state.user);
    
    // Check if the role is 'EMPLOYEE'
    const isEmployee = user?.role?.toUpperCase() === 'EMPLOYEE';

    return isEmployee ? <SalesDashboard /> : <AdminDashboard />;
};

export default Dashboard;
