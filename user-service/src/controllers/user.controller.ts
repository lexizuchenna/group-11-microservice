import { FastifyRequest, FastifyReply } from "fastify";

export const find_user = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    //@ts-ignore
    const { password, ...rest } = request.user;

    reply.status(200).send({
      success: true,
      data: rest,
      message: "User successfully retried",
      meta: {
        total: 1,
        limit: 0,
        page: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: "Internal server error, try again",
      message: "Something went wrong in the server",
      meta: {
        total: 0,
        limit: 0,
        page: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
    });
  }
};
