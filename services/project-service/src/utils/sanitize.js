const sanitizeForDb = (input) => {
  if (!input) return '';
  return input.toString().toLowerCase()
    .replace(/\s+/g, '_').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_').replace(/^-+/, '').replace(/-+$/, '');
};

const generateSchemaName = () => {
  const prefix = 'proj_';
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}${randomPart}`;
};

module.exports = { sanitizeForDb, generateSchemaName };
