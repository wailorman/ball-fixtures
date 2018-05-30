import { assert } from 'chai';

import db from '../../models';
import ballFixturesFactory from '../index';

const ballFixtures = ballFixturesFactory({ db });
const { genUUID } = ballFixtures;

describe(`#genUUID`, () => {
  it(`should split to groups`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID(1, 2, 3, 4, 5),
      '1f000000-2f00-3f00-4f00-5f0000000000',
    );
  });

  it(`should allow no args`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID(),
      'f0000000-f000-f000-f000-f00000000000',
    );
  });

  it(`should allow hex characters`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID('1a', '2b', '3c', '4d', '5ef'),
      '1af00000-2bf0-3cf0-4df0-5eff00000000',
    );
  });

  it(`should ignore extra args`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID(1, 2, 3, 4, 5, 6, 7),
      '1f000000-2f00-3f00-4f00-5f0000000000',
    );
  });

  it(`should replace non-hex chars to 0`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID('abcdefgiih'),
      'abcdef00-00f0-f000-f000-f00000000000',
    );
  });

  it(`should move extra chars to next group`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID('1234567891'),
      '12345678-91f0-f000-f000-f00000000000',
    );
  });

  it(`should allow two extra groups`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID('1234567891', '123456'),
      '12345678-91f0-1234-56f0-f00000000000',
    );
  });

  it(`should move extra digits to next group`, async () => {
    // prettier-ignore
    assert.equal(
      genUUID(1234567891234),
      '12345678-9123-4f00-f000-f00000000000',
    );
  });
});
