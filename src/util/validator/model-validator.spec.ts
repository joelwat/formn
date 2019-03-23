import { initDB, TypeTest } from '../../test/';
import { ModelValidator } from '../';

describe('ModelValidator()', () => {
  const validator = new ModelValidator();

  beforeEach(() => initDB());

  describe('.validate()', () => {
    it('resolves if all values are the correct type.', (done) => {
      const tt = {
        int: 4,
        str: 'joe',
        dte: '2019-03-23T21:22:26.936Z',
        num: 3.14,
        bool: true,
        email: 'asdf@asdf.com'
      };

      validator
        .validate(tt, TypeTest)
        .then(() => done());
    });

    it('rejects if a value is not the correct type.', (done) => {
      const tt = {
        int: 4.7,
        str: false,
        dte: 37,
        num: 'n/a',
        bool: 'foo',
      };

      validator
        .validate(tt, TypeTest)
        .catch(errList => {
          expect(errList.errors[0].field).toBe('bool');
          expect(errList.errors[1].field).toBe('num');
          expect(errList.errors[2].field).toBe('dte');
          expect(errList.errors[3].field).toBe('str');
          expect(errList.errors[4].field).toBe('int');
          done();
        });
    });

    it('rejects if a string is too long.', (done) => {
      const tt = {
        str: '123456789012345678901234567890'
      };

      validator
        .validate(tt, TypeTest)
        .catch(errList => {
          expect(errList.errors[0].field).toBe('str');
          expect(errList.errors[0].detail).toBe('"str" must be at most 10 characters long.');
          done();
        });
    });

    it('rejects if a non-nullable value is null.', (done) => {
      const tt = {
        int: null as any
      };

      validator
        .validate(tt, TypeTest)
        .catch(errList => {
          expect(errList.errors[0].field).toBe('int');
          expect(errList.errors[0].detail).toBe('"int" must not be null.');
          done();
        });
    });

    it('rejects if custom validation fails.', (done) => {
      const tt = {
        email: 'invalid-email'
      };

      validator
        .validate(tt, TypeTest)
        .catch(errList => {
          expect(errList.errors[0].field).toBe('email');
          expect(errList.errors[0].detail).toBe('"email" must be a valid email address.');
          done();
        });
    });
  });
});

