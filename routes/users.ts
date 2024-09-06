import { Router } from 'express'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../controllers/users';
const router = Router();
console.log('first')
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);

router.delete('/:id', deleteUser);


export default router;