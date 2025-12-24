import React, { useState, useEffect } from 'react';
import { fetchOrders, updateOrderStatus, fetchDrivers, assignDriver } from './api';
import { FaBoxOpen, FaTruck, FaClock, FaSearch, FaUserTie, FaUtensils, FaMoneyBillWave } from 'react-icons/fa';
import ProductManager from './ProductManager';
import './App.css';

// Simple function to fetch withdrawals directly
const fetchWithdrawals = async () => {
  // Added '/admin/withdrawals' to the end
  const res = await fetch('https://fishyy-backend.onrender.com/admin/withdrawals'); 
  return res.json();
};

function App() {
  const [view, setView] = useState('orders'); // 'orders', 'drivers', 'menu', 'payouts'
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState({});

  useEffect(() => {
    // Reset search when switching views
    setSearchTerm("");
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [view]);

  const loadData = async () => {
    const driverData = await fetchDrivers();
    setDrivers(driverData);

    if (view === 'orders') {
      const orderData = await fetchOrders();
      setOrders(orderData);
    } else if (view === 'payouts') {
      const payoutData = await fetchWithdrawals();
      setWithdrawals(payoutData);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    await updateOrderStatus(orderId, newStatus);
    loadData();
  };

  const handleAssignDriver = async (orderId) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) return alert("Please select a driver first!");

    const freshDriversList = await fetchDrivers();
    const driver = freshDriversList.find(d => d._id === driverId);

    if (driver) {
      if (!driver.isOnline) {
        alert(`⚠️ STOP: ${driver.name} has gone OFFLINE! Cannot assign.`);
        setDrivers(freshDriversList); 
        return; 
      }
      await assignDriver(orderId, driver._id, driver.name);
      alert(`✅ Assigned to ${driver.name}`);
      loadData();
      setSelectedDriver(prev => ({ ...prev, [orderId]: "" })); 
    } else {
        alert("Error: Driver not found.");
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Placed') return '#ff9800';
    if (status === 'Preparing') return '#2196f3';
    if (status === 'Out for Delivery') return '#9c27b0';
    if (status === 'Delivered') return '#4caf50';
    return '#757575';
  };

  // Helper to find driver name by ID
  const getDriverName = (id) => {
    const d = drivers.find(drv => drv._id === id);
    return d ? d.name : "Unknown Driver";
  };

  // --- 🔍 FILTER LOGIC ---
  
  // 1. Filter Orders
  const filteredOrders = orders.filter(order => 
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (order.userEmail && order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Filter Payouts (Name, UPI, or Transaction ID)
  const filteredWithdrawals = withdrawals.filter(p => {
    const term = searchTerm.toLowerCase();
    const driverName = getDriverName(p.driverId).toLowerCase();
    const upi = p.upiId ? p.upiId.toLowerCase() : "";
    const txn = p.transactionId ? p.transactionId.toLowerCase() : "";
    
    return driverName.includes(term) || upi.includes(term) || txn.includes(term);
  });

  return (
    <div className="admin-container">
      <div className="sidebar">
        <h2>Fishyy Admin 🦐</h2>
        <ul>
          <li className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}>
            <FaBoxOpen /> Live Orders
          </li>
          <li className={view === 'drivers' ? 'active' : ''} onClick={() => setView('drivers')}>
            <FaTruck /> Drivers
          </li>
          <li className={view === 'menu' ? 'active' : ''} onClick={() => setView('menu')}>
            <FaUtensils /> Menu Manager
          </li>
          <li className={view === 'payouts' ? 'active' : ''} onClick={() => setView('payouts')}>
            <FaMoneyBillWave /> Payouts
          </li>
        </ul>
      </div>

      <div className="main-content">
        <header>
          <h1>
            {view === 'orders' ? 'Dashboard' : 
             view === 'drivers' ? 'Fleet Management' : 
             view === 'payouts' ? 'Payout History' :
             'Menu Management'}
          </h1>
          
          {/* ✅ SEARCH BAR (Visible for Orders AND Payouts) */}
          {(view === 'orders' || view === 'payouts') && (
            <div className="search-bar">
              <FaSearch color="#888" />
              <input 
                  type="text" 
                  placeholder={view === 'orders' ? "Search Order ID or Email..." : "Search Driver Name, UPI, or Txn ID..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{width: '300px'}}
              />
            </div>
          )}
        </header>

        {view === 'menu' ? (
            <ProductManager />
        ) : loading ? (
            <p>Loading...</p>
        ) : view === 'payouts' ? (
            // ✅ PAYOUTS VIEW (Using Filtered List)
            <div className="orders-grid">
                {filteredWithdrawals.length === 0 ? <p>No matching payouts found.</p> : null}
                {filteredWithdrawals.map(payout => (
                    <div key={payout._id} className="order-card" style={{borderLeft: '5px solid #4caf50'}}>
                        <div className="card-header">
                            <div>
                                <h3>{getDriverName(payout.driverId)}</h3>
                                <span className="time"><FaClock /> {new Date(payout.date).toLocaleString()}</span>
                            </div>
                            <span className="status-badge" style={{ backgroundColor: '#4caf50' }}>
                                PAID
                            </span>
                        </div>
                        <div className="card-body">
                            <h2 style={{color: '#2e7d32', margin: '10px 0'}}>₹{payout.amount.toFixed(2)}</h2>
                            <p><strong>To UPI:</strong> {payout.upiId}</p>
                            <p><strong>Ref ID:</strong> <span style={{fontSize:12, color:'gray'}}>{payout.transactionId}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        ) : view === 'drivers' ? (
            // --- DRIVERS VIEW ---
            <div className="orders-grid">
                {drivers.map(driver => (
                    <div key={driver._id} className="order-card">
                        <div className="card-header">
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <FaUserTie size={24} color="#006064"/>
                                <h3>{driver.name}</h3>
                            </div>
                            <span className="status-badge" style={{ backgroundColor: driver.isOnline ? '#4caf50' : '#f44336' }}>
                                {driver.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                        <div className="card-body">
                            <p><strong>Vehicle:</strong> {driver.vehicleNumber}</p>
                            <p><strong>Phone:</strong> {driver.phone}</p>
                            <p><strong>Email:</strong> {driver.email}</p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
          // --- ORDERS VIEW ---
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order._id} className="order-card">
                <div className="card-header" style={{ borderLeft: `5px solid ${getStatusColor(order.status)}` }}>
                  <div>
                    <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                    <span className="time"><FaClock /> {new Date(order.date).toLocaleTimeString()}</span>
                  </div>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>

                <div className="card-body">
                  <p><strong>Customer:</strong> {order.userEmail || "Guest"}</p>
                  <p><strong>Driver:</strong> {order.driverName ? <span style={{color:'green'}}>{order.driverName}</span> : <span style={{color:'red'}}>Unassigned</span>}</p>
                  <div className="items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span>{item.qty}x {item.name}</span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

               <div className="card-actions">
                  {!order.driverName && (order.status === 'Placed' || order.status === 'Preparing') ? (
                    <div style={{display:'flex', gap:'5px', marginBottom: '10px'}}>
                        <select 
                            onChange={(e) => setSelectedDriver({...selectedDriver, [order._id]: e.target.value})}
                            value={selectedDriver[order._id] || ""}
                            style={{padding:'5px', borderRadius:'5px', border:'1px solid #ccc', flex:1}}
                        >
                            <option value="">Select Driver</option>
                            {drivers.map(d => (
                                <option key={d._id} value={d._id} disabled={!d.isOnline} style={{color: d.isOnline ? 'black' : 'lightgray'}}>
                                    {d.name} {d.isOnline ? '(🟢)' : '(🔴 OFFLINE)'}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => handleAssignDriver(order._id)}>Assign</button>
                    </div>
                  ) : null}

                  {order.status === 'Placed' ? (
                      <button onClick={() => handleStatusChange(order._id, 'Preparing')}>Accept & Cook</button>
                  ) : order.status === 'Preparing' ? (
                    <button onClick={() => handleStatusChange(order._id, 'Out for Delivery')}>Send to Driver</button>
                  ) : order.status === 'Out for Delivery' ? (
                    <button onClick={() => handleStatusChange(order._id, 'Delivered')}>Mark Delivered</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
