import { getTenantModels } from '../utils/tenantManager.js';

export const tenantMiddleware = async (req, res, next) => {
  try {
    const tenantDbName = req.headers['x-tenant-db'];
    if (tenantDbName && tenantDbName !== 'undefined' && tenantDbName !== 'null') {
      const models = await getTenantModels(tenantDbName);
      req.models = models;
    } else {
      req.models = null;
    }
  } catch (error) {
    console.error('[TenantMiddleware] Error loading tenant models:', error);
    req.models = null;
  }
  next();
};
