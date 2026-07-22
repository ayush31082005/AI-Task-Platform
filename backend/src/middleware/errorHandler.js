function errorHandler(error, req, res, _next) {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}

module.exports = errorHandler;
