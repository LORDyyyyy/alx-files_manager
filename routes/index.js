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

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', AuthController.getMe);

router.post('/files', MiddleWare.userAuth, FilesController.postUpload);

router.get('/files/:id', MiddleWare.userAuth, FilesController.getShow);
router.get('/files', MiddleWare.userAuth, FilesController.getIndex);

router.put(
  '/files/:id/publish',
  MiddleWare.userAuth,
  FilesController.putPublish,
);
router.put(
  '/files/:id/unpublish',
  MiddleWare.userAuth,
  FilesController.putUnpublish,
);

router.get('/files/:id/data', MiddleWare.userAuth, FilesController.getFile);

module.exports = router;
