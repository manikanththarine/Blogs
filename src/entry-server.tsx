import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { loadRouteData } from '../lib/postQueries';
import type { RouteData } from './routeData';

// On React 19, react-helmet-async's <Helmet> renders <title>/<meta>/<link>/<script>
// as plain JSX where it sits in the tree (its HelmetProvider context is a passthrough
// and is never populated) — React only hoists those tags into a live document.head on
// the client. During renderToString there is no live DOM and no <head> ancestor in
// this tree, so the tags land inline in `html`; server.ts extracts them into the
// static template's <head> itself. See src/lib/seo.ts for the tag-building logic.
export async function render(url: string) {
  const routeData = await loadRouteData(url);

  const status =
    routeData.kind === 'none' || (routeData.kind === 'post' && !routeData.post) ? 404 : 200;

  const html = renderToString(
    <StrictMode>
      <HelmetProvider>
        <StaticRouter location={url}>
          <App initialData={routeData} />
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>
  );

  return { html, initialData: routeData as RouteData, status };
}
