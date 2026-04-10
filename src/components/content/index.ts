/**
 * Content Components
 *
 * Components for displaying content in the right drawer panel,
 * including Wikipedia article iframes and entity details.
 */

export { ArticleIframe } from './ArticleIframe/ArticleIframe';
export type { ArticleIframeProps } from './ArticleIframe/ArticleIframe';
export { isValidWikiUrl } from './ArticleIframe/ArticleIframe.utils';

export { ProvinceDrawerContent } from './ProvinceDrawerContent/ProvinceDrawerContent';
export type { ProvinceDrawerContentProps } from './ProvinceDrawerContent/ProvinceDrawerContent';

export { MarkerDrawerContent } from './MarkerDrawerContent/MarkerDrawerContent';
export type { MarkerDrawerContentProps } from './MarkerDrawerContent/MarkerDrawerContent';
export { getMarkerIcon, getMarkerTypeName, formatYear } from './MarkerDrawerContent/MarkerDrawerContent.utils';
