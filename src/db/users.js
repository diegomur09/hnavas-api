import { randomUUID } from 'node:crypto';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import ddb from './client.js';
import { usersTable } from '../config.js';

// Users live in one table keyed by `_id`, with a `byEmail` GSI so signin and
// duplicate-email checks are single queries (never scans).

export async function findUserByEmail(email) {
  const res = await ddb.send(new QueryCommand({
    TableName: usersTable,
    IndexName: 'byEmail',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    Limit: 1,
  }));
  return res.Items?.[0] ?? null;
}

export async function findUserById(_id) {
  const res = await ddb.send(new GetCommand({ TableName: usersTable, Key: { _id } }));
  return res.Item ?? null;
}

export async function createUser({
  name, email, passwordHash, role,
}) {
  const user = {
    _id: randomUUID(),
    name,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: usersTable, Item: user }));
  return user;
}

// Public shape of a user — NEVER include the password hash in a response.
export function toPublicUser(user) {
  return {
    _id: user._id, name: user.name, email: user.email, role: user.role,
  };
}
