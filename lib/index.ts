// =============================================================================
// REFINERY LIB - Index file
// File: lib/index.ts (or add these exports to existing index)
// =============================================================================

export * from './employerValidation';
export * from './experienceCalculator';
export * from './employerSearch';
export * from './documentStyles';
// Note: whyGoodFitGenerator exports are handled individually below to avoid naming conflicts
export { buildBatchWhyGoodFitPrompt, parseBatchResponse, generateFallbackFit } from './whyGoodFitGenerator';
export { validateWhyGoodFit as validateWhyGoodFitText } from './whyGoodFitGenerator';

// Default exports for convenience
export { default as employerValidation } from './employerValidation';
export { default as experienceCalculator } from './experienceCalculator';
export { default as employerSearch } from './employerSearch';
export { default as documentStyles } from './documentStyles';
export { default as whyGoodFitGenerator } from './whyGoodFitGenerator';
