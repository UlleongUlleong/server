export const checkNodeEnvIsProduction = (): boolean =>
  process.env.NODE_ENV === 'production';
