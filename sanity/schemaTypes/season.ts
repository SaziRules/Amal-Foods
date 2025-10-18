import { defineField, defineType } from "sanity";

export const season = defineType({
  name: "season",
  title: "Season Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Season Title",
      type: "string",
      initialValue: "Ramadan 2025",
    }),
    defineField({
      name: "isOpen",
      title: "Is Ordering Open?",
      type: "boolean",
      initialValue: false,
      description: "Toggle this ON when ordering is open to customers.",
    }),
    defineField({
      name: "openDate",
      title: "Open Date",
      type: "datetime",
    }),
    defineField({
      name: "closeDate",
      title: "Close Date",
      type: "datetime",
    }),
    defineField({
      name: "regions",
      title: "Active Regions",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Durban", value: "durban" },
          { title: "Joburg", value: "joburg" },
        ],
      },
      initialValue: ["durban", "joburg"],
    }),
  ],
});
