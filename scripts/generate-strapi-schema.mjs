/**
 * Generates Zod schemas from the live Strapi content types so the Astro content
 * collections are typed at compile time.
 *
 * Run with: pnpm run strapi:schema
 *
 * The output is committed. Re-run it whenever the Strapi content types change —
 * nothing detects that automatically.
 */
import { writeFile } from "node:fs/promises";

const OUT_FILE = new URL("../src/data/strapi-schema.ts", import.meta.url);

const url = process.env.PUBLIC_STRAPI_URL;
const token = process.env.STRAPI_TOKEN;

if (!url) {
  console.error("PUBLIC_STRAPI_URL is not set. Is .env loaded?");
  process.exit(1);
}

async function strapiGet(path) {
  const response = await fetch(`${url}/api/${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GET /api/${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const quote = (value) => JSON.stringify(value);

/** Mirrors the mapping in @sensinum/astro-strapi-loader's schema generator. */
function attributeSource(attribute, components, contentTypes, seen) {
  switch (attribute.type) {
    case "string":
    case "text":
    case "richtext":
    case "uid":
    case "password":
      return "z.string()";
    case "email":
      return "z.string().email()";
    case "integer":
    case "float":
    case "decimal":
      return "z.number()";
    case "biginteger":
      // Strapi serialises bigint as a string.
      return "z.union([z.number(), z.string()])";
    case "boolean":
      return "z.boolean()";
    case "date":
    case "datetime":
    case "time":
      return "z.string()";
    case "timestamp":
      return "z.number()";
    case "enumeration":
      return `z.enum([${(attribute.enum ?? []).map(quote).join(", ")}])`;
    case "media":
      return attribute.multiple ? "z.array(mediaSchema)" : "mediaSchema";
    case "blocks":
      return "z.array(blockSchema)";
    case "json":
      return "z.any()";
    case "dynamiczone":
      return "z.array(z.any())";
    case "component": {
      const component = components.find((entry) => entry.uid === attribute.component);
      if (!component) return "z.any()";

      const shape = objectSource(component.schema, components, contentTypes, seen);
      return attribute.repeatable ? `z.array(${shape})` : shape;
    }
    case "relation": {
      const target = contentTypes.find(
        (entry) => entry.uid === attribute.target || entry.apiID === attribute.target,
      );
      if (!target) return "z.any()";

      // Cycle guard — mirrors the loader, which returns a bare reference.
      if (seen.has(target.uid)) {
        return "z.object({ id: z.number().optional(), documentId: z.string().optional() }).passthrough()";
      }

      const shape = objectSource(
        target.schema,
        components,
        contentTypes,
        new Set([...seen, target.uid]),
      );
      return attribute.relation === "oneToMany" || attribute.relation === "manyToMany"
        ? `z.array(${shape})`
        : shape;
    }
    default:
      return "z.any()";
  }
}

/**
 * Relations, media and components are only present when the collection query
 * populates them, so they stay optional regardless of what Strapi says.
 */
const alwaysOptional = new Set(["relation", "media", "component", "dynamiczone"]);

function objectSource(schema, components, contentTypes, seen, { root = false } = {}) {
  const lines = [];

  if (root) {
    lines.push("id: z.number().optional()");
    lines.push("documentId: z.string().optional()");
    lines.push("createdAt: z.string().optional()");
    lines.push("updatedAt: z.string().optional()");
    lines.push("publishedAt: z.string().nullable().optional()");
  }

  for (const [key, attribute] of Object.entries(schema.attributes ?? {})) {
    if (attribute.private) continue;

    const source = attributeSource(attribute, components, contentTypes, seen);
    const optional = !attribute.required || alwaysOptional.has(attribute.type);

    lines.push(`${JSON.stringify(key)}: ${optional ? `${source}.nullable().optional()` : source}`);
  }

  return `z.object({\n${lines.map((line) => `    ${line},`).join("\n")}\n  }).passthrough()`;
}

const [{ data: rawContentTypes }, { data: components }] = await Promise.all([
  strapiGet("content-type-builder/content-types"),
  strapiGet("content-type-builder/components"),
]);

const contentTypes = rawContentTypes.filter((contentType) => !contentType.plugin);

const collections = contentTypes.map((contentType) => {
  const { schema } = contentType;
  // Matches the loader: collection types are keyed by their plural name.
  const key = schema.kind === "collectionType" ? schema.pluralName : schema.singularName;
  const identifier = key.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());

  return {
    key,
    identifier: `${identifier}Schema`,
    source: objectSource(schema, components, contentTypes, new Set([contentType.uid]), {
      root: true,
    }),
  };
});

const file = `// Generated by scripts/generate-strapi-schema.mjs — do not edit by hand.
// Re-run \`pnpm run strapi:schema\` after changing Strapi content types.
import { z } from "astro/zod";

const mediaSchema = z
  .object({
    name: z.string(),
    alternativeText: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    formats: z
      .record(
        z.string(),
        z
          .object({
            url: z.string(),
            width: z.number(),
            height: z.number(),
          })
          .passthrough(),
      )
      .nullable()
      .optional(),
    hash: z.string(),
    ext: z.string().optional(),
    mime: z.string(),
    size: z.number(),
    url: z.string(),
    previewUrl: z.string().nullable().optional(),
    provider: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

/** One node of a Strapi rich-text (blocks) field. */
const blockSchema = z
  .object({
    type: z.string(),
    level: z.number().optional(),
    children: z
      .array(z.object({ type: z.string().optional(), text: z.string().optional() }).passthrough())
      .optional(),
  })
  .passthrough();

${collections
  .map((collection) => `export const ${collection.identifier} = ${collection.source};`)
  .join("\n\n")}
`;

await writeFile(OUT_FILE, file, "utf8");
console.log(
  `Wrote ${collections.length} schema(s) to src/data/strapi-schema.ts: ${collections
    .map((collection) => collection.key)
    .join(", ")}`,
);
