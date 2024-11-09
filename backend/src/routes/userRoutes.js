import express from 'express';


const router = express.Router();

router.get('/', (req, res) => {
    res.send("Hello from kempten");
});

export default router;