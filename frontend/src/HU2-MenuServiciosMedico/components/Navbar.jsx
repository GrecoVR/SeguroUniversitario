
import React from 'react';

export const Navbar = ({ activeTab = 'Servicios', onNavigate, onLogout }) => {
  const menuItems = [
    { label: 'Servicios', key: 'SERVICIOS' },
  ];

  const handleNavClick = (e, key) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(key);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      alert('Cerrar sesión');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-menu">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={`#${item.key.toLowerCase()}`}
              className={`nav-link ${activeTab === item.label ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, item.key)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="btn-logout" onClick={handleLogoutClick}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;