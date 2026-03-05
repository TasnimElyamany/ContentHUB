import { Router } from 'express';
import { generate, enhance, research, getCredits } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { aiGenerateSchema, aiEnhanceSchema, aiResearchSchema } from '../schemas/ai.schema';

const router = Router();

router.use(authenticate);

router.post('/generate', validate(aiGenerateSchema), generate);
router.post('/enhance', validate(aiEnhanceSchema), enhance);
router.post('/research', validate(aiResearchSchema), research);
router.get('/credits', getCredits);

export default router;
