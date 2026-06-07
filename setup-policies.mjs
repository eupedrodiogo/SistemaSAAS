import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function setupPolicies() {
  try {
    await client.connect();
    
    // Create policies for the documents bucket
    const queries = [
      `CREATE POLICY "Public Access documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');`,
      `CREATE POLICY "Auth Upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');`,
      `CREATE POLICY "Auth Update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');`,
      `CREATE POLICY "Auth Delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');`
    ];

    for (const q of queries) {
      try {
        await client.query(q);
        console.log("Successfully executed:", q);
      } catch (err) {
        if (err.code === '42710') { // duplicate_object
          console.log("Policy already exists for query:", q);
        } else {
          console.error("Error executing query:", q, err.message);
        }
      }
    }

  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.end();
  }
}

setupPolicies();
