import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Katalog sorguları: film veya kategori değiştiği an bu sayfalar kendini tazeler.
const CATALOG_QUERY_KEYS = [['home-published-movies'], ['browse-published-movies'], ['browse-categories']];

/**
 * Film/kategori verisindeki değişiklikleri canlı yansıtır: kullanıcı film eklerken,
 * düzenlerken veya silerken açık sayfa sayfa yenilemeden güncellenir.
 * Art arda gelen değişiklikler tek tazelemede birleşir — gereksiz yük ve kasma olmaz.
 */
export default function useLiveCatalog() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let timer = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (document.visibilityState === 'hidden') return;
        CATALOG_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      }, 800);
    };
    const unsubscribeMovie = base44.entities.Movie.subscribe(refresh);
    const unsubscribeCategory = base44.entities.Category.subscribe(refresh);
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribeMovie();
      unsubscribeCategory();
    };
  }, [queryClient]);
}