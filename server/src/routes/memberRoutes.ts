import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { profileSchema } from '../types/schemas';
import {
  syncMember,
  getAllMembers,
  getMe,
  createMember,
  updateMemberAdmin,
  suspendMember,
  removeMember,
  updateMyMembership,
  updateMyProfile,
} from '../controllers/memberController';

const router = Router();

router.post('/sync', requireAuth, syncMember);
router.get('/', requireAdmin, getAllMembers);
router.get('/me', requireAuth, getMe);
router.patch('/me/profile', requireAuth, validate(profileSchema), updateMyProfile);
router.patch('/me/membership', requireAuth, updateMyMembership);
router.post('/', requireAuth, createMember);
router.patch('/:id', requireAdmin, updateMemberAdmin);
router.post('/:id/suspend', requireAdmin, suspendMember);
router.delete('/:id', requireAdmin, removeMember);

export default router;
