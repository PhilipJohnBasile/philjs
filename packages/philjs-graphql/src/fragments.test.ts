/**
 * GraphQL Fragments Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFragmentRegistry,
  defineFragment,
  maskFragment,
  unmaskFragment,
  isMaskedFragment,
  spreadFragment,
  composeFragments,
  buildQueryWithFragments,
  useFragment,
  withFragment,
  getComponentFragment,
  mergeFragmentData,
  selectFromFragment,
  fragment,
  inlineFragment,
  FragmentUtils,
} from './fragments';
import { gql } from './index';

describe('FragmentRegistry', () => {
  it('should create a fragment registry', () => {
    const registry = createFragmentRegistry();

    expect(registry).toBeDefined();
    expect(registry.size).toBe(0);
  });

  it('should register a fragment', () => {
    const registry = createFragmentRegistry();

    const frag = defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    expect(registry.has('UserFields')).toBe(true);
    expect(registry.size).toBe(1);
  });

  it('should get a registered fragment', () => {
    const registry = createFragmentRegistry();

    defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const fragment = registry.get('UserFields');

    expect(fragment).toBeDefined();
    expect(fragment?.name).toBe('UserFields');
    expect(fragment?.on).toBe('User');
  });

  it('should get fragments by type', () => {
    const registry = createFragmentRegistry();

    defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    defineFragment(
      'UserProfile',
      'User',
      gql`fragment UserProfile on User { bio avatar }`,
      registry
    );

    const fragments = registry.getFragmentsForType('User');

    expect(fragments.length).toBe(2);
  });

  it('should collect fragment documents', () => {
    const registry = createFragmentRegistry();

    defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const docs = registry.collectFragmentDocuments(['UserFields']);

    expect(docs.length).toBe(1);
    expect(docs[0]).toContain('fragment UserFields on User');
  });

  it('should clear registry', () => {
    const registry = createFragmentRegistry();

    defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    expect(registry.size).toBe(1);

    registry.clear();

    expect(registry.size).toBe(0);
  });
});

describe('defineFragment', () => {
  it('should define a fragment', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    expect(fragment.name).toBe('UserFields');
    expect(fragment.on).toBe('User');
  });
});

describe('Fragment masking', () => {
  it('should mask fragment data', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment<{ id: string; name: string }>(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const data = { id: '1', name: 'Alice' };
    const masked = maskFragment(fragment, data);

    expect(isMaskedFragment(masked)).toBe(true);
    expect(masked.__fragmentName).toBe('UserFields');
    expect(masked.__data).toEqual(data);
  });

  it('should unmask fragment data', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment<{ id: string; name: string }>(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const data = { id: '1', name: 'Alice' };
    const masked = maskFragment(fragment, data);
    const unmasked = unmaskFragment(fragment, masked);

    expect(unmasked).toEqual(data);
  });

  it('should throw error when unmasking with wrong fragment', () => {
    const registry = createFragmentRegistry();

    const fragment1 = defineFragment<{ id: string }>(
      'Fragment1',
      'Type1',
      gql`fragment Fragment1 on Type1 { id }`,
      registry
    );

    const fragment2 = defineFragment<{ id: string }>(
      'Fragment2',
      'Type2',
      gql`fragment Fragment2 on Type2 { id }`,
      registry
    );

    const data = { id: '1' };
    const masked = maskFragment(fragment1, data);

    expect(() => unmaskFragment(fragment2, masked)).toThrow('Fragment mismatch');
  });
});

describe('spreadFragment', () => {
  it('should create fragment spread syntax', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const spread = spreadFragment(fragment, registry);

    expect(spread).toBe('...UserFields');
  });
});

describe('composeFragments', () => {
  it('should compose multiple fragments', () => {
    const registry = createFragmentRegistry();

    const fragment1 = defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const fragment2 = defineFragment(
      'UserProfile',
      'User',
      gql`fragment UserProfile on User { bio avatar }`,
      registry
    );

    const composed = composeFragments([fragment1, fragment2], registry);

    expect(composed).toContain('fragment UserFields on User');
    expect(composed).toContain('fragment UserProfile on User');
  });
});

describe('buildQueryWithFragments', () => {
  it('should build query with fragment definitions', () => {
    const registry = createFragmentRegistry();

    defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const query = gql`
      query GetUsers {
        users {
          ...UserFields
        }
      }
    `;

    const queryWithFragments = buildQueryWithFragments(query, registry);

    expect(queryWithFragments).toContain('query GetUsers');
    expect(queryWithFragments).toContain('fragment UserFields on User');
  });
});

describe('useFragment', () => {
  it('should use fragment with unmasked data', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment<{ id: string; name: string }>(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const data = { id: '1', name: 'Alice' };
    const result = useFragment(fragment, data);

    expect(result).toEqual(data);
  });

  it('should use fragment with masked data', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment<{ id: string; name: string }>(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    const data = { id: '1', name: 'Alice' };
    const masked = maskFragment(fragment, data);
    const result = useFragment(fragment, masked);

    expect(result).toEqual(data);
  });
});

describe('withFragment', () => {
  it('should attach fragment to component', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name }`,
      registry
    );

    function UserCard() {
      return null;
    }

    const ComponentWithFragment = withFragment(UserCard, fragment);

    expect(getComponentFragment(ComponentWithFragment)).toBe(fragment);
  });
});

describe('mergeFragmentData', () => {
  it('should merge multiple fragment data objects', () => {
    const data1 = { id: '1', name: 'Alice' };
    const data2 = { email: 'alice@example.com' };

    const merged = mergeFragmentData(data1, data2);

    expect(merged).toEqual({
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
    });
  });
});

describe('selectFromFragment', () => {
  it('should select data from fragment', () => {
    const registry = createFragmentRegistry();

    const fragment = defineFragment<{ id: string; name: string; email: string }>(
      'UserFields',
      'User',
      gql`fragment UserFields on User { id name email }`,
      registry
    );

    const data = { id: '1', name: 'Alice', email: 'alice@example.com' };

    const selected = selectFromFragment(fragment, data, (d) => d.name);

    expect(selected).toBe('Alice');
  });
});

describe('fragment template helper', () => {
  it('should create fragment definition from template', () => {
    const fragmentFn = fragment`
      fragment UserFields on User {
        id
        name
      }
    `;

    const frag = fragmentFn('UserFields', 'User');

    expect(frag.name).toBe('UserFields');
    expect(frag.on).toBe('User');
  });
});

describe('inlineFragment', () => {
  it('should create inline fragment syntax', () => {
    const inline = inlineFragment('User', 'id name email');

    expect(inline).toContain('... on User');
    expect(inline).toContain('id name email');
  });
});

describe('FragmentUtils', () => {
  it('should check if query uses fragment', () => {
    const query = gql`
      query GetUsers {
        users {
          ...UserFields
        }
      }
    `;

    expect(FragmentUtils.queryUsesFragment(query, 'UserFields')).toBe(true);
    expect(FragmentUtils.queryUsesFragment(query, 'PostFields')).toBe(false);
  });

  it('should deduplicate fragments', () => {
    const document = `
      query GetUser {
        user {
          ...UserFields
        }
      }
      fragment UserFields on User { id }
      fragment UserFields on User { id }
    `;

    const deduplicated = FragmentUtils.deduplicateFragments(document);

    const matches = deduplicated.match(/fragment UserFields/g);
    expect(matches?.length).toBe(1);
  });
});
