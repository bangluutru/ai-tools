import React from 'react';
import ImageCard from './ImageCard.jsx';

export default function ImageGrid({ items, onCompare, onDelete }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="image-grid">
      {items.map((item) => (
        <ImageCard
          key={item.id}
          item={item}
          onCompare={onCompare}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
