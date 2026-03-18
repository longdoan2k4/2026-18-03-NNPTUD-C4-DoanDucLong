var express = require('express');
var router = express.Router();
const slugify = require('slugify');
let categoryModel = require('../schemas/categories')
let productModel = require('../schemas/products')
let { authenticateToken, authorizeRoles } = require('../utils/authHandler')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let page = Math.max(parseInt(req.query.page) || 1, 1);
  let limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  let skip = (page - 1) * limit;

  let filter = {
    isDeleted: false
  };

  if (req.query.name) {
    filter.name = new RegExp(req.query.name, 'i');
  }

  let [dataCategories, total] = await Promise.all([
    categoryModel.find(filter).skip(skip).limit(limit),
    categoryModel.countDocuments(filter)
  ]);

  res.send({
    data: dataCategories,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
///api/v1/products/id
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id);
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: "ID NOT FOUND"
      });
    } else {
      res.send(result)
    }
  } catch (error) {
    res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
});
router.get('/:id/products', async function (req, res, next) {
  try {
    let id = req.params.id;
    let category = await categoryModel.findById(id);

    if (!category || category.isDeleted) {
      return res.status(404).send({
        message: "ID NOT FOUND"
      });
    }

    let products = await productModel.find({
      category: id,
      isDeleted: false
    }).populate('category', 'name');

    return res.send(products)
  } catch (error) {
    return res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
});
router.post('/', authenticateToken, authorizeRoles('admin'), async function (req, res, next) {
  let newCate = new categoryModel({
    name: req.body.name,
    slug: slugify(req.body.name, {
      replacement: '-',
      remove: undefined,
      lower: true
    }),
    image: req.body.image
  })
  await newCate.save();
  res.send(newCate)
})
router.put('/:id', authenticateToken, authorizeRoles('admin'), async function (req, res, next) {
  //cach 1
  // try {
  //   let id = req.params.id;
  //   let result = await categoryModel.findById(id);
  //   if (!result || result.isDeleted) {
  //     res.status(404).send({
  //       message: "ID NOT FOUND"
  //     });
  //   } else {
  //     let keys = Object.keys(req.body);
  //     for (const key of keys) {
  //       result[key] = req.body[key];
  //     }
  //     await result.save();
  //     res.send(result)
  //   }
  // } catch (error) {
  //   res.status(404).send({
  //     message: "ID NOT FOUND"
  //   });
  // }
  //cach 2
  try {
    let id = req.params.id;
    let result = await categoryModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send(error)
  }
})
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id);
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: "ID NOT FOUND"
      });
    } else {
      result.isDeleted = true;
      await result.save();
      res.send(result)
    }
  } catch (error) {
    res.status(404).send({
      message: "ID NOT FOUND"
    });
  }
})
module.exports = router;

