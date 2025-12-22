import axios from 'axios';

// ⚠️ Ensure this matches your running Backend URL
const API_URL = 'https://fishyy-backend.onrender.com'; 

export const fetchOrders = async () => {
    try {
        // We need an endpoint to get ALL orders (for admin)
        // We will add this to server.js in a moment if it's missing
        const response = await axios.get(`${API_URL}/admin/orders`);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders", error);
        return [];
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        await axios.post(`${API_URL}/admin/order-status`, { orderId, status });
        return true;
    } catch (error) {
        return false;
    }
};

export const fetchDrivers = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/drivers`);
        return response.data;
    } catch (error) {
        return [];
    }
};

export const assignDriver = async (orderId, driverId, driverName) => {
    try {
        await axios.post(`${API_URL}/admin/assign-driver`, { orderId, driverId, driverName });
        return true;
    } catch (error) {
        return false;
    }

};
