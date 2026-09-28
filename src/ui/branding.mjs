const ASSETS = Object.freeze({
  full: './assets/branding/gd-logo-full.jpeg',
  compact: './assets/branding/gd-logo-compact.svg',
  icon: './assets/branding/gd-icon.svg'
});

export const GD_BRAND = Object.freeze({
  companyName: 'GD Locações',
  slogan: 'Liberdade para seu destino',
  assets: ASSETS
});

const VARIANTS = new Set(Object.keys(ASSETS));

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function renderGDLogo({ variant = 'full', className = '', alt = GD_BRAND.companyName } = {}) {
  if (!VARIANTS.has(variant)) throw new RangeError(`Variante de logo GD inválida: ${variant}`);

  const classes = ['gd-brand', `gd-brand--${variant}`, className.trim()].filter(Boolean).join(' ');
  const src = ASSETS[variant];

  return `<img class="${escapeAttribute(classes)}" data-variant="${variant}" src="${src}" alt="${escapeAttribute(alt)}" decoding="async">`;
}
