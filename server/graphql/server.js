const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('graphql-tag');

// Define schema using SDL
const typeDefs = gql`
  type Query {
    hello: String
    greet(name: String!): String
    add(x: Int!, y: Int!): Int
    slowOp(seconds: Int!): String
  }
`;

// Resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello world!',
    greet: (_, { name }) => `Hi, ${name}!`,
    add: (_, { x, y }) => x + y,
    slowOp: async (_, { seconds }) => {
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      return `Slept for ${seconds} seconds`;
    }
  }
};

// Create Apollo Server
async function startServer() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Benchmark GraphQL Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
