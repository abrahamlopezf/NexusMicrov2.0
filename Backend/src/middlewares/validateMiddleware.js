const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (res.success) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    return res.status(400).json({ success: false, errors: err.errors });
  }
};

module.exports = validate;
