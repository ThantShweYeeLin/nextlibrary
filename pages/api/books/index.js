// pages/api/books/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`📚 API ${req.method} /api/books called`);
  
  try {
    const client = await clientPromise;
    const db = client.db('library');
    const booksCollection = db.collection('books');

    switch (req.method) {
      case 'GET':
        try {
          console.log('🔍 Fetching books from database...');
          const books = await booksCollection.find({}).toArray();
          console.log(`✅ Successfully fetched ${books.length} books`);
          
          res.status(200).json({ 
            success: true, 
            data: books 
          });
        } catch (error) {
          console.error('❌ Error fetching books:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch books: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const book = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('📝 Creating new book:', book.title);
          const result = await booksCollection.insertOne(book);
          console.log('✅ Book created with ID:', result.insertedId);
          
          res.status(201).json({ 
            success: true, 
            data: { ...book, _id: result.insertedId } 
          });
        } catch (error) {
          console.error('❌ Error creating book:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to create book: ' + error.message 
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed: ' + error.message 
    });
  }
}