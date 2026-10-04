export const scoreTier = (value) => {
  if (value > 5000000) return 'black';
  if (value >= 5000000) return 'orange';
  if (value >= 1000000) return 'yellow';
  if (value >= 300000) return 'pink';
  if (value >= 50000) return 'purple';
  if (value >= 5000) return 'blue';
  return 'default';
};