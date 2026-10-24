import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page not-found-page">
      <p className="not-found-page__code">404</p>
      <h1 className="page-title">Page not found</h1>
      <p className="not-found-page__message">
        This address does not match a page in the HSA Platform.
      </p>
      <Link className="btn btn--primary not-found-page__action" to="/">
        Back to home
      </Link>
    </main>
  );
}
