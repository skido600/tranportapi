import type { HandleResponseType } from "../types/types";

const HandleResponse: HandleResponseType = (
  res,
  success,
  statuscode,
  message,
  data?: unknown
): void => {
  const response: any = { success, statuscode, message };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statuscode).json(response);
};

export { HandleResponse };
