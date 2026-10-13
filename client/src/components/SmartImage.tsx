import { useState } from 'react';
import type { Photo } from '@/lib/types';

interface Props {
  photo: Photo;
  /** Atributo sizes del srcset, ej. "(min-width: 768px) 33vw, 50vw" */
  sizes?: string;
  /** fill: ocupa el contenedor (object-cover). Si no, reserva su proporción para evitar saltos de layout. */
  fill?: boolean;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/** Imagen WebP responsive con srcset, lazy loading y placeholder borroso. */
export function SmartImage({ photo, sizes = '100vw', fill, priority, className = '', imgClassName = '' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const srcSet = photo.variants.length
    ? photo.variants.map((v) => `${v.url} ${v.width}w`).join(', ')
    : undefined;
  const fallback = photo.variants[Math.min(1, photo.variants.length - 1)]?.url ?? photo.publicUrl;

  return (
    <div
      className={`relative overflow-hidden bg-paper ${fill ? 'h-full w-full' : ''} ${className}`}
      style={fill ? undefined : { aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      {photo.blurDataUrl && (
        <div
          aria-hidden
          className={`absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundImage: `url("${photo.blurDataUrl}")` }}
        />
      )}
      <img
        src={fallback}
        srcSet={srcSet}
        sizes={sizes}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-expect-error fetchpriority aún no está en los tipos de React 18
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
}
