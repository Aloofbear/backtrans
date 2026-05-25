import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../lib/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    trackEvent('page_view', {
      route: location.pathname,
      hash: location.hash || null,
      searchLength: location.search.length,
    }, user);
  }, [location.hash, location.pathname, location.search, user]);

  return null;
}
