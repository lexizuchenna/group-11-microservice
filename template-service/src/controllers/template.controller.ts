import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../plugins/db";

export const create_template = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      variables: string[];
      description: string;
      language: string;
      content: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { name, content, variables, description, language } = request.body;

    // Check last version of this template
    const existing = await prisma.template.findFirst({
      where: { name },
      orderBy: { version: "desc" },
    });

    const next_version = existing ? existing.version + 1 : 1;

    const new_template = await prisma.template.create({
      data: {
        name,
        content,
        variables,
        description,
        language: language || "en",
        version: next_version,
      },
    });

    return reply.status(201).send({
      success: true,
      data: new_template,
      message: "Template created successfully",
      meta: {
        total: 1,
        limit: 0,
        page: 0,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
    });
  } catch (error: any) {
    console.error("CREATE TEMPLATE ERROR:", error);

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
