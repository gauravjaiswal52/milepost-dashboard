import { redirect } from 'next/navigation';

// The actual dashboard is a single self-contained static HTML file (public/dashboard.html) —
// this just sends visitors there. Keeping it a redirect rather than fighting Next's App Router
// over serving a full custom <html>/<head>/<body> document at "/".
export default function Home() {
  redirect('/dashboard.html');
}
