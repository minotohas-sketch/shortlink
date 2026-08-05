/**
 * Analytics Aggregator
 * 
 * Agrège les statistiques quotidiennes pour les dashboards.
 */

import { Logger } from './logger';

const logger = new Logger('Aggregator');

export async function aggregateDailyStats(env: any): Promise<void> {
  logger.info('Starting daily aggregation');
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  try {
    // Agréger les clics par pays pour hier
    const countryStats = await env.DB.prepare(`
      SELECT 
        country_code,
        COUNT(*) as total_clicks,
        SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) as unique_clicks,
        AVG(cpm_rate) as avg_cpm,
        SUM(earnings) as total_earnings
      FROM clicks
      WHERE date(created_at) = ?
      GROUP BY country_code
      ORDER BY total_clicks DESC
    `).bind(yesterday).all();
    
    // Agréger par lien
    const linkStats = await env.DB.prepare(`
      SELECT 
        link_id,
        COUNT(*) as total_clicks,
        SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) as unique_clicks,
        SUM(earnings) as total_earnings
      FROM clicks
      WHERE date(created_at) = ?
      GROUP BY link_id
    `).bind(yesterday).all();
    
    // Stocker les agrégations dans KV pour le dashboard
    await env.ANALYTICS_CACHE.put(
      `aggregate:${yesterday}:countries`,
      JSON.stringify(countryStats.results),
      { expirationTtl: 2592000 } // 30 jours
    );
    
    await env.ANALYTICS_CACHE.put(
      `aggregate:${yesterday}:links`,
      JSON.stringify(linkStats.results),
      { expirationTtl: 2592000 }
    );
    
    // Agréger les earnings totaux par utilisateur pour hier
    const userEarnings = await env.DB.prepare(`
      SELECT 
        e.user_id,
        SUM(e.amount) as daily_earnings,
        COUNT(*) as transactions
      FROM earnings e
      WHERE date(e.created_at) = ? AND e.status = 'approved'
      GROUP BY e.user_id
    `).bind(yesterday).all();
    
    await env.ANALYTICS_CACHE.put(
      `aggregate:${yesterday}:earnings`,
      JSON.stringify(userEarnings.results),
      { expirationTtl: 2592000 }
    );
    
    // Nettoyer les vieux clics (garder 90 jours)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    
    const deletedClicks = await env.DB.prepare(`
      DELETE FROM clicks WHERE created_at < ?
    `).bind(ninetyDaysAgo).run();
    
    logger.info('Daily aggregation completed', {
      date: yesterday,
      countries: countryStats.results?.length || 0,
      links: linkStats.results?.length || 0,
      deletedClicks: deletedClicks.changes || 0,
    });
  } catch (error) {
    logger.error('Aggregation failed', error);
  }
}

export async function getAggregatedStats(
  env: any,
  date: string
): Promise<any> {
  const cached = await env.ANALYTICS_CACHE.get(`aggregate:${date}`, 'json');
  
  if (cached) {
    return cached;
  }
  
  // Si pas en cache, agréger à la volée
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_clicks,
      SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) as unique_clicks,
      SUM(earnings) as total_earnings
    FROM clicks
    WHERE date(created_at) = ?
  `).bind(date).first();
  
  return stats;
}
