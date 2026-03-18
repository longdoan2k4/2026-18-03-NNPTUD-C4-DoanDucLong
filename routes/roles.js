var express = require("express");
var router = express.Router();

let roleModel = require("../schemas/roles");
let { authenticateToken, authorizeRoles } = require('../utils/authHandler')


router.use(authenticateToken, authorizeRoles('admin'));

router.get("/", async function (req, res, next) {
    let page = Math.max(parseInt(req.query.page) || 1, 1);
    let limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    let skip = (page - 1) * limit;

    let filter = { isDeleted: false };
    let [roles, total] = await Promise.all([
        roleModel.find(filter).skip(skip).limit(limit),
        roleModel.countDocuments(filter)
    ]);

    res.send({
        data: roles,
        pagination: {
            page: page,
            limit: limit,
            total: total,
            totalPages: Math.ceil(total / limit)
        }
    });
});


router.get("/:id", async function (req, res, next) {
    try {
        let result = await roleModel.find({ _id: req.params.id, isDeleted: false });
        if (result.length > 0) {
            res.send(result);
        }
        else {
            res.status(404).send({ message: "id not found" });
        }
    } catch (error) {
        res.status(404).send({ message: "id not found" });
    }
});


router.post("/", async function (req, res, next) {
    try {
        let newItem = new roleModel({
            name: req.body.name,
            description: req.body.description
        });
        await newItem.save();
        res.send(newItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(
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