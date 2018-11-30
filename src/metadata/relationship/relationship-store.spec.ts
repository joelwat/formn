import { RelationshipStore } from './relationship-store';
import metaFactory from '../metadata-factory';
import { initDB } from '../../test/entity/database';

import { PhoneNumber } from '../../test/entity/phone-number.entity';
import { Product } from '../../test/entity/product.entity';
import { User } from '../../test/entity/user.entity';
import { Photo } from '../../test/entity/photo.entity';

describe('RelationshipStore()', function() {
  let relStore: RelationshipStore;

  beforeAll(function() {
    // (Re)initialize the db.
    initDB();

    // Reference to the global RelationshipStore.
    relStore = metaFactory.getRelationshipStore();
  });

  /**
   * Get relationships.
   */
  describe('.getRelationships()', function() {
    it('returns an empty array for tables that do not have relationships.', function() {
      expect(relStore.getRelationships(Product, PhoneNumber)).toEqual([]);
    });

    it('doesn\'t matter what order the tables are in.', function() {
      const rels_up = relStore.getRelationships(User, PhoneNumber);
      expect(rels_up.length).toBe(2);
      expect(rels_up[0].Entity).toBe(User);
      expect(rels_up[0].mapTo).toBe('phoneNumbers');
      expect(rels_up[0].to()).toBe(PhoneNumber);
      expect(rels_up[0].on({id: 'id'}, {userID: 'userID'})).toEqual(['id', 'userID']);
      expect(rels_up[0].cardinality).toBe('OneToMany');

      const rels_pu = relStore.getRelationships(PhoneNumber, User);
      expect(rels_pu.length).toBe(2);
      expect(rels_pu[0].mapTo).toBe('user');
      expect(rels_pu[0].Entity).toBe(PhoneNumber);
      expect(rels_pu[0].to()).toBe(User);
      expect(rels_pu[0].on({userID: 'userID'}, {id: 'id'})).toEqual(['userID', 'id']);
      expect(rels_pu[0].cardinality).toBe('ManyToOne');

      expect(rels_up[0]).toEqual(rels_pu[1]);
      expect(rels_up[1]).toEqual(rels_pu[0]);
    });

    it('can restrict the returned keys to those owned by the first table.', function() {
      let rels = relStore.getRelationships(Product, Photo, true);

      // Two relationships from Product to Photo.
      expect(rels.length).toBe(2);

      expect(rels[0].mapTo).toBe('primaryPhoto');
      expect(rels[0].Entity).toBe(Product);
      expect(rels[0].to()).toBe(Photo);
      expect(rels[0].on({primaryPhotoID: 'primaryPhotoID'}, {id: 'id'})).toEqual(['primaryPhotoID', 'id']);
      expect(rels[0].cardinality).toBe('OneToOne');

      expect(rels[1].mapTo).toBe('photos');
      expect(rels[1].Entity).toBe(Product);
      expect(rels[1].to()).toBe(Photo);
      expect(rels[1].on({id: 'id'}, {prodID: 'prodID'})).toEqual(['id', 'prodID']);
      expect(rels[1].cardinality).toBe('OneToMany');

      // One relationship from Photo to Product.
      rels = relStore.getRelationships(Photo, Product, true);
      expect(rels.length).toBe(1);
      expect(rels[0].mapTo).toBe('product');
      expect(rels[0].Entity).toBe(Photo);
      expect(rels[0].to()).toBe(Product);
      expect(rels[0].on({prodID: 'prodID'}, {id: 'id'})).toEqual(['prodID', 'id']);
      expect(rels[0].cardinality).toBe('ManyToOne');
    });

    it('does not duplicate self-referencing foreign keys.', function() {
      const rels = relStore.getRelationships(Photo, Photo);

      expect(rels.length).toBe(2);

      expect(rels[0].mapTo).toBe('largeThumbnail');
      expect(rels[0].Entity).toBe(Photo);
      expect(rels[0].to()).toBe(Photo);
      expect(rels[0].on({largeThumbnailID: 'largeThumbnailID'}, {id: 'id'})).toEqual(['largeThumbnailID', 'id']);
      expect(rels[0].cardinality).toBe('OneToOne');

      expect(rels[1].mapTo).toBe('smallThumbnail');
      expect(rels[1].Entity).toBe(Photo);
      expect(rels[1].to()).toBe(Photo);
      expect(rels[1].on({smallThumbnailID: 'smallThumbnailID'}, {id: 'id'})).toEqual(['smallThumbnailID', 'id']);
      expect(rels[1].cardinality).toBe('OneToOne');
    });

    it('can restirct the returned relationship by property.', () => {
      let rels = relStore.getRelationships(Product, Photo, true, 'primaryPhoto');

      // Two relationships from Product to Photo, but it's been restricted to
      // just primaryPhoto.
      expect(rels.length).toBe(1);

      expect(rels[0].mapTo).toBe('primaryPhoto');
      expect(rels[0].Entity).toBe(Product);
      expect(rels[0].to()).toBe(Photo);
      expect(rels[0].on({primaryPhotoID: 'primaryPhotoID'}, {id: 'id'})).toEqual(['primaryPhotoID', 'id']);
      expect(rels[0].cardinality).toBe('OneToOne');
    });
  });
});

