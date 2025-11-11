import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../plugins/db";
import { user_type } from "../types";

interface user_preference_body {
  preferences: {
    email?: boolean;
    push?: boolean;
  };
  push_token?: string;
}

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

export const update_user_preference = async (
  request: FastifyRequest<{ Body: user_preference_body }>,
  reply: FastifyReply
) => {
  try {
    const { push_token, preferences } = request.body;

    if (
      typeof preferences === undefined ||
      Object.entries(preferences || {}).length === 0
    )
      return reply.status(400).send({
        success: false,
        error: "Bad request",
        message: "Cannot update user without the preference object",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    if (preferences.push && !push_token)
      return reply.status(400).send({
        success: false,
        error: "Bad request",
        message: "Cannot update set push notifications without a push token",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    //@ts-ignore
    const user: user_type = { ...request.user };

    user.push_token = push_token ?? user.push_token;
    user.preferences = {
      email: preferences.email ?? user.preferences.email,
      push: preferences.push ?? user.preferences.push,
    };

    const updatedData = {
      preferences: user.preferences,
      push_token: user.push_token,
    };

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: updatedData,
    });

    reply.status(200).send({
      success: true,
      data: updatedData,
      message: "User preference successfully updated",
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
    console.log(error);
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
