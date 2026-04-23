const { ProductService } = require('../services/ProductService');
const { Product } = require('../models');

exports.createProduct = async (req, res, next) => {
    try {
        const { data, materials, costConfig } = req.body;
        const product = await ProductService.createProduct(data, materials, costConfig, req.user.id);
        
        res.status(201).json({
            status: 'success',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { data, materials, costConfig } = req.body;
        const product = await ProductService.updateProduct(req.params.id, data, materials, costConfig, req.user.id);
        
        res.status(200).json({
            status: 'success',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductFull = async (req, res, next) => {
    try {
        const productDetail = await ProductService.getProductWithCost(req.params.id);
        
        res.status(200).json({
            status: 'success',
            data: productDetail
        });
    } catch (error) {
        next(error);
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.findAll();
        
        res.status(200).json({
            status: 'success',
            results: products.length,
            data: { products }
        });
    } catch (error) {
        next(error);
    }
};
