export const BRANDING_LIMITS=Object.freeze({sloganMaxLength:80});

export const DEFAULT_GD_BRANDING=Object.freeze({
  slogan:'Liberdade para seu destino',
  preset:'gd',
  density:'comfortable',
  logoVariant:'gd'
});

const DENSITIES=new Set(['comfortable','compact']);

export function normalizeBranding(value){
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const slogan=typeof input.slogan==='string'
    ? input.slogan.trim().slice(0,BRANDING_LIMITS.sloganMaxLength)
    : DEFAULT_GD_BRANDING.slogan;
  return{
    slogan,
    preset:input.preset==='gd'?'gd':DEFAULT_GD_BRANDING.preset,
    density:DENSITIES.has(input.density)?input.density:DEFAULT_GD_BRANDING.density,
    logoVariant:input.logoVariant==='gd'?'gd':DEFAULT_GD_BRANDING.logoVariant
  };
}

export function getEffectiveBranding(settings){
  const source=settings&&typeof settings==='object'&&!Array.isArray(settings)?settings:{};
  const companyName=typeof source.companyName==='string'&&source.companyName.trim()
    ? source.companyName.trim()
    : 'GD Locações';
  return{companyName,...normalizeBranding(source.branding)};
}
