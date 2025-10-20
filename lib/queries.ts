import { groq } from "next-sanity";

// Fetch products for a region
export const productsByRegionQuery = (region: string) => groq`
  *[_type == "product" && region == "${region.toLowerCase()}" && active == true]{
    _id,
    title,
    price,
    unit,
    description,
    region,
    "imageUrl": image.asset->url
  } | order(title asc)
`;

// Fetch season info
export const seasonQuery = groq`
  *[_type == "season"][0]{
    title,
    isOpen,
    openDate,
    closeDate,
    regions
  }
`;
