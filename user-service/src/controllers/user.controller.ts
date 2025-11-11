import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";

import { prisma } from "../plugins/db";
