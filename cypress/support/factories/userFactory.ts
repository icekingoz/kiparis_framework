export interface TestUser {
  username: string;
  password: string;
}

export function createUniqueUser(): TestUser {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    username: `kiparis_${suffix}`,
    password: 'Passw0rd!',
  };
}
