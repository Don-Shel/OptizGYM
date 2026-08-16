import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adminMemberCreateSchema, adminMemberUpdateSchema, profileSchema } from '../types/schemas';
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
  createMemberAdmin,
  activateMember,
} from '../controllers/memberController';

const router = Router();

router.post('/sync', requireAuth, syncMember);
router.get('/', requireAdmin, getAllMembers);
router.get('/me', requireAuth, getMe);
router.post('/admin', requireAdmin, validate(adminMemberCreateSchema), createMemberAdmin);
router.patch('/me/profile', requireAuth, validate(profileSchema), updateMyProfile);
router.patch('/me/membership', requireAuth, updateMyMembership);
router.post('/', requireAuth, createMember);
router.patch('/:id', requireAdmin, validate(adminMemberUpdateSchema), updateMemberAdmin);
router.post('/:id/activate', requireAdmin, activateMember);
router.post('/:id/suspend', requireAdmin, suspendMember);
router.delete('/:id', requireAdmin, removeMember);

export default router;
