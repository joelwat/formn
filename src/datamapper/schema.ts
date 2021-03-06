import { assert } from '../error/';

import { ColumnMetadata, TableMetadata, RelationshipMetadata } from '../metadata/';

import { SubSchema, SchemaColumn } from './';

/**
 * A Schema is a representation of a serializable database table, consisting of
 * a series of columns and [[SubSchema]] objects.  It's used when mapping a
 * query to a normalized document.  The mapping is defined using
 * [[TableMetadata]], [[ColumnMetadata]], and [[RelationshipMetadata]].
 */
export class Schema {
  // Used to verify that the same property is not added twice.
  private propertyLookup: Set<string> = new Set();

  // Stores the key columns, which are generally the primary key column(s).
  private keyColumns: SchemaColumn[] = [];

  /**
   * All the [[SubSchema]] instances of this schema.
   */
  public schemata: SubSchema[] = [];

  /**
   * All the [[ColumnMetadata]] objects (columns of the table) that will
   * be mapped in the resulting document.
   */
  public columns: SchemaColumn[] = [];

  /**
   * Initialize the Schema instance.  Note that the properties are treated as
   * package private: they're accessed directly by DataMapper which provides an
   * efficiency boost, and speed is important here.
   * @param table - Metadata for the [[Table]]-decorated Entity.  This is used
   * to produce an instance of the Entity.
   * @param keyColumnMetas - Metadata for the unique column(s) in the table,
   * generally the primary key.  The metadata come from [[Column]]-decorated
   * properties of a [[Table]]-decorated class.  Each has the name of the
   * column, the property in the Entity, and an optional [[Converter]].
   * @param keyColumnNames - The name(s) of the column associated with
   * keyColumn in the to-be-serialized query.
   */
  constructor(
    public table: TableMetadata,
    keyColumnMetas: ColumnMetadata[],
    keyColumnNames: string[]) {

    for (let i = 0; i < keyColumnMetas.length; ++i) {
      this.addColumn(keyColumnMetas[i], keyColumnNames[i]);
      this.keyColumns.push(this.columns.slice(-1)[0]);
    }
  }

  /**
   * Helper function to get the key column data.
   */
  getKeyColumns(): SchemaColumn[] {
    return this.keyColumns;
  }

  /**
   * Add a column to the schema.
   * @param meta - Metadata for the column.  The metadata comes from a
   * [[Column]]-decorated property of a [[Table]]-decorated class and has the
   * name of the column, the property in the Entity, and an optional
   * [[Converter]].
   * @param name - The name of the column in the to-be-serialized query.
   */
  addColumn(meta: ColumnMetadata, name: string): this {
    // The property names must be unique.
    assert(!this.propertyLookup.has(meta.mapTo),
      `Property "${meta.mapTo}" already present in schema.`);
    this.propertyLookup.add(meta.mapTo);

    this.columns.push(new SchemaColumn(meta, name));

    return this;
  }

  /**
   * Add a [[SubSchema]], which is a related [[Table]]-decorated Entity and
   * will be nested under this Schema using the [[RelationshipMetadata]].
   * @param schema - A Schema instance that will be mapped.
   * @param relationship - Relationship metadata for the relationship between
   * this Schema and the sub-Schema.  The relationship must be from this
   * Schema's [[Table]] to the sub-Schema's [[Table]].
   * @param {Schema} schema - A Schema instance.
   */
  addSchema(schema: Schema, relationship: RelationshipMetadata): this {
    // The property names must be unique.
    assert(!this.propertyLookup.has(relationship.mapTo),
      `Property "${relationship.mapTo}" already present in schema.`);
    this.propertyLookup.add(relationship.mapTo);

    // The relationship must be from this Entity.
    assert(this.table.Entity === relationship.Entity,
      `Schema relationship Entity must be "${this.table.Entity.name}" but "${relationship.Entity.name}" provided.`);

    this.schemata.push(new SubSchema(schema, relationship));

    return this;
  }
}

