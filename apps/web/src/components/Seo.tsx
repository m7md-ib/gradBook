import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/seo/site';

/** Per-page search tags: title, description, canonical URL and schema.org data. */
export function Seo({ title, description, path, jsonLd = [] }: { title: string; description: string; path: string; jsonLd?: object[] }) {
  const url = SITE_URL + path;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
