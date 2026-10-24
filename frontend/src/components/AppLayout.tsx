import { Link, NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "site-nav__link site-nav__link--active" : "site-nav__link";

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="site-brand">
          HSA Platform
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/transactions" className={navClass}>
            Transactions
          </NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
