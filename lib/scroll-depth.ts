/**
 * How far down the page the visitor has read, as a percentage.
 *
 * Extracted from components/ScrollDepth.tsx so the analytics events and the
 * feedback intercept's trigger read depth from ONE definition. They previously
 * could not drift because only one of them existed; now that two things care,
 * a shared function is cheaper than two copies of the arithmetic.
 *
 * A page too short to scroll returns 100, which honestly means "saw it all".
 */
export function scrollDepthPercent(scrollY: number, scrollHeight: number, innerHeight: number): number {
  const scrollable = scrollHeight - innerHeight;
  if (scrollable <= 0) return 100;
  return Math.round((scrollY / scrollable) * 100);
}
