import { assert } from '../../error/';

import { TableMetaOptions } from '../../metadata/';

import {
  ModelColumn, ModelRelationship, TableFormatter
} from '../';

/**
 * Helper class for model generation that has metadata about a model.
 */
export class ModelTable {
  private metaOptions: TableMetaOptions = new TableMetaOptions();
  private formnImports: Set<string> = new Set(['Table', 'Column']);
  private columns: ModelColumn[] = [];
  private columnLookup: Map<string, ModelColumn> = new Map();
  private relationships: ModelRelationship[] = [];

  /**
   * Initialize the ModelTable.
   * @param tableFormatter - A [[TableFormatter] instance that is used to
   * format the names of generated class entities.
   */
  constructor(
    private tableFormatter: TableFormatter) {
  }

  /**
   * Get the name of the table.
   */
  getName(): string {
    assert(this.metaOptions.name, 'ModelTable instance has no name.');

    return this.metaOptions.name;
  }

  /**
   * Get the formatted name of the class.
   */
  getClassName(): string {
    return this.tableFormatter.formatClassName(this);
  }

  /**
   * Get the import name of this class.
   */
  getImportName(): string {
    return this.tableFormatter.formatImportName(this);
  }

  /**
   * Get the import file name of this class.
   */
  getImportFileName(): string {
    return `${this.getImportName()}.ts`;
  }

  /**
   * Set the name of the table.
   */
  setName(name: string): this {
    this.metaOptions.name = name;

    return this;
  }

  /**
   * The table schema for databases that have schemas.
   */
  getSchema(): string {
    return this.metaOptions.schema;
  }

  /**
   * Set the schema.
   */
  setSchema(schema: string): this {
    this.metaOptions.schema = schema;

    return this;
  }

  /**
   * Add a column to the table.
   */
  addColumn(col: ModelColumn): this {
    this.columns.push(col);
    this.columnLookup.set(col.getName(), col);

    return this;
  }

  /**
   * Get a [[ModelColumn]] by name.
   */
  getColumnByName(colName: string): ModelColumn {
    assert(this.columnLookup.has(colName), `Column "${colName}" not found.`);

    return this.columnLookup.get(colName);
  }

  /**
   * Add a relationship to the table.
   */
  addRelationship(rel: ModelRelationship): this {
    this.relationships.push(rel);

    // The cardinality of the relationship is a decorator, so an import is
    // needed.
    this.formnImports.add(rel.getCardinality());

    return this;
  }

  /**
   * Get the formn imports as a string.
   */
  getFormnImportsString(): string {
    const imports = Array.from(this.formnImports.values());
    return `import { ${imports.join(', ')} } from 'formn';`;
  }

  /**
   * Get the model imports string, which may be empty.
   */
  getModelImportsString(): string {
    if (this.relationships.length === 0)
      return '';

    return this.relationships
      .map(rel => rel.getReferencedTable())
      .map(refTbl => `import { ${refTbl.getClassName()} } from './${refTbl.getImportName()}';`)
      .join('\n');
  }

  /**
   * Get the metadata as a [[Table]] decorator string.
   */
  getDecoratorString(): string {
    const name   = this.getName();
    const cName  = this.getClassName();
    const schema = this.getSchema();
    const opts   = [];

    if (name && name !== cName)
      opts.push(`name: '${name}'`);

    if (schema)
      opts.push(`schema: '${schema}'`);

    if (opts.length)
      return `@Table({${opts.join(', ')}})`;

    return '@Table()';
  }

  /**
   * Get the class definition string (brackets not included).
   */
  getClassString(): string {
    const className = this.getClassName();

    return `export class ${className}`;
  }

  /**
   * Get a string representation of the model.
   */
  toString(): string {
    let modelStr = this.getFormnImportsString() + '\n\n';

    let modelImports = this.getModelImportsString();

    if (modelImports)
      modelStr += modelImports + '\n\n';

    modelStr += this.getDecoratorString() + '\n';
    modelStr += this.getClassString() + ' {\n';

    modelStr += this.columns
      .map(col => col.toString())
      .join('\n\n');

    if (this.relationships.length) {
      modelStr += '\n\n';

      modelStr += this.relationships
        .map(rel => rel.toString())
        .join('\n\n');
    }

    modelStr += '\n}\n';

    return modelStr;
  }
}

