import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import AuthController from '../controllers/AuthController';
import MiddleWare from '../utils/middleware';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);
router.post('/files', MiddleWare.userAuth, FilesController.postUpload);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', AuthController.getMe);

router.get('/files/:id', MiddleWare.userAuth, FilesController.getShow);
router.get('/files', MiddleWare.userAuth, FilesController.getIndex);

module.exports = router;
