const express = require('express');
const router = express.Router();
const {
  getProfiles,
  getCurrentProfile,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
} = require('../controllers/profileController');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateProfile,
  validateUpdateProfile,
} = require('../validators/profileValidator');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

// /profiles/me — any authenticated user
router.get('/current', getCurrentProfile);
router.get('/me', getCurrentProfile);

router.route('/')
  .get(requireRole('Admin', 'Manager'), getProfiles)
  // Only Admin can create new user profiles
  .post(requireRole('Admin'), validateBody(validateCreateProfile), createProfile);

router.get('/:id', getProfileById);

// Only Admin can update user profiles
router.put('/:id', requireRole('Admin'), validateBody(validateUpdateProfile), updateProfile);
router.patch('/:id', requireRole('Admin'), validateBody(validateUpdateProfile), updateProfile);
router.delete('/:id', requireRole('Admin'), deleteProfile);

module.exports = router;
