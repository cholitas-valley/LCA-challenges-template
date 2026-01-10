import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/plants', label: 'Plants' },
  { to: '/devices', label: 'Devices' },
  { to: '/settings', label: 'Settings' },
];

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-8" role="menubar">
          {navLinks.map((link) => (
            <li key={link.to} role="none">
              <NavLink
                to={link.to}
                role="menuitem"
                className={({ isActive }) => {
                  const baseClasses = 'inline-block py-4 px-2 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary';
                  const activeClasses = 'border-action-primary text-action-primary';
                  const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
                }}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
