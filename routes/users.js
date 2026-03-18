var express = require("express");
var router = express.Router();
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userModel = require("../schemas/users");
let userController = require('../controllers/users')
let { authenticateToken, authorizeRoles, authorizeSelfOrRoles } = require('../utils/authHandler')


router.get("/", authenticateToken, authorizeRoles('admin'), async function (req, res, next) {
  let page = Math.max(parseInt(req.query.page) || 1, 1);
  let limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  let skip = (page - 1) * limit;
  let filter = { isDeleted: false };

  if (req.query.username) {
    filter.username = new RegExp(req.query.username, 'i');
  }

  let [users, total] = await Promise.all([
    userModel.find(filter).skip(skip).limit(limit).populate('role', 'name'),
    userModel.countDocuments(filter)
  ]);

  res.send({
    data: users,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get("/:id", authenticateToken, authorizeSelfOrRoles(function (req) { return req.params.id; }, 'admin'), async function (req, res, next) {
  try {
    let result = await userModel.findOne({ _id: req.params.id, isDeleted: false }).populate('role', 'name')
    if (result) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", authenticateToken, authorizeRoles('admin'), CreateAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role,
      req.body.fullName, req.body.avatarUrl, req.body.status, req.body.loginCount)
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", authenticateToken, authorizeRoles('admin'), ModifyAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", authenticateToken, authorizeRoles('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;