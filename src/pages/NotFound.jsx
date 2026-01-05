import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page app center">
      <div className="card">
        <h2>Page not found</h2>
        <p>Sorry, we couldn't find that page.</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/">Return home</Link>
        </div>
      </div>
    </div>
  );
}
