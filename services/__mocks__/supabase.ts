// Chainable query builder mock
const createQueryBuilder = (resolvedValue: { data: any; error: any } = { data: null, error: null }) => {
  const builder: any = {
    _resolved: resolvedValue,
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => Promise.resolve(builder._resolved)),
    then: function (resolve: any) {
      return Promise.resolve(this._resolved).then(resolve);
    },
  };
  return builder;
};

const createStorageBucket = () => ({
  upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/test-file.jpg' },
  }),
});

const mockAuth = {
  signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  updateUser: jest.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
};

const queryBuilders: Record<string, any> = {};

export const supabase = {
  auth: mockAuth,
  from: jest.fn((table: string) => {
    if (!queryBuilders[table]) {
      queryBuilders[table] = createQueryBuilder();
    }
    return queryBuilders[table];
  }),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: jest.fn().mockReturnValue(createStorageBucket()),
  },
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn(),
};

export function resetSupabaseMocks() {
  Object.keys(queryBuilders).forEach((key) => delete queryBuilders[key]);
  jest.clearAllMocks();
}

export function mockTableResponse(table: string, response: { data: any; error: any }) {
  const builder = createQueryBuilder(response);
  queryBuilders[table] = builder;
  return builder;
}
