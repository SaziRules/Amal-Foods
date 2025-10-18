import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import { season } from './season'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, season],
}
