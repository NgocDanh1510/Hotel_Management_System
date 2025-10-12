const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = "Success",
    data = undefined,
    meta = undefined,
  } = {},
) => {
  const payload = {
    statusCode,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }
  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (
  res,
  { statusCode = 400, message = "Error", errors = [""] } = {},
) => {
  const payload = {
    statusCode,
    message,
    data: null,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
