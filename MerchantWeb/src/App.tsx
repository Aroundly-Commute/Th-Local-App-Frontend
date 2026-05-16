import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  user: { name: string };
  items: any[];
}

const BACKEND_URL = 'http://localhost:3000/api';

function App() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '' });
  
  const [shopId, setShopId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Init Shop & Socket
  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/marketplace/debug/init`);
        const data = await res.json();
        setShopId(data.shopId);

        // Fetch products initially
        const prodRes = await fetch(`${BACKEND_URL}/marketplace/products/search?q=`);
        const prodData = await prodRes.json();
        
        // Ensure prodData is an array
        const results = Array.isArray(prodData) ? prodData : [];
        
        // filter for this shop just in case
        const shopProds = results.filter((p: any) => p.shopId === data.shopId).map((p: any) => ({
          id: p.id,
          name: p.product.name,
          price: p.price,
          stock: p.stock,
          description: p.product.description
        }));
        setProducts(shopProds);

        // Init Socket
        const newSocket = io('http://localhost:3000'); // Socket still uses base URL
        newSocket.on('connect', () => {
          newSocket.emit('joinShopRoom', data.shopId);
        });

        newSocket.on('newOrder', (order: Order) => {
          setOrders(prev => [order, ...prev]);
        });

        setSocket(newSocket);
      } catch (err) {
        console.error('Init error', err);
      }
    };
    initApp();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/marketplace/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          description: newProduct.description,
        })
      });
      const data = await res.json();
      
      const p: Product = {
        id: data.id,
        name: data.product.name,
        price: data.price,
        stock: data.stock,
        description: data.product.description
      };
      setProducts(prev => [...prev, p]);
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = (orderId: string, status: 'CONFIRMED' | 'REJECTED') => {
    if (socket) {
      socket.emit('updateOrderStatus', { orderId, status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <h2>Merchant Hub</h2>
          <p style={{ fontSize: 12, color: 'gray' }}>Shop ID: {shopId?.slice(0, 8)}...</p>
        </div>
        <nav>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            📦 Products
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            🛒 Orders {orders.filter(o => o.status === 'PENDING').length > 0 && `(${orders.filter(o => o.status === 'PENDING').length})`}
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            ⚙️ Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header>
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          {activeTab === 'products' && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              + Add Product
            </button>
          )}
        </header>

        <section className="content-area">
          {activeTab === 'products' && (
            <div className="product-grid">
              {products.map(p => (
                <div key={p.id} className="card product-card">
                  <h3>{p.name}</h3>
                  <p className="price">${p.price.toFixed(2)}</p>
                  <p className="stock">Stock: {p.stock}</p>
                  <p className="description">{p.description}</p>
                </div>
              ))}
              {products.length === 0 && <p>No products yet. Add some!</p>}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-list">
              {orders.length === 0 ? (
                <div className="card empty-state"><p>No orders yet.</p></div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="card order-card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3>Order from {o.user?.name || 'Customer'}</h3>
                      <span className={`status-badge ${o.status.toLowerCase()}`}>{o.status}</span>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: 18, fontWeight: 'bold' }}>Total: ${o.totalAmount.toFixed(2)}</p>
                    <div>
                      {o.items?.map((i: any, idx: number) => (
                        <p key={idx} style={{ color: 'gray' }}>
                          {i.quantity}x {i.shopProduct?.product?.name || 'Item'} (@ ${i.priceAtTime})
                        </p>
                      ))}
                    </div>
                    {o.status === 'PENDING' && (
                      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                        <button className="btn-primary" style={{ backgroundColor: '#22c55e' }} onClick={() => updateOrderStatus(o.id, 'CONFIRMED')}>
                          Accept Order
                        </button>
                        <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={() => updateOrderStatus(o.id, 'REJECTED')}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card">
              <h3>Shop Settings</h3>
              <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                <label>Shop Name</label>
                <input type="text" placeholder="My Awesome Shop" defaultValue="My Awesome Shop" />
                <button className="btn-primary" style={{ marginTop: 16 }}>Save Changes</button>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal card">
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
