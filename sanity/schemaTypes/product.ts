import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Products",
  type: "document",
  fields: [
    // 🏷️ Basic Details
    defineField({
      name: "title",
      title: "Product Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Samoosas", value: "samoosas" },
          { title: "Spring Rolls", value: "spring-rolls" },
          { title: "Pastries & Pies", value: "pastries" },
          { title: "Roti & Paratha", value: "roti" },
          { title: "Snacks", value: "snacks" },
          { title: "Desserts", value: "desserts" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),

    // 🏬 Regional Pricing
    defineField({
      name: "pricing",
      title: "Branch Pricing",
      type: "object",
      fields: [
        defineField({
          name: "durban",
          title: "Durban Price (R)",
          type: "number",
          validation: (Rule) => Rule.min(0),
        }),
        defineField({
          name: "joburg",
          title: "Joburg Price (R)",
          type: "number",
          validation: (Rule) => Rule.min(0),
        }),
      ],
    }),

    // 🗺️ Branch Availability
    defineField({
      name: "available_in",
      title: "Available In",
      description: "Explicitly select 'durban' or 'joburg' (lowercase only).",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Durban", value: "durban" },
          { title: "Joburg", value: "joburg" },
        ],
        layout: "tags",
      },
      initialValue: ["durban", "joburg"],
    }),

    // 📦 Product Info
    defineField({
      name: "unit",
      title: "Unit (e.g. Pack of 5, 200g)",
      type: "string",
    }),

    defineField({
      name: "sku",
      title: "SKU / Product Code",
      type: "string",
      description: "Optional internal stock-keeping code.",
    }),

    defineField({
      name: "description",
      title: "Product Description",
      type: "text",
      rows: 3,
    }),

    // 🍳 Cooking / Storage Details
    defineField({
      name: "instructions",
      title: "Cooking / Heating Instructions",
      type: "text",
      rows: 3,
      description: "e.g., Air fry for 10 mins at 180°C or deep fry until golden.",
    }),

    defineField({
      name: "storage",
      title: "Storage Info",
      type: "string",
      description: "e.g., Keep frozen below -18°C. Do not refreeze once thawed.",
    }),

    // 🧩 Visuals
    defineField({
      name: "image",
      title: "Product Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "gallery",
      title: "Additional Images",
      type: "array",
      of: [{ type: "image" }],
      options: { layout: "grid" },
    }),

    // 🎯 Marketing Flags
    defineField({
      name: "label",
      title: "Product Label",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Best Seller", value: "bestseller" },
          { title: "Limited Edition", value: "limited" },
          { title: "Seasonal", value: "seasonal" },
        ],
        layout: "radio",
      },
    }),

    // ⚙️ Visibility Control
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Uncheck to hide this product from the store.",
    }),

    // 🕒 Metadata
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "image",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Untitled Product",
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : "",
        media,
      };
    },
  },
});
