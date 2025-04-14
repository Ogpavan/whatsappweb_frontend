import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'QR Session', path: '/' },
    { label: 'Send Message', path: '/send' },
    { label: 'Bulk Messaging', path: '/bulk' },
    { label: 'API Info', path: '/api-info' },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden p-4 bg-gray-800 text-white flex justify-between items-center">
        <span className="font-bold">📲 WhatsApp App</span>
        <button onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white w-64 space-y-4 p-4 h-full md:block ${
          open ? 'block' : 'hidden'
        } md:relative absolute z-20`}
      >
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`block py-2 px-3 rounded hover:bg-gray-700 ${
              location.pathname === item.path ? 'bg-gray-700' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </aside>
    </>
  );
}
