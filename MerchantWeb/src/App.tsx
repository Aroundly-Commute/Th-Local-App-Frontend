import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl?: string;
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
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', imageUrl: '' });
  
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('My Awesome Shop');
  const [shopImageUrl, setShopImageUrl] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  // Ref so cleanup always has the latest socket (avoids stale closure)
  const socketRef = useRef<Socket | null>(null);

  // Init Shop & Socket
  useEffect(() => {
    let cancelled = false;
    const initApp = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/marketplace/debug/init`);
        const data = await res.json();
        if (cancelled) return;
        setShopId(data.shopId);

        // Fetch products initially
        const prodRes = await fetch(`${BACKEND_URL}/marketplace/products/search?q=`);
        const prodData = await prodRes.json();
        const results = Array.isArray(prodData) ? prodData : [];
        const shopProds = results.filter((p: any) => p.shopId === data.shopId).map((p: any) => ({
          id: p.id,
          name: p.product.name,
          price: p.price,
          stock: p.stock,
          description: p.product.description,
          imageUrl: p.product.imageUrl
        }));
        if (!cancelled) setProducts(shopProds);

        // Force WebSocket transport — avoids polling race where events are missed
        const newSocket = io('http://localhost:3000', { transports: ['websocket'] });
        socketRef.current = newSocket;

        const joinRoom = () => {
          console.log('[Merchant] Joining shop room:', data.shopId);
          newSocket.emit('joinShopRoom', data.shopId);
        };

        newSocket.on('connect', () => {
          console.log('[Merchant] Socket connected:', newSocket.id);
          joinRoom();
        });

        // Safety: if socket already connected (hot-reload)
        if (newSocket.connected) joinRoom();

        newSocket.on('newOrder', (order: Order) => {
          console.log('[Merchant] New order received!');
          if (!cancelled) setOrders(prev => [order, ...prev]);
        });

        newSocket.on('connect_error', (err) => {
          console.error('[Merchant] Socket connect error:', err.message);
        });

        if (!cancelled) setSocket(newSocket);
      } catch (err) {
        console.error('Init error', err);
      }
    };
    initApp();

    return () => {
      cancelled = true;
      // Use ref — always the latest socket, never stale
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
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
          imageUrl: newProduct.imageUrl
        })
      });
      const data = await res.json();
      
      const p: Product = {
        id: data.id,
        name: data.product.name,
        price: data.price,
        stock: data.stock,
        description: data.product.description,
        imageUrl: data.product.imageUrl
      };
      setProducts(prev => [...prev, p]);
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', description: '', imageUrl: '' });
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
                  <div className="product-image-container">
                    <img src={p.imageUrl || 'https://via.placeholder.com/150'} alt={p.name} className="product-image" />
                  </div>
                  <h3>{p.name}</h3>
                  <p className="price">₹{p.price.toFixed(2)}</p>
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
              <form className="settings-form" onSubmit={(e) => { e.preventDefault(); alert('Shop saved!'); }}>
                <label>Shop Name</label>
                <input type="text" placeholder="My Awesome Shop" value={shopName} onChange={e => setShopName(e.target.value)} />
                <label>Shop Image URL</label>
                <input type="text" placeholder="https://example.com/shop-image.jpg" value={shopImageUrl} onChange={e => setShopImageUrl(e.target.value)} />
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
                <label>Image URL</label>
                <input type="text" placeholder="https://..." value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
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
