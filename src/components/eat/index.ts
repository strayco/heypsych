/**
 * E-A-T (Expertise, Authoritativeness, Trustworthiness) Components
 *
 * Components that enhance content credibility and SEO.
 * All components wire to Entity layer metadata.
 */

export { AuthorByline } from './AuthorByline';
export type { AuthorInfo } from './AuthorByline';

export { MedicalReviewBadge } from './MedicalReviewBadge';
export type { MedicalReviewInfo } from './MedicalReviewBadge';

export { ContentTimestamps } from './ContentTimestamps';
export type { TimestampInfo } from './ContentTimestamps';

export { MedicalDisclaimer } from './MedicalDisclaimer';
export type { DisclaimerConfig } from './MedicalDisclaimer';

export { CrisisSupportBanner } from './CrisisSupportBanner';
export type { CrisisResource } from './CrisisSupportBanner';

export { CitationList } from './CitationList';
export type { Citation } from './CitationList';
