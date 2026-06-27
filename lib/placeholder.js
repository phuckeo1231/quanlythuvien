const bookCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" viewBox="0 0 96 128">
  <rect width="96" height="128" fill="#e5e7eb"/>
  <text x="48" y="68" font-family="sans-serif" font-size="32" text-anchor="middle">📖</text>
</svg>`;

export const BOOK_COVER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(bookCoverSvg)}`;
