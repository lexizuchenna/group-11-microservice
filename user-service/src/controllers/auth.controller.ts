import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";

import { prisma } from "../plugins/db";

interface login_user_body {
  email: string;
  password: string;
}

interface create_user_body {
  name: string;
  email: string;
  push_token?: string | null;
  password: string;
}

export const create_user = async (
  request: FastifyRequest<{ Body: create_user_body }>,
  reply: FastifyReply
) => {
  try {
    const { name, email, push_token, password } = request.body;

    if (!name || !email || !password)
      return reply.status(401).send({
        success: false,
        error: "Missing fields",
        message: "Name, Email and Password fields are required",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(401).send({
        success: false,
        error: "Invalid Email",
        message: "The email address entered is not valid",
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

    const is_email = await prisma.user.findUnique({ where: { email } });

    if (is_email)
      return reply.status(401).send({
        success: false,
        error: "Duplicate data",
        message: "User already exists with the provided email",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    const hashed_password = await bcrypt.hash(password, 11);

    const created_user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed_password,
        preferences: { email: true, push: false },
        push_token: push_token ?? null,
      },
    });

    const { password: p, ...rest } = created_user;

    return reply.status(201).send({
      success: true,
      data: rest,
      message: "User successfully created",
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

export const login_user = async (
  request: FastifyRequest<{ Body: login_user_body }>,
  reply: FastifyReply
) => {
  try {
    const { email, password } = request.body;

    if (!email || !password)
      return reply.status(401).send({
        success: false,
        error: "Missing fields",
        message: "Email and Password fields are required",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(401).send({
        success: false,
        error: "Invalid Email",
        message: "The email address entered is not valid",
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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return reply.status(401).send({
        success: false,
        error: "Invalid user",
        message: "No user with specified email found",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    const is_password_match = await bcrypt.compare(password, user.password);

    if (!is_password_match)
      return reply.status(401).send({
        success: false,
        error: "Invalid password",
        message: "Password does not match, try again",
        meta: {
          total: 0,
          limit: 0,
          page: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
      });

    const token = request.jwt.sign({ user_id: user.user_id });

    const { password: p, created_at, ...rest } = user;

    const data = { ...rest, token };

    return reply.status(201).send({
      success: true,
      data,
      message: "User successfully logged in",
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
