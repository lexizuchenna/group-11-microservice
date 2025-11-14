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

export const get_templates = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { created_at: "desc" },
    });

    reply.status(200).send({
      success: true,
      data: templates,
      message: "Templates retrieved successfully",
      meta: {
        total: templates.length,
        limit: 0,
        page: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
    });
  } catch (error) {
    console.error("GET TEMPLATES ERROR:", error);

    reply.status(500).send({
      success: false,
      error: "Server error",
      message: "Something went wrong",
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

export const render_template = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { name, version, variables } = request.body as {
      name: string;
      version?: number;
      variables: Record<string, any>;
    };

    // 1. Fetch template (specific version OR latest version)
    const template = await prisma.template.findFirst({
      where: version ? { name, version } : { name },
      orderBy: version ? undefined : { version: "desc" },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: "Template not found",
        message: "No template exists with that name",
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

    const requiredVars: string[] = template.variables as any;

    // 2. Validate missing variables
    const missing = requiredVars.filter((v) => !(v in variables));

    if (missing.length > 0) {
      return reply.status(400).send({
        success: false,
        error: `Missing variables: ${missing.join(", ")}`,
        message: "Invalid variable set provided",
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

    // 3. Render template
    let rendered = template.content;

    requiredVars.forEach((v) => {
      const regex = new RegExp(`{{\\s*${v}\\s*}}`, "g");
      rendered = rendered.replace(regex, variables[v]);
    });

    return reply.status(200).send({
      success: true,
      data: { rendered },
      message: "Template rendered successfully",
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
    console.error("RENDER TEMPLATE ERROR:", error);

    return reply.status(500).send({
      success: false,
      error: "Server Error",
      message: "Something went wrong while rendering template",
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
