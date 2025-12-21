import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ⚠️ LOCALHOST URL (Use this while testing locally)
const API_URL = 'https://fishyy-backend.onrender.com';

export default function ProductManager() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [products, setProducts] = useState([]);
  
  // Form State
  const [editingProduct, setEditingProduct] = useState(null); // null = Add Mode
  const [formData, setFormData] = useState({
    name: "", category: "Fish", price: "", description: "", imageUrl: "", deliveryTime: "30-45 min"
  });

  // 🔐 SECURITY CHECK
  const checkPin = () => {
    if (pin === "9999") { // Set your Secret PIN here
      setIsAuthorized(true);
      fetchProducts();
    } else {
      alert("Access Denied: Wrong PIN");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // UPDATE Existing
        await axios.put(`${API_URL}/admin/product/${editingProduct._id}`, formData);
        alert("Product Updated!");
      } else {
        // CREATE New
        await axios.post(`${API_URL}/admin/add-product`, formData);
        alert("Product Added!");
      }
      setEditingProduct(null);
      setFormData({ name: "", category: "Fish", price: "", description: "", imageUrl: "", deliveryTime: "" });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product); // Fill form with existing data
  };

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`${API_URL}/admin/product/${id}`);
        fetchProducts();
      } catch (error) {
        alert("Error deleting product");
      }
    }
  };

  // 🔒 LOCKED SCREEN
  if (!isAuthorized) {
    return (
      <div style={styles.lockScreen}>
        <h2>🔒 Super Admin Access</h2>
        <p>Enter PIN to manage inventory</p>
        <input 
          type="password" 
          value={pin} 
          onChange={(e) => setPin(e.target.value)} 
          placeholder="Enter PIN"
          style={styles.input}
        />
        <button onClick={checkPin} style={styles.btn}>Unlock</button>
      </div>
    );
  }

  // 🔓 UNLOCKED DASHBOARD
  return (
    <div style={styles.container}>
      <h2>📦 Inventory Manager</h2>

      {/* --- ADD / EDIT FORM --- */}
      <div style={styles.formCard}>
        <h3>{editingProduct ? `Edit: ${editingProduct.name}` : "Add New Item"}</h3>
        <form onSubmit={handleSubmit} style={styles.gridForm}>
          <input style={styles.input} placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input style={styles.input} placeholder="Price (₹)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
          <select style={styles.input} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Fish</option><option>Prawns</option><option>Crabs</option><option>Squid</option><option>Frozen</option>
          </select>
          <input style={styles.input} placeholder="Delivery Time (e.g. 30 min)" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} />
          <input style={styles.input} placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          <textarea style={{...styles.input, gridColumn: 'span 2'}} placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          
          <button type="submit" style={styles.saveBtn}>
            {editingProduct ? "Update Item" : "Add Item"}
          </button>
          {editingProduct && <button type="button" onClick={() => {setEditingProduct(null); setFormData({});}} style={styles.cancelBtn}>Cancel</button>}
        </form>
      </div>

      {/* --- PRODUCT LIST --- */}
      <div style={styles.list}>
        {products.map(p => (
          <div key={p._id} style={styles.itemCard}>
            <img src={p.imageUrl} alt={p.name} style={{width: 50, height: 50, borderRadius: 5, objectFit: 'cover'}} />
            <div style={{flex: 1, marginLeft: 15}}>
              <strong>{p.name}</strong>
              <div style={{fontSize: 12, color: 'gray'}}>₹{p.price} • {p.category}</div>
            </div>
            <button onClick={() => handleEdit(p)} style={styles.editBtn}>✏️</button>
            <button onClick={() => handleDelete(p._id)} style={styles.delBtn}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple CSS-in-JS Styles
const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
  lockScreen: { textAlign: 'center', marginTop: '100px' },
  input: { padding: '10px', margin: '5px', borderRadius: '5px', border: '1px solid #ccc' },
  btn: { padding: '10px 20px', backgroundColor: '#006064', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  
  formCard: { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  gridForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  saveBtn: { gridColumn: 'span 2', padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { gridColumn: 'span 2', padding: '8px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },

  list: { display: 'grid', gap: '10px' },
  itemCard: { display: 'flex', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: 'white' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', marginRight: '10px' },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }
};