import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import Hero from '@/components/movie/Hero';
import ContentRow from '@/components/movie/ContentRow';
import CategoryRow from '@/components/movie/CategoryRow';
import { SkeletonRow } from '@/components/movie/EmptyState';
import PullToRefresh from '@/components/PullToRefresh';
import useLiveCatalog from '@/hooks/useLiveCatalog';


export default function Home() {
  // Film listesi canlı: yönetim film eklediğinde, düzenlediğinde veya sildiğinde
  // sayfa yenilemeden kendini tazeler.
  useLiveCatalog();
  const { data: all, isPending: loading, refetch: fetchAll } = useQuery({
    queryKey: ['home-published-movies'],
    queryFn: () => base44.entities.Movie.filter({ published: true }, '-views', 200),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
  const { featured, rows } = useMemo(() => {
    const movies = all || [];
    const feat = movies.filter((m) => m.featured);
    return {
      featured: feat[0] || movies[0] || null,
      rows: {
        featured: feat.slice(0, 12),
        popular: movies.filter((m) => m.popular).slice(0, 12),
        new: [...movies].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 12),
        most: [...movies].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12),
        action: movies.filter((m) => m.genres?.includes('Aksiyon')).slice(0, 12),
        scifi: movies.filter((m) => m.genres?.includes('Bilim Kurgu')).slice(0, 12),
        comedy: movies.filter((m) => m.genres?.includes('Komedi')).slice(0, 12),
        horror: movies.filter((m) => m.genres?.includes('Korku')).slice(0, 12),
        drama: movies.filter((m) => m.genres?.includes('Dram')).slice(0, 12),
        anim: movies.filter((m) => m.genres?.includes('Animasyon')).slice(0, 12),
      },
    };
  }, [all]);

  return (
    <PullToRefresh onRefresh={fetchAll}>
    <div className="min-h-screen bg-catalog text-white">
      <Hero movie={featured} />
      <CategoryRow />
      <div className="mt-4">
        {loading ? <><SkeletonRow /><SkeletonRow /><SkeletonRow /></> : (
          <>
            <ContentRow title="Popüler Filmler" movies={rows.popular} to="/filmler" />
            <ContentRow title="Öne Çıkanlar" movies={rows.featured} to="/filmler" />
            <ContentRow title="Yeni Eklenenler" movies={rows.new} to="/filmler" />
            <ContentRow title="En Çok İzlenenler" movies={rows.most} to="/filmler" />
            <ContentRow title="Aksiyon" movies={rows.action} to="/filmler?genre=Aksiyon" />
            <ContentRow title="Bilim Kurgu" movies={rows.scifi} to="/filmler?genre=Bilim Kurgu" />
            <ContentRow title="Komedi" movies={rows.comedy} to="/filmler?genre=Komedi" />
            <ContentRow title="Korku" movies={rows.horror} to="/filmler?genre=Korku" />
            <ContentRow title="Dram" movies={rows.drama} to="/filmler?genre=Dram" />
            <ContentRow title="Animasyon" movies={rows.anim} to="/filmler?genre=Animasyon" />
          </>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}