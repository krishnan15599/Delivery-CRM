const express = require('express');
const router = express.Router();
const {
  getMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  listApiKeys,
  createApiKey,
  revokeApiKey,
} = require('../controllers/merchantController');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateMerchant,
  validateUpdateMerchant,
  validateCreateApiKey,
} = require('../validators/merchantValidator');
const { requireRole } = require('../middlewares/auth');

router.use(requireRole('Admin', 'Manager'));

router.route('/')
  .get(getMerchants)
  .post(validateBody(validateCreateMerchant), createMerchant);

router.route('/:id')
  .get(getMerchantById)
  .put(validateBody(validateUpdateMerchant), updateMerchant)
  .patch(validateBody(validateUpdateMerchant), updateMerchant)
  .delete(requireRole('Admin'), deleteMerchant);

router.route('/:id/api-keys')
  .get(listApiKeys)
  .post(validateBody(validateCreateApiKey), createApiKey);

router.delete('/:id/api-keys/:keyId', revokeApiKey);

module.exports = router;
