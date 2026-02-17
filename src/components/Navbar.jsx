import { NavLink } from 'react-router-dom';

function ThemeToggleIcon({ theme }) {
  if (theme === 'light') {
    return <span aria-hidden="true">☀️</span>;
  }
  return <span aria-hidden="true">🌙</span>;
}

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="nav-shell">
      <nav className="nav-links">
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
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <ThemeToggleIcon theme={theme} />
      </button>
    </header>
  );
}
