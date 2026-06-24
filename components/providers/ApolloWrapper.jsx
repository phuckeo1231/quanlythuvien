'use client';
import { ApolloProvider } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo-client.js';

export default function ApolloWrapper({ children }) {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>;
}
