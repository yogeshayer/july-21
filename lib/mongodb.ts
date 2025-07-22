import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI || ""

// Minimal options for Vercel compatibility
const options = {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
}

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found in environment variables')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise && uri) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise || Promise.reject(new Error('MongoDB URI not configured'))
} else {
  // In production mode, it's best to not use a global variable.
  if (uri) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  } else {
    clientPromise = Promise.reject(new Error('MongoDB URI not configured'))
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

export async function getDatabase(): Promise<Db> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB URI not configured')
  }
  const client = await clientPromise
  return client.db("ChoreBoard")
}
