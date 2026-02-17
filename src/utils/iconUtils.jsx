const svgModules = import.meta.glob('../assets/icons/**/*.svg', {
  eager: true,
  import: 'default',
});

const iconLookup = new Map();

function setIfAbsent(key, value) {
  if (key && !iconLookup.has(key)) {
    iconLookup.set(key, value);
  }
}

Object.entries(svgModules).forEach(([fullPath, assetUrl]) => {
  const relativePath = fullPath.replace('../assets/icons/', '');
  const noExt = relativePath.replace(/\.svg$/i, '');
  const basename = relativePath.split('/').pop();
  const basenameNoExt = basename?.replace(/\.svg$/i, '');

  setIfAbsent(relativePath, assetUrl);
  setIfAbsent(noExt, assetUrl);
  setIfAbsent(basename, assetUrl);
  setIfAbsent(basenameNoExt, assetUrl);
});

function resolveIconSrc(icon) {
  if (!icon || typeof icon !== 'string') return null;
  const raw = icon.trim();

  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('data:image/') ||
    raw.startsWith('/')
  ) {
    return raw;
  }

  const normalized = raw.replace(/^\.?\//, '');
  const withoutAssetsPrefix = normalized.replace(/^assets\/icons\//, '');
  const withoutSrcAssetsPrefix = normalized.replace(/^src\/assets\/icons\//, '');

  const candidates = [
    raw,
    normalized,
    withoutAssetsPrefix,
    withoutSrcAssetsPrefix,
    `${raw}.svg`,
    `${normalized}.svg`,
    `${withoutAssetsPrefix}.svg`,
    `${withoutSrcAssetsPrefix}.svg`,
  ];

  for (const candidate of candidates) {
    if (iconLookup.has(candidate)) {
      return iconLookup.get(candidate);
    }
  }

  return null;
}

export function renderConfiguredIcon(icon, fallback = '•') {
  const resolvedSrc = resolveIconSrc(icon);
  if (resolvedSrc) {
    return <img src={resolvedSrc} alt="" className="object-icon-image" />;
  }
  return <span className="object-icon">{icon || fallback}</span>;
}
