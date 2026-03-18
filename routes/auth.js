let express = require('express');
let router = express.Router()
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let { body } = require('express-validator')
let { validatedResult } = require('../utils/validator')
let roleModel = require('../schemas/roles')
let userModel = require('../schemas/users')
let { generateToken, authenticateToken } = require('../utils/authHandler')

let registerValidator = [
    body('username').notEmpty().withMessage('username khong duoc de trong').bail().isAlphanumeric().withMessage('username khong duoc chua ky tu dac biet'),
    body('email').notEmpty().withMessage('email khong duoc de trong').bail().isEmail().withMessage('email sai dinh dang'),
    body('password').notEmpty().withMessage('password khong duoc de trong').bail().isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('password phai co it nhat 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet')
]

let loginValidator = [
    body('username').notEmpty().withMessage('username khong duoc de trong'),
    body('password').notEmpty().withMessage('password khong duoc de trong')
]

let changePasswordValidator = [
    body('oldpassword').notEmpty().withMessage('oldpassword khong duoc de trong'),
    body('newpassword').notEmpty().withMessage('newpassword khong duoc de trong').bail().isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('newpassword phai co it nhat 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet')
]

router.post('/register', registerValidator, validatedResult, async function (req, res, next) {
    try {
        let { username, password, email, fullName, avatarUrl } = req.body;
        let [existedByUsername, existedByEmail] = await Promise.all([
            userController.GetAnUserByUsername(username),
            userModel.findOne({
                isDeleted: false,
                email: email.toLowerCase()
            })
        ]);

        if (existedByUsername) {
            return res.status(409).send({
                message: 'username da ton tai'
            })
        }

        if (existedByEmail) {
            return res.status(409).send({
                message: 'email da ton tai'
            })
        }

        let defaultRole = await roleModel.findOne({
            name: 'user',
            isDeleted: false
        });

        if (!defaultRole) {
            defaultRole = await roleModel.create({
                name: 'user',
                description: 'Default role for registered users'
            })
        }

        let newUser = await userController.CreateAnUser(username, password, email,
            defaultRole._id,
            fullName,
            avatarUrl,
            true,
            0
        )
        let createdUser = await userModel.findById(newUser._id).populate('role', 'name');
        let token = generateToken(createdUser);

        res.status(201).send({
            message: 'dang ky thanh cong',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: defaultRole.name
            },
            token: token
        })
    } catch (error) {
        res.status(400).send({
            message: error.message
        })
    }
})
router.post('/login', loginValidator, validatedResult, async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userModel.findOne({
            isDeleted: false,
            username: username
        }).populate('role', 'name');

        if (!user) {
            res.status(401).send({
                message: "thong tin dang nhap khong dung"
            })
            return;
        }
        if (user.lockTime > Date.now()) {
            let remainMinutes = Math.ceil((user.lockTime - Date.now()) / 60000);
            res.status(423).send({
                message: `tai khoan dang bi khoa tam thoi. vui long thu lai sau ${remainMinutes} phut`
            })
            return;
        }

        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            user.lockTime = undefined;
            await user.save()
            let token = generateToken(user);
            res.send({
                message: 'dang nhap thanh cong',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role?.name || null
                },
                token: token
            })
        } else {
            user.loginCount++;
            if (user.loginCount >= 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000;
            }
            await user.save()

            let remainAttempts = user.lockTime > Date.now() ? 0 : 3 - user.loginCount;
            res.status(401).send({
                message: "thong tin dang nhap khong dung",
                remainAttempts: remainAttempts
            })
        }
    } catch (error) {
        res.status(400).send({
            message: error.message
        })
    }
})

router.get('/me', authenticateToken, async function (req, res) {
    try {
        let user = await userModel.findById(req.user.id).populate('role', 'name');
        if (!user || user.isDeleted) {
            return res.status(404).send({ message: 'khong tim thay nguoi dung' })
        }

        return res.send({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                status: user.status,
                role: user.role?.name || null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        })
    } catch (error) {
        return res.status(400).send({ message: error.message })
    }
})

router.post('/change-password', authenticateToken, changePasswordValidator, validatedResult, async function (req, res) {
    try {
        let { oldpassword, newpassword } = req.body;
        let user = await userModel.findById(req.user.id);

        if (!user || user.isDeleted) {
            return res.status(404).send({ message: 'khong tim thay nguoi dung' })
        }

        let isMatch = bcrypt.compareSync(oldpassword, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'mat khau hien tai khong dung' })
        }

        user.password = newpassword;
        user.loginCount = 0;
        user.lockTime = undefined;
        await user.save();

        return res.send({ message: 'doi mat khau thanh cong' })
    } catch (error) {
        return res.status(400).send({ message: error.message })
    }
})
module.exports = router