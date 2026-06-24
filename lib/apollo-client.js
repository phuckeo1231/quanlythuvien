'use client';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

let client;

export function getApolloClient() {
  if (!client) {
    client = new ApolloClient({
      link: new HttpLink({ uri: '/api/graphql' }),
      cache: new InMemoryCache(),
    });
  }
  return client;
}
