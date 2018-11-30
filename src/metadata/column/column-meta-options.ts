import { Converter } from '../../converter/converter';

export class ColumnMetaOptions {
  // Column name.
  name?: string;

  // Whether or not this column is the (or part of the) primary key.
  isPrimary?: boolean;

  // Whether or not this column is auto-generated.
  isGenerated?:boolean;
  
  // The column's default value (quoted).
  defaultValue?: string;

  // Whether or not the column is nullable.
  isNullable?: boolean;

  // Data type for the column.
  dataType?: string;

  // Max length for varchar-type fields.
  maxLength?: number;

  // Optional Converter to be applied on save/retrieve.
  converter?: Converter;
}
