import { ColumnLookup } from '../../metadata/';

import { MySQLEscaper, ConditionLexer, ConditionParser, ConditionCompiler,
  ParseTree, LexerToken } from '../';

describe('ConditionCompiler()', function() {
  'use strict';

  const lexer    = new ConditionLexer();
  const parser   = new ConditionParser();
  const compiler = new ConditionCompiler(new MySQLEscaper());

  describe('.compile()', function() {
    it('compiles single conditions.', function() {
      let cond, tokens, tree;

      // $eq.
      cond   = {$eq: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'})).toBe("`name` = :name");

      // $neq.
      cond   = {$neq: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'})).toBe("`name` <> :name");

      // $lt.
      cond   = {$lt: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`age` < 30');

      // $lte.
      cond   = {$lte: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`age` <= 30');

      // $gt.
      cond   = {$gt: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`age` > 30');

      // $gte.
      cond   = {$gte: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`age` >= 30');

      // $like.
      cond   = {$like: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'})).toBe("`name` LIKE :name");

      // $notLike.
      cond   = {$notLike: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'})).toBe("`name` NOT LIKE :name");
    });

    it('compiles conditions containing columns, parameters, and numbers.', function() {
      let cond, tokens, tree;

      // Parameter.
      cond   = {$eq: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'})).toBe("`name` = :name");

      // Number.
      cond   = {$eq: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`age` = 30');

      // Column
      cond   = {$eq: {name: 'u.name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`name` = `u`.`name`');
    });

    it('compiles null conditions.', function() {
      let cond, params, tokens, tree;

      // $is.
      cond   = {$is: {'j.occupation': null}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`j`.`occupation` IS NULL');

      // $isnt.
      cond   = {$isnt: {occupation: null}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`occupation` IS NOT NULL');

      // Using parameters.
      cond   = {$isnt: {occupation: ':occupation'}};
      params = {occupation: null};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, params)).toBe('`occupation` IS NOT NULL');

      cond   = {$isnt: {occupation: ':occupation'}};
      params = {occupation: 'Doctor'}; // Parameter is ignored: NULL is insterted blindly.
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, params)).toBe('`occupation` IS NOT NULL');
    });

    it('compiles in conditions.', function() {
      let cond, tokens, tree;

      // Numbers.
      cond   = {$in: {'p.shoeSize': [10, 10.5, 11]}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`p`.`shoeSize` IN (10, 10.5, 11)');

      // Parameters.
      cond   = {$in: {employer: [':emp1', ':emp2']}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {emp1: 'Nike', emp2: "Billy's Flowers"}))
        .toBe("`employer` IN (:emp1, :emp2)");

      // Columns.
      cond   = {$in: {'u.employer': ['mom.employer', 'dad.employer']}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`u`.`employer` IN (`mom`.`employer`, `dad`.`employer`)');

      // Single condition.
      cond   = {$in: {shoeSize: [10]}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`shoeSize` IN (10)');

      // Negated.
      cond   = {$notIn: {'p.shoeSize': [10, 10.5, 11]}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('`p`.`shoeSize` NOT IN (10, 10.5, 11)');
    });

    it('compiles boolean conditions.', function() {
      let cond, tokens, tree;

      // Single condition AND'd.
      cond   = {$and: [{$eq: {'u.name': 'pn.name'}}]};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('(`u`.`name` = `pn`.`name`)');

      // Two conditions AND'd.
      cond   = {$and: [{$eq: {'u.name': ':name'}}, {$gt: {'u.age': 21}}]};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'}))
        .toBe("(`u`.`name` = :name AND `u`.`age` > 21)");

      // Single condition OR'd.
      cond   = {$or: [{$eq: {name: 'pn.name'}}]};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree)).toBe('(`name` = `pn`.`name`)');

      // Two conditions OR'd.
      cond   = {$or: [{$eq: {name: ':name'}}, {$gt: {age: 21}}]};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {name: 'Joe'}))
        .toBe("(`name` = :name OR `age` > 21)");
    });

    it('throws if an invalid token type is found in the parse tree.', function() {
      const tree = new ParseTree(null, new LexerToken(false, 'BAD', null));
      expect(() => compiler.compile(tree))
        .toThrowError('Unknown type: BAD.');
    });

    it('compiles complicated conditions recursively and adds parentheses correctly.', function() {
      let cond, tokens, tree;

      // (`gender` = 'M' AND (`occupation` IS NULL OR `salary` <= 11000))
      cond = {
        $and: [
          {$eq: {gender: ':gender'}},
          {
            $or: [
              {$is:  {occupation: null}},
              {$lte: {salary: 11000}}
            ]
          }
        ]
      };
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {gender: 'male'}))
        .toBe("(`gender` = :gender AND (`occupation` IS NULL OR `salary` <= 11000))");

      // ((`gender` = 'M' AND `age` > 23) OR (`gender` = 'F' AND `age` > 21))
      cond = {
        $or: [
          {$and: [ {$eq: {gender: ':male'}}, {$gt: {age: 23}} ]},
          {$and: [ {$eq: {gender: ':female'}}, {$gt: {age: 21}} ]}
        ]
      };
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.compile(tree, {male: 'M', female: 'F'}))
        .toBe("((`gender` = :male AND `age` > 23) OR (`gender` = :female AND `age` > 21))");
    });

    it('fails if a parameter replacement is missing.', function() {
      const cond   = {$eq: {gender: ':gender'}};
      const tokens = lexer.parse(cond);
      const tree   = parser.parse(tokens);

      expect(() => compiler.compile(tree))
        .toThrowError('Replacement value for parameter "gender" not present.');
    });

    it('replaces columns using the provided ColumnLookup.', () => {
      const colLookup = new ColumnLookup();

      colLookup.addColumn('u.id', 'u.userID');
      colLookup.addColumn('u.first', 'u.firstName');
      colLookup.addColumn('pn.id', 'pn.phoneNumberID');

      // Checks each operator type that could have a column: comparison, null,
      // and in.
      const cond = {
        $and: [
          {$eq: {'u.id': ':uid'}},
          {$eq: {'pn.id': 'u.id'}},
          {$is: {'u.first': ':myFirst'}},
          {$in: {'pn.id': ['u.id']}},
        ]
      };

      const params = {
        uid:     1,
        myFirst: null as any
      };

      const tokens = lexer.parse(cond);
      const tree   = parser.parse(tokens);

      expect(compiler.compile(tree, params, colLookup))
        .toBe('(`u`.`userID` = :uid AND `pn`.`phoneNumberID` = `u`.`userID` AND `u`.`firstName` IS NULL AND `pn`.`phoneNumberID` IN (`u`.`userID`))');
    });
  });

  describe('.getColumns()', function() {
    it('parses the columns from single conditions.', function() {
      let cond, tokens, tree;

      cond   = {$eq: {name: ':name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.getColumns(tree)).toEqual(['name']);

      cond   = {$lt: {age: 30}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.getColumns(tree)).toEqual(['age']);

      cond   = {$is: {occupation: null}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.getColumns(tree)).toEqual(['occupation']);

      cond   = {$in: {'u.shoeSize': [11, 12]}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.getColumns(tree)).toEqual(['u.shoeSize']);

      cond   = {$eq: {'cousin.name': 'brother.name'}};
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);
      expect(compiler.getColumns(tree)).toEqual(['cousin.name', 'brother.name']);
    });

    it('always returns a distinct list of columns.', function() {
      let cond, tokens, tree;
      cond = {
        $or: [
          {$and: [ {$eq: {'p.gender': ':male'}}, {$gt: {'p.age': 23}} ]},
          {$and: [ {$eq: {'c.gender': 'p.gender'}}, {$gt: {'c.age': 'p.age'}} ]},
          {$and: [ {$eq: {'c.age': 21}}, {$in: {'c.occupation': [':doctor', 'p.occupation']}} ]}
        ]
      };
      tokens = lexer.parse(cond);
      tree   = parser.parse(tokens);

      // The set is distinct.
      expect(compiler.getColumns(tree)).toEqual(
        ['p.gender', 'p.age', 'c.gender', 'c.age', 'c.occupation', 'p.occupation']);
    });
  });
});

