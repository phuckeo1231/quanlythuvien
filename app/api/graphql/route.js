import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.js';
import { typeDefs }  from '@/graphql/typeDefs.js';
import { resolvers } from '@/graphql/resolvers.js';

const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    const session = await getServerSession(authOptions);
    return { session };
  },
});

export { handler as GET, handler as POST };
