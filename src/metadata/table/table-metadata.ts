import { TableMetaOptions } from './table-meta-options';
import { EntityType } from './entity-type';

/**
 * Stores metadata about [[Table]]-decorated classes.
 */
export class TableMetadata {
  /**
   * Initialize the Table's metadata.
   * @param Entity - The constructor for the @[[Table]]-decorated class.
   * @param name - The name of the database table.
   * @param database - The database to which this table belongs.
   * @param schema - The database schema, if any.
   */
  constructor(
    public Entity: EntityType,
    public name: string,
    public database: string,
    public schema?: string) {
  }

  /**
   * Produce an entity.
   * @return An instance of Entity type.
   */
  produceEntity(): any {
    return new this.Entity();
  }

  /**
   * Get the fully-qualified table name in the form
   * &lt;schema&gt;.&lt;name&gt;.
   */
  getFQName(): string {
    if (this.schema === undefined)
      return this.name;

    return `${this.schema}.${this.name}`;
  }
}

