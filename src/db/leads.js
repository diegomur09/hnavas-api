import { randomUUID } from 'node:crypto';
import {
  DeleteCommand, GetCommand, PutCommand, QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import ddb from './client.js';
import { leadsTable } from '../config.js';

// Leads are keyed by `_id` with a `byOwner` GSI (owner + createdAt), so:
//  - fetching one lead by _id is a Get (lets DELETE distinguish 404 vs 403),
//  - listing a user's leads is a single Query, newest first,
//  - one user's query can never return another user's leads.

export async function createLead({
  owner, name, email, project, source, locale,
}) {
  const lead = {
    _id: randomUUID(),
    owner,
    name,
    email,
    project,
    source,
    locale,
    createdAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: leadsTable, Item: lead }));
  return lead;
}

export async function listLeadsByOwner(owner) {
  const res = await ddb.send(new QueryCommand({
    TableName: leadsTable,
    IndexName: 'byOwner',
    KeyConditionExpression: '#owner = :owner',
    ExpressionAttributeNames: { '#owner': 'owner' },
    ExpressionAttributeValues: { ':owner': owner },
    ScanIndexForward: false, // newest first
  }));
  return res.Items ?? [];
}

export async function findLeadById(_id) {
  const res = await ddb.send(new GetCommand({ TableName: leadsTable, Key: { _id } }));
  return res.Item ?? null;
}

export async function deleteLeadById(_id) {
  await ddb.send(new DeleteCommand({ TableName: leadsTable, Key: { _id } }));
}
