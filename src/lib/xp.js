export function daysInApp(createdDate) {
  if (!createdDate) return 0;
  return Math.floor((Date.now() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24));
}