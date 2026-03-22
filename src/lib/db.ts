import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage in serverless environments like Vercel.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  // If we already have a live connection, verify it's still responsive
  if (cached.conn) {
    const readyState = cached.conn.connection.readyState;
    // 1 = connected — verify with a ping before reusing
    if (readyState === 1) {
      try {
        await cached.conn.connection.db?.admin().ping();
        return cached.conn;
      } catch {
        // Ping failed — connection is stale, force reconnect
        console.warn("[dbConnect] stale connection detected, reconnecting…");
        cached.conn = null;
        cached.promise = null;
      }
    }
    // 2 = connecting — wait for the existing promise below
    // 0 or 3 = disconnected / disconnecting — clear and reconnect
    if (readyState !== 2) {
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      // Allow commands to queue while the connection is establishing
      // prevents intermittent empty results on concurrent requests
      bufferCommands: true,
      maxPoolSize: 10,
      // Reduced from 15s — fail faster on Vercel so retries have a chance
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      // Retry reads/writes once on transient failures
      retryReads: true,
      retryWrites: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
