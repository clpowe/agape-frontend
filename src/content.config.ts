import { strapiLoader } from "@sensinum/astro-strapi-loader";
import { defineCollection } from "astro:content";
import { teachersSchema } from "./data/strapi-schema";

// `generateCollections` builds its schemas at runtime, which leaves every
// collection typed as `any`. Declaring the loader and a generated schema keeps
// the data typed at compile time. Re-run `pnpm run strapi:schema` after
// changing Strapi content types.
const strapi = {
  url: import.meta.env.PUBLIC_STRAPI_URL,
  token: import.meta.env.STRAPI_TOKEN,
};

const teachers = defineCollection({
  loader: strapiLoader("teachers", strapi, {
    populate: {
      portrait: true,
      practice_areas: true,
      credentials: true,
    },
  }),
  schema: teachersSchema,
});

export const collections = { teachers };
