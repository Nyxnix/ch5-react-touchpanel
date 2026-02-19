import { NavLink } from 'react-router-dom';

function ThemeToggleIcon({ theme }) {
  return <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>;
}

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="nav-shell">
      <div className="nav-frame">
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink
            to="/audio"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Audio
          </NavLink>
          <NavLink
            to="/video-routing"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Video Routing
          </NavLink>
        </nav>
        <div className="nav-tools">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <ThemeToggleIcon theme={theme} />
          </button>
        </div>
      </div>
    </header>
  );
}
