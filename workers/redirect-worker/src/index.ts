/**
 * Redirect Worker
 * 
 * Worker spécialisé pour la redirection rapide des liens courts.
 * Optimisé pour faible latence — pas d'accès DB direct, utilise KV Cache.
 */

import { Logger } from './logger';

const logger = new Logger('RedirectWorker');

interface LinkData {
  id: string;
  shortCode: string;
  originalUrl: string;
  status: string;
  password: string | null;
  expiresAt: string | null;
  maxClicks: number | null;
  currentClicks: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const shortCode = url.pathname.split('/').pop() || '';
    
    if (!shortCode || shortCode.length < 3) {
      return Response.redirect('https://peage.io', 302);
    }
    
    try {
      // 1. Vérifier le cache KV
      const cached = await env.LINK_CACHE.get<LinkData>(`link:${shortCode}`, 'json');
      
      if (cached) {
        return handleRedirect(cached, request, env);
      }
      
      // 2. Appeler l'API principale si pas en cache
      const apiResponse = await fetch(`${env.API_URL}/api/links/${shortCode}/resolve`, {
        headers: {
          'Authorization': `Bearer ${env.INTERNAL_API_KEY}`,
          'X-Request-Id': crypto.randomUUID(),
        },
      });
      
      if (!apiResponse.ok) {
        return Response.redirect('https://peage.io/404', 302);
      }
      
      const linkData = await apiResponse.json<LinkData>();
      
      // Mettre en cache
      await env.LINK_CACHE.put(`link:${shortCode}`, JSON.stringify(linkData), {
        expirationTtl: 3600,
      });
      
      return handleRedirect(linkData, request, env);
    } catch (error) {
      logger.error('Redirect failed', error, { shortCode });
      return Response.redirect('https://peage.io/error', 302);
    }
  },
};

async function handleRedirect(
  link: LinkData,
  request: Request,
  env: Env
): Promise<Response> {
  // Vérifier le statut
  if (link.status !== 'active') {
    return Response.redirect('https://peage.io/expired', 302);
  }
  
  // Vérifier l'expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return Response.redirect('https://peage.io/expired', 302);
  }
  
  // Vérifier le max clicks
  if (link.maxClicks && link.currentClicks >= link.maxClicks) {
    return Response.redirect('https://peage.io/expired', 302);
  }
  
  // Vérifier le mot de passe
  if (link.password) {
    const url = new URL(request.url);
    const providedPassword = url.searchParams.get('pw');
    
    if (!providedPassword || providedPassword !== link.password) {
      return new Response(
        renderPasswordPage(link.shortCode),
        {
          status: 403,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
  }
  
  // Envoyer l'événement de clic à la queue
  const clickData = {
    linkId: link.id,
    shortCode: link.shortCode,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || '',
    country: (request as any).cf?.country || '',
    userAgent: request.headers.get('User-Agent') || '',
    referrer: request.headers.get('Referer') || '',
  };
  
  await env.CLICKS_QUEUE.send(clickData);
  
  // Rediriger
  return Response.redirect(link.originalUrl, 302);
}

function renderPasswordPage(shortCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Protected Link</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; background: #f5f5f5;
    }
    .container {
      background: white; padding: 40px; border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 90%;
    }
    h1 { font-size: 24px; margin-bottom: 16px; color: #333; }
    p { color: #666; margin-bottom: 24px; }
    input {
      width: 100%; padding: 12px; border: 2px solid #e0e0e0;
      border-radius: 8px; font-size: 16px; margin-bottom: 16px;
    }
    button {
      width: 100%; padding: 12px; background: #6366f1; color: white;
      border: none; border-radius: 8px; font-size: 16px; cursor: pointer;
    }
    button:hover { background: #5558e6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Password Required</h1>
    <p>This link is password protected. Please enter the password to continue.</p>
    <form onsubmit="event.preventDefault(); window.location.href = window.location.href + '?pw=' + document.getElementById('pw').value;">
      <input type="password" id="pw" placeholder="Enter password" required>
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

// ─── Types ─────────────────────────────────────────────
interface Env {
  LINK_CACHE: KVNamespace;
  CLICKS_QUEUE: Queue;
  API_URL: string;
  INTERNAL_API_KEY: string;
}
