let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');
let { body } = require('express-validator');
let { validatedResult } = require('../utils/validator');
let { authenticateToken, authorizeRoles } = require('../utils/authHandler');

let createCollectionValidator = [
    body('name')
        .notEmpty().withMessage('ten collection khong duoc de trong')
        .bail()
        .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/).withMessage('ten collection khong hop le')
];

router.post(
    '/create-table',
    authenticateToken,
    authorizeRoles('admin'),
    createCollectionValidator,
    validatedResult,
    async function (req, res) {
        try {
            let name = req.body.name;
            let db = mongoose.connection.db;

            let existingCollections = await db.listCollections({ name }).toArray();
            if (existingCollections.length > 0) {
                return res.status(409).send({ message: 'collection da ton tai' });
            }

            await db.createCollection(name);
            return res.status(201).send({
                message: 'tao collection thanh cong',
                collection: name
            });
        } catch (error) {
            return res.status(400).send({ message: error.message });
        }
    }
);

module.exports = router;
