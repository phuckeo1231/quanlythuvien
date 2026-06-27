export const typeDefs = `#graphql
  type Book {
    id: ID!
    title: String!
    author: String!
    isbn: String
    category: String
    quantity: Int!
    available: Int!
    publishYear: Int
    publisher: String
    description: String
    imageUrl: String
    createdAt: String
  }

  type Member {
    id: ID!
    name: String!
    email: String!
    phone: String
    address: String
    membershipType: String!
    status: String!
    joinDate: String
    activeLoans: Int
  }

  type Loan {
    id: ID!
    book: Book
    member: Member
    borrowDate: String!
    dueDate: String!
    returnDate: String
    status: String!
    fine: Float
    finePaid: Boolean!
    finePaidAt: String
    extendCount: Int!
    note: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String
  }

  type Stats {
    totalBooks: Int!
    totalMembers: Int!
    activeLoans: Int!
    overdueLoans: Int!
    returnedToday: Int!
    totalFines: Float!
    unpaidFines: Float!
  }

  type BookStat   { book: Book!     count: Int! }
  type MemberStat { member: Member! count: Int! }
  type MonthlyStat { month: String! count: Int! }

  type Reports {
    topBooks: [BookStat!]!
    topMembers: [MemberStat!]!
    monthlyLoans: [MonthlyStat!]!
  }

  type Query {
    books(search: String, category: String, page: Int, limit: Int): BookResult!
    book(id: ID!): Book
    categories: [String!]!

    members(search: String, status: String, page: Int, limit: Int): MemberResult!
    member(id: ID!): Member

    loans(status: String, memberId: ID, page: Int, limit: Int): LoanResult!
    recentLoans(limit: Int): [Loan!]!

    stats: Stats!
    reports: Reports!

    users: [User!]!
  }

  type BookResult   { books: [Book!]!     total: Int! }
  type MemberResult { members: [Member!]! total: Int! }
  type LoanResult   { loans: [Loan!]!     total: Int! }

  type Mutation {
    createBook(input: BookInput!):   Book!
    updateBook(id: ID!, input: BookInput!): Book!
    deleteBook(id: ID!):             Boolean!

    createMember(input: MemberInput!):       Member!
    updateMember(id: ID!, input: MemberInput!): Member!
    deleteMember(id: ID!):                   Boolean!

    borrowBook(bookId: ID!, memberId: ID!, dueDate: String!, note: String): Loan!
    returnBook(loanId: ID!): Loan!
    extendLoan(loanId: ID!, newDueDate: String!): Loan!
    payFine(loanId: ID!): Loan!

    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!
  }

  input BookInput {
    title: String!
    author: String!
    isbn: String
    category: String
    quantity: Int
    publishYear: Int
    publisher: String
    description: String
    imageUrl: String
  }

  input MemberInput {
    name: String!
    email: String!
    phone: String
    address: String
    membershipType: String
    status: String
  }

  input UserInput {
    name: String!
    email: String!
    password: String
    role: String
  }
`;
