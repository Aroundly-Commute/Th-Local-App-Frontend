import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'products' | 'users'>('overview');

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-container">
          <h2>Admin Console</h2>
        </div>
        <nav>
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={activeTab === 'shops' ? 'active' : ''} 
            onClick={() => setActiveTab('shops')}
          >
            🏪 Shops
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header>
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="admin-profile">
            <span>Admin User</span>
          </div>
        </header>

        <section className="content-area">
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="card stat-card">
                  <h3>Total Revenue</h3>
                  <p className="value">$12,840</p>
                </div>
                <div className="card stat-card">
                  <h3>Active Shops</h3>
                  <p className="value">42</p>
                </div>
                <div className="card stat-card">
                  <h3>Pending Orders</h3>
                  <p className="value">15</p>
                </div>
                <div className="card stat-card">
                  <h3>New Users</h3>
                  <p className="value">128</p>
                </div>
              </div>

              <div className="card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <p>• Shop "Green Valley" added 5 new products</p>
                  <p>• New order #1234 received from John Doe</p>
                  <p>• Merchant "Alice" verified</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'shops' && (
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Owner</th>
                    <th>Products</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Green Valley</td>
                    <td>Alice Smith</td>
                    <td>24</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                  <tr>
                    <td>Tech Hub</td>
                    <td>Bob Jones</td>
                    <td>12</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {(activeTab === 'products' || activeTab === 'users') && (
            <div className="card empty-state">
              <p>Management for {activeTab} coming soon.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
